-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS reset_otp TEXT,
ADD COLUMN IF NOT EXISTS reset_otp_expiry TEXT;

-- Add customer_email column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add vehicle_no column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS vehicle_no TEXT;

-- Update existing users with default email
UPDATE users 
SET email = 'rr4180885@gmail.com' 
WHERE email = '' OR email IS NULL;
