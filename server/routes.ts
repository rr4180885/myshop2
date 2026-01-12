import type { Express } from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProductSchema, insertInvoiceSchema, insertSettingsSchema, insertUserSchema } from "@shared/schema";
import { sendEmail, generateOTP, getWelcomeEmailTemplate, getPasswordResetEmailTemplate, getInvoiceEmailTemplate, generateInvoicePDF } from "./email";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
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
  app.get(api.invoices.list.path, async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.post(api.invoices.create.path, async (req, res) => {
    try {
      const input = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(input);
      
      // Send invoice email if customer email is provided
      if (invoice.customerEmail && invoice.customerEmail.trim() !== '') {
        try {
          const settings = await storage.getSettings();
          
          // Generate PDF
          const pdfBuffer = await generateInvoicePDF(invoice, settings);
          
          // Get email template
          const emailHtml = getInvoiceEmailTemplate(
            invoice.invoiceNumber,
            invoice.customerName || 'Valued Customer',
            invoice.grandTotal.toString(),
            settings
          );
          
          // Send email with PDF attachment
          await sendEmail({
            to: invoice.customerEmail,
            subject: `Invoice ${invoice.invoiceNumber} - ${settings?.shopName || 'Brothers Enterprises'}`,
            html: emailHtml,
            attachments: [{
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              data: pdfBuffer
            }]
          });
          console.log(`✉️ Invoice email sent successfully with PDF attachment`);
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError);
          // Don't fail invoice creation if email fails
        }
      }
      
      res.status(201).json(invoice);
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
      
      // Send welcome email if email is provided
      if (user.email && user.email.trim() !== '') {
        try {
          const settings = await storage.getSettings();
          const emailHtml = getWelcomeEmailTemplate(user.username, settings);
          await sendEmail({
            to: user.email,
            subject: `Welcome to ${settings?.shopName || 'Brothers Enterprises'}!`,
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
