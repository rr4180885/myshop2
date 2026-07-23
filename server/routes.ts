import type { Express } from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProductSchema, insertInvoiceSchema, insertSettingsSchema, insertUserSchema, type Invoice } from "@shared/schema";
import { sendEmail, generateOTP, getWelcomeEmailTemplate, getPasswordResetEmailTemplate, getInvoiceEmailTemplate, generateInvoicePDF } from "./email";
import { DEFAULT_SHOP_NAME, ENABLE_EMAIL } from "@shared/shop-config";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updateStockFromInvoiceItems(itemsJson: string) {
  const items = JSON.parse(itemsJson) as Array<{ id: number; quantity: number; isMisc?: boolean }>;
  for (const item of items) {
    if (item.isMisc) continue;
    const product = await storage.getProduct(item.id);
    if (product) {
      await storage.updateProduct(item.id, { stock: product.stock - item.quantity });
    }
  }
}

async function sendInvoiceEmailAsync(invoice: Invoice) {
  if (!ENABLE_EMAIL) return;
  const settings = await storage.getSettings();
  const pdfBuffer = await generateInvoicePDF(invoice, settings);
  const emailHtml = getInvoiceEmailTemplate(
    invoice.invoiceNumber,
    invoice.customerName || "Valued Customer",
    invoice.grandTotal.toString(),
    settings
  );
  await sendEmail({
    to: invoice.customerEmail!,
    subject: `Invoice ${invoice.invoiceNumber} - ${settings?.shopName || DEFAULT_SHOP_NAME}`,
    html: emailHtml,
    attachments: [{
      filename: `Invoice-${invoice.invoiceNumber}.pdf`,
      data: pdfBuffer,
    }],
  });
  console.log(`✉️ Invoice email sent to ${invoice.customerEmail}`);
}

export async function registerRoutes(app: Express): Promise<void> {
  // Auth middleware
  setupAuth(app);

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Invoices
  app.get(api.invoices.list.path, async (_req, res) => {
    try {
      const invoiceList = await storage.listInvoices();
      res.json(invoiceList);
    } catch (err) {
      console.error("Failed to list invoices:", err);
      res.status(500).json({ message: "Failed to load invoices" });
    }
  });

  app.get(api.invoices.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.get("/api/analytics/sales", async (req, res) => {
    const period = req.query.period === "day" ? "day" : "month";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const cutoff = period === "day" ? startOfToday : startOfMonth;

    const [allInvoices, allProducts] = await Promise.all([
      storage.getInvoices(),
      storage.getProducts(),
    ]);

    const periodInvoices = allInvoices.filter((inv) => {
      const invDate = new Date(inv.createdAt ?? 0);
      return invDate >= cutoff;
    });

    let totalSales = 0;
    let totalProfit = 0;
    const productsSoldMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();

    for (const invoice of periodInvoices) {
      const items = JSON.parse(invoice.items) as Array<{
        id: number;
        name: string;
        quantity: number;
        sellingPrice: number;
        isMisc?: boolean;
      }>;
      totalSales += Number(invoice.grandTotal);

      for (const item of items) {
        if (item.isMisc) continue;
        const product = allProducts.find((p) => p.id === item.id);
        if (!product) continue;

        const quantity = Number(item.quantity) || 0;
        const sellingPrice = Number(item.sellingPrice) || 0;
        const purchasePrice = Number(product.purchasePrice) || 0;
        const revenue = quantity * sellingPrice;
        const profit = quantity * (sellingPrice - purchasePrice);
        totalProfit += profit;

        const existing = productsSoldMap.get(item.name);
        if (existing) {
          existing.quantity += quantity;
          existing.revenue += revenue;
          existing.profit += profit;
        } else {
          productsSoldMap.set(item.name, { name: item.name, quantity, revenue, profit });
        }
      }
    }

    const topProducts = Array.from(productsSoldMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      totalSales,
      totalProfit,
      invoiceCount: periodInvoices.length,
      topProducts,
    });
  });

  app.post(api.invoices.create.path, async (req, res) => {
    try {
      const input = insertInvoiceSchema.parse(req.body);
      const invoiceNumber = await storage.getNextInvoiceNumber();
      const invoice = await storage.createInvoice({ ...input, invoiceNumber });
      await updateStockFromInvoiceItems(input.items);
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      const pgCode = (err as { code?: string })?.code;
      if (pgCode === "23505") {
        return res.status(409).json({ message: "Invoice already exists. Please try again." });
      }
      console.error("Invoice creation failed:", err);
      return res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.post("/api/invoices/:id/send-email", async (req, res) => {
    try {
      if (!ENABLE_EMAIL) {
        return res.status(503).json({ message: "Email is disabled for this shop" });
      }
      const id = Number(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (!invoice.customerEmail?.trim()) {
        return res.status(400).json({ message: "No customer email on this invoice" });
      }
      await sendInvoiceEmailAsync(invoice);
      res.json({ message: "Invoice email sent" });
    } catch (err) {
      console.error("Failed to send invoice email:", err);
      return res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // Settings
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, async (req, res) => {
    try {
      const updates = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(updates);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // User Management
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const users = await storage.getUsers();
    // Don't send passwords to client
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const input = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      const { password, ...sanitizedUser } = user;
      
      // Send welcome email if email is provided and email is enabled for this shop
      if (ENABLE_EMAIL && user.email && user.email.trim() !== '') {
        try {
          const settings = await storage.getSettings();
          const emailHtml = getWelcomeEmailTemplate(user.username, settings);
          await sendEmail({
            to: user.email,
            subject: `Welcome to ${settings?.shopName || DEFAULT_SHOP_NAME}!`,
            html: emailHtml,
          });
          console.log(`✉️ Welcome email sent successfully`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail user creation if email fails
        }
      }
      
      res.status(201).json(sanitizedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.users.changePassword.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.params.id;
      const { currentPassword, newPassword } = req.body;
      
      const success = await storage.changeUserPassword(userId, currentPassword, newPassword);
      if (success) {
        res.json({ message: "Password changed successfully" });
      } else {
        res.status(401).json({ message: "Current password is incorrect" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.params.id;
    // Prevent deleting currently logged in user
    if ((req.user as any).id === userId) {
      return res.status(400).json({ message: "Cannot delete currently logged in user" });
    }
    await storage.deleteUser(userId);
    res.sendStatus(204);
  });

  // Password Reset Routes
  app.post(api.auth.requestPasswordReset.path, async (req, res) => {
    try {
      if (!ENABLE_EMAIL) {
        return res.status(503).json({
          message: "Password reset by email is disabled. Contact your admin to change your password.",
        });
      }

      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No user found with this email address" });
      }

      // Generate OTP and set expiry (10 minutes)
      const otp = generateOTP();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      await storage.setResetOTP(user.id, otp, expiry);

      // Send email with OTP
      try {
        const settings = await storage.getSettings();
        const emailHtml = getPasswordResetEmailTemplate(user.username, otp, settings);
        await sendEmail({
          to: email,
          subject: 'Password Reset Request',
          html: emailHtml,
        });
        console.log(`✉️ Password reset OTP sent successfully`);
        res.json({ message: "Password reset OTP has been sent to your email" });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return res.status(500).json({ message: "Failed to send email. Please try again later." });
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  app.post(api.auth.verifyOTP.path, async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No user found with this email address" });
      }

      const valid = await storage.verifyResetOTP(user.id, otp);
      res.json({ message: valid ? "OTP verified successfully" : "Invalid or expired OTP", valid });
    } catch (err) {
      console.error('OTP verification error:', err);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No user found with this email address" });
      }

      const valid = await storage.verifyResetOTP(user.id, otp);
      if (!valid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.resetPasswordWithOTP(user.id, newPassword);
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      console.error('Password reset error:', err);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });
}
