/**
 * Per-shop deployment config.
 *
 * This branch (`deploy/rahul/vercel`) is for Saha Electricals.
 * Brothers Enterprises lives on `deploy/vercel` with its own DB + Vercel project.
 *
 * Override at deploy time with SHOP_NAME / ENABLE_EMAIL if needed.
 * Client uses the compile-time defaults from this file (same for Vite builds).
 */

function envFlag(name: string, fallback: boolean): boolean {
  if (typeof process === "undefined" || !process.env) return fallback;
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function envString(name: string, fallback: string): string {
  if (typeof process === "undefined" || !process.env) return fallback;
  const raw = process.env[name]?.trim();
  return raw || fallback;
}

/** Default shop display name for this deployment. */
export const DEFAULT_SHOP_NAME = envString("SHOP_NAME", "Saha Electricals");

export const DEFAULT_SHOP_PHONE = envString("SHOP_PHONE", "+91 98765 43210");
export const DEFAULT_SHOP_GSTIN = envString("SHOP_GSTIN", "29XXXXX1234X1Z5");

/**
 * When false: no welcome emails, no forgot-password OTP, no invoice emails.
 * Saha Electricals ships with email disabled.
 */
export const ENABLE_EMAIL = envFlag("ENABLE_EMAIL", false);

export const DEFAULT_SETTINGS = {
  shopName: DEFAULT_SHOP_NAME,
  shopAddress: "",
  shopPhone: DEFAULT_SHOP_PHONE,
  shopGSTIN: DEFAULT_SHOP_GSTIN,
  customText1: "All goods once sold will not be taken back",
  customText2: "Warranty as per manufacturer terms",
  customText3: "Payment due within 30 days",
  logoPath: "",
  signaturePath: "",
} as const;
