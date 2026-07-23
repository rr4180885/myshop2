import { type User, type InsertUser, type Product, type InsertProduct, type Invoice, type InsertInvoice, type Settings, type InsertSettings, users, products, invoices, settings } from "@shared/schema";
import { DEFAULT_SETTINGS } from "@shared/shop-config";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { eq, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

function createSessionStore(dbUrl?: string): session.Store {
  if (dbUrl && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
    return new PgSession({
      conObject: {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      },
      createTableIfMissing: false,
      tableName: "user_sessions",
    });
  }

  return new MemoryStore({ checkPeriod: 86400000 });
}

async function ensureSessionTable(db: ReturnType<typeof drizzle>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL,
      sess json NOT NULL,
      expire timestamp(6) NOT NULL,
      CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire)
  `);
}

async function ensureInvoiceMigrations(db: ReturnType<typeof drizzle>) {
  await db.execute(sql`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
  `);
  await db.execute(sql`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vehicle_no TEXT;
  `);
}

export type InvoiceSummary = Omit<Invoice, "items">;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  changeUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean>;
  deleteUser(id: string): Promise<void>;
  setResetOTP(userId: string, otp: string, expiry: string): Promise<void>;
  verifyResetOTP(userId: string, otp: string): Promise<boolean>;
  resetPasswordWithOTP(userId: string, newPassword: string): Promise<void>;
  updateUserEmail(userId: string, email: string): Promise<void>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  listInvoices(): Promise<InvoiceSummary[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getNextInvoiceNumber(): Promise<string>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(updates: InsertSettings): Promise<Settings>;
  
  // Sessions
  sessionStore: session.Store;
}

export class DBStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: session.Store;

  constructor(db: ReturnType<typeof drizzle>, dbUrl: string) {
    this.db = db;
    this.sessionStore = createSessionStore(dbUrl);
  }

  /**
   * Seed initial products - ONLY runs in development or if explicitly enabled
   * In production, this should never run automatically to prevent data loss
   */
  async seedProducts() {
    // PRODUCTION SAFETY: Never auto-seed in production
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
      console.log("⚠️  Skipping seed in production (set ALLOW_SEED=true to override)");
      return;
    }

    try {
      const existingProducts = await this.getProducts();
      // Only seed if database is completely empty
      if (existingProducts.length > 0) {
        console.log(`✓ Found ${existingProducts.length} existing products, skipping seed`);
        return;
      }

      console.log("🌱 Seeding default products (development mode)...");
      const defaultProducts = [
        { name: "Brake Pad Set", brand: "Maruti Swift", code: "BP-MS-001", hsnCode: "8708", stock: 25, purchasePrice: "450", sellingPrice: "650", gstRate: 28 },
        { name: "Air Filter", brand: "Hyundai i20", code: "AF-HI-002", hsnCode: "8708", stock: 15, purchasePrice: "250", sellingPrice: "400", gstRate: 28 },
        { name: "Oil Filter", brand: "Tata Nexon", code: "OF-TN-003", hsnCode: "8708", stock: 30, purchasePrice: "180", sellingPrice: "300", gstRate: 28 },
        { name: "Headlight Bulb", brand: "Maruti Alto", code: "HB-MA-004", hsnCode: "8708", stock: 50, purchasePrice: "80", sellingPrice: "150", gstRate: 18 },
        { name: "Wiper Blade", brand: "Honda City", code: "WB-HC-005", hsnCode: "8708", stock: 20, purchasePrice: "200", sellingPrice: "350", gstRate: 28 },
      ];

      for (const p of defaultProducts) {
        try {
          await this.db.insert(products).values(p).onConflictDoNothing();
        } catch (e) {
          // Product with this code already exists, skip
          console.log(`Product ${p.code} already exists, skipping`);
        }
      }
      console.log("✓ Default products seeded successfully");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error; // Fail fast in development
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user = { ...insertUser, id };
    await this.db.insert(users).values(user);
    return user as User;
  }

  async changeUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const { scrypt, timingSafeEqual } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    
    const user = await this.getUser(id);
    if (!user) return false;
    
    // Verify current password
    const [hashed, salt] = user.password.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
    
    if (!timingSafeEqual(hashedBuf, suppliedBuf)) {
      return false; // Current password incorrect
    }
    
    // Hash new password
    const newSalt = (await import("crypto")).randomBytes(16).toString("hex");
    const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
    const newHashedPassword = `${newHashedBuf.toString("hex")}.${newSalt}`;
    
    await this.db.update(users).set({ password: newHashedPassword }).where(eq(users.id, id));
    return true;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async setResetOTP(userId: string, otp: string, expiry: string): Promise<void> {
    await this.db.update(users).set({ 
      resetOtp: otp, 
      resetOtpExpiry: expiry 
    }).where(eq(users.id, userId));
  }

  async verifyResetOTP(userId: string, otp: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return false;
    }
    
    const now = new Date();
    const expiry = new Date(user.resetOtpExpiry);
    
    if (now > expiry) {
      // OTP expired, clear it
      await this.db.update(users).set({ 
        resetOtp: null, 
        resetOtpExpiry: null 
      }).where(eq(users.id, userId));
      return false;
    }
    
    return user.resetOtp === otp;
  }

  async resetPasswordWithOTP(userId: string, newPassword: string): Promise<void> {
    const { scrypt, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    
    // Hash new password
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    await this.db.update(users).set({ 
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null
    }).where(eq(users.id, userId));
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    await this.db.update(users).set({ email }).where(eq(users.id, userId));
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const result = await this.db.update(products).set(updates).where(eq(products.id, id)).returning();
    if (!result[0]) throw new Error("Product not found");
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return this.db.select().from(invoices);
  }

  async listInvoices(): Promise<InvoiceSummary[]> {
    const rows = await this.db.execute(sql`
      SELECT id, invoice_number, customer_name, customer_phone, customer_email, vehicle_no,
             subtotal, gst_amount, grand_total, created_at
      FROM invoices
      ORDER BY id DESC
    `);

    return (rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as number,
      invoiceNumber: row.invoice_number as string,
      customerName: row.customer_name as string | null,
      customerPhone: row.customer_phone as string | null,
      customerEmail: row.customer_email as string | null,
      vehicleNo: row.vehicle_no as string | null,
      subtotal: String(row.subtotal),
      gstAmount: String(row.gst_amount),
      grandTotal: String(row.grand_total),
      createdAt: row.created_at as string | null,
    }));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const rows = await this.db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(like(invoices.invoiceNumber, `${prefix}%`));

    const maxNum = rows.reduce((max, row) => {
      const num = parseInt(row.invoiceNumber.slice(prefix.length), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);

    return `${prefix}${String(maxNum + 1).padStart(5, "0")}`;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceWithDate: any = {
      ...invoice,
      createdAt: new Date().toISOString()
    };
    const result = await this.db.insert(invoices).values(invoiceWithDate).returning();
    return result[0];
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const result = await this.db.select().from(settings);
    // If no settings exist, create default settings
    if (result.length === 0) {
      const defaultSettings = { ...DEFAULT_SETTINGS };
      const created = await this.db.insert(settings).values(defaultSettings).returning();
      return created[0];
    }
    return result[0];
  }

  async updateSettings(updates: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings();
    const result = await this.db.update(settings).set(updates).where(eq(settings.id, existing.id)).returning();
    return result[0];
  }
}

/**
 * DEPRECATED: In-Memory Storage
 * ⚠️  WARNING: This storage loses ALL data on server restart!
 * Only use for local development/testing, NEVER in production.
 * 
 * This class is kept for development convenience but should be removed
 * once proper database migrations are in place.
 */
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private products = new Map<number, Product>();
  private invoices = new Map<number, Invoice>();
  private settings: Settings;
  private productIdCounter = 1;
  private invoiceIdCounter = 1;
  sessionStore: session.Store;

  constructor() {
    console.warn("⚠️  WARNING: Using in-memory storage - all data will be lost on restart!");
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    this.settings = {
      id: 1,
      ...DEFAULT_SETTINGS,
      updatedAt: null,
    };
    this.seedProducts();
  }

  private seedProducts() {
    const defaultProducts = [
      { name: "Brake Pad Set", brand: "Maruti Swift", code: "BP-MS-001", hsnCode: "8708", stock: 25, purchasePrice: "450", sellingPrice: "650", maxDiscount: "0", gstRate: 28 },
      { name: "Air Filter", brand: "Hyundai i20", code: "AF-HI-002", hsnCode: "8708", stock: 15, purchasePrice: "250", sellingPrice: "400", maxDiscount: "0", gstRate: 28 },
      { name: "Oil Filter", brand: "Tata Nexon", code: "OF-TN-003", hsnCode: "8708", stock: 30, purchasePrice: "180", sellingPrice: "300", maxDiscount: "0", gstRate: 28 },
      { name: "Headlight Bulb", brand: "Maruti Alto", code: "HB-MA-004", hsnCode: "8708", stock: 50, purchasePrice: "80", sellingPrice: "150", maxDiscount: "0", gstRate: 18 },
      { name: "Wiper Blade", brand: "Honda City", code: "WB-HC-005", hsnCode: "8708", stock: 20, purchasePrice: "200", sellingPrice: "350", maxDiscount: "0", gstRate: 28 },
    ];

    defaultProducts.forEach(p => {
      const product: Product = { ...p, id: this.productIdCounter++ };
      this.products.set(product.id, product);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || '',
      isActive: 1,
      resetOtp: null,
      resetOtpExpiry: null,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }
  async changeUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const { scrypt, timingSafeEqual, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    
    const user = this.users.get(id);
    if (!user) return false;
    
    // Verify current password
    const [hashed, salt] = user.password.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
    
    if (!timingSafeEqual(hashedBuf, suppliedBuf)) {
      return false;
    }
    
    // Hash new password
    const newSalt = randomBytes(16).toString("hex");
    const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
    const newHashedPassword = `${newHashedBuf.toString("hex")}.${newSalt}`;
    
    user.password = newHashedPassword;
    this.users.set(id, user);
    return true;
  }
  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async setResetOTP(userId: string, otp: string, expiry: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.resetOtp = otp;
      user.resetOtpExpiry = expiry;
      this.users.set(userId, user);
    }
  }

  async verifyResetOTP(userId: string, otp: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return false;
    }
    
    const now = new Date();
    const expiry = new Date(user.resetOtpExpiry);
    
    if (now > expiry) {
      // OTP expired, clear it
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      this.users.set(userId, user);
      return false;
    }
    
    return user.resetOtp === otp;
  }

  async resetPasswordWithOTP(userId: string, newPassword: string): Promise<void> {
    const { scrypt, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);
    
    const user = this.users.get(userId);
    if (!user) return;
    
    // Hash new password
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    this.users.set(userId, user);
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.email = email;
      this.users.set(userId, user);
    }
  }

  // Products
  async getProducts(): Promise<Product[]> { return Array.from(this.products.values()); }
  async getProduct(id: number): Promise<Product | undefined> { return this.products.get(id); }
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = { ...product, id } as Product;
    this.products.set(id, newProduct);
    return newProduct;
  }
  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }
  async deleteProduct(id: number): Promise<void> { this.products.delete(id); }

  // Invoices
  async getInvoices(): Promise<Invoice[]> { return Array.from(this.invoices.values()); }
  async listInvoices(): Promise<InvoiceSummary[]> {
    return Array.from(this.invoices.values())
      .map(({ items: _items, ...summary }) => summary)
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }
  async getInvoice(id: number): Promise<Invoice | undefined> { return this.invoices.get(id); }
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const nums = Array.from(this.invoices.values())
      .filter((inv) => inv.invoiceNumber.startsWith(prefix))
      .map((inv) => parseInt(inv.invoiceNumber.slice(prefix.length), 10))
      .filter((n) => !Number.isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `${prefix}${String(next).padStart(5, "0")}`;
  }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const newInvoice: Invoice = { 
      ...invoice, 
      id,
      createdAt: new Date().toISOString()
    } as Invoice;
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  // Settings
  async getSettings(): Promise<Settings> { return this.settings; }
  async updateSettings(updates: InsertSettings): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

// Global storage instance
export let storage: IStorage;

export async function initializeStorage() {
  const dbUrl = process.env.DATABASE_URL;

  // PRODUCTION REQUIREMENT: Database URL must be set
  if (!dbUrl) {
    const errorMsg = "❌ FATAL: DATABASE_URL environment variable is not set!";
    console.error(errorMsg);
    console.error("💡 Set DATABASE_URL to your Supabase connection string");
    
    // In production, FAIL FAST - do not fall back to memory storage
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    
    // In development, allow memory storage with explicit warning
    console.warn("⚠️  Using in-memory storage (DEVELOPMENT ONLY)");
    storage = new MemStorage();
    return;
  }

  // Validate it's a PostgreSQL URL
  if (!dbUrl.includes("postgres")) {
    const errorMsg = `❌ FATAL: DATABASE_URL does not appear to be a PostgreSQL connection string: ${dbUrl.substring(0, 20)}...`;
    console.error(errorMsg);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    
    console.warn("⚠️  Falling back to in-memory storage (DEVELOPMENT ONLY)");
    storage = new MemStorage();
    return;
  }

  try {
    console.log("🔌 Initializing PostgreSQL connection...");
    console.log(`📍 Database: PostgreSQL`);
    
    const client = postgres(dbUrl, { 
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
      connect_timeout: 60,  // Increased for better stability
      prepare: false,  // CRITICAL for Supabase transaction pooler (port 6543)
    });
    
    const db = drizzle(client);
    
    // Test the connection with a simple query
    await db.execute(sql`SELECT 1 as test`);
    console.log("✓ Database connection verified");

    await ensureSessionTable(db);
    console.log("✓ Session table ready");

    await ensureInvoiceMigrations(db);
    console.log("✓ Invoice migrations ready");
    
    storage = new DBStorage(db, dbUrl);
    
    // Only seed in development or if explicitly allowed
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_SEED === 'true') {
      await (storage as DBStorage).seedProducts();
    }
    
    console.log("✅ PostgreSQL database initialized successfully");
    
  } catch (error) {
    const errorMsg = "❌ FATAL: Failed to connect to PostgreSQL database";
    console.error(errorMsg, error);
    
    // In production, NEVER fall back to memory storage
    if (process.env.NODE_ENV === 'production') {
      console.error("🚨 Production database connection failed - cannot continue");
      console.error("💡 Verify DATABASE_URL is correct and database is accessible");
      console.error("💡 Check if database tables exist (run: npm run db:init)");
      throw new Error(`${errorMsg}: ${error}`);
    }
    
    // In development, allow fallback with warning
    console.warn("⚠️  Falling back to in-memory storage (DEVELOPMENT ONLY)");
    storage = new MemStorage();
  }
}
