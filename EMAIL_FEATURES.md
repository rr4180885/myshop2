# Email Features Documentation

This document explains the email functionality implemented in the application using Mailgun.

## Features Implemented

### 1. Password Reset with Email OTP

Users can reset their password by requesting an OTP sent to their registered email address.

**API Endpoints:**

- **Request Password Reset**
  - **POST** `/api/auth/request-reset`
  - **Body:** `{ "email": "user@example.com" }`
  - **Response:** OTP sent to email (valid for 10 minutes)

- **Verify OTP**
  - **POST** `/api/auth/verify-otp`
  - **Body:** `{ "email": "user@example.com", "otp": "123456" }`
  - **Response:** `{ "valid": true/false }`

- **Reset Password**
  - **POST** `/api/auth/reset-password`
  - **Body:** `{ "email": "user@example.com", "otp": "123456", "newPassword": "newpass123" }`
  - **Response:** Password reset confirmation

### 2. Welcome Email on User Registration

When a new user is created (with an email address), they automatically receive a professional welcome email with:
- Company logo and branding
- Account credentials
- Platform features overview
- Professional HTML design

### 3. Invoice Email on Billing

When an invoice is created with a customer email, an acknowledgment email is automatically sent containing:
- Invoice summary (invoice number, date, amount)
- Professional HTML template
- Company branding and contact information
- Thank you message

## Configuration

### Mailgun Setup

The application is configured to use Mailgun for sending emails:

```
Domain: sandbox625af6d203784a64bf650ceb7840dcb5.mailgun.org
API Key: 42b8ce75-291b2041
```

### Environment Variables

You can override the default Mailgun settings using environment variables:

```bash
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.mailgun.org
```

### Default Email for Existing Users

The migration script (`server/update-schema.sql`) sets the default email for existing users to: **rr4180885@gmail.com**

## Database Schema Updates

### Users Table

New columns added:
- `email` (TEXT, NOT NULL, DEFAULT '')
- `reset_otp` (TEXT, nullable)
- `reset_otp_expiry` (TEXT, nullable)

### Invoices Table

New column added:
- `customer_email` (TEXT, nullable)

## Running the Database Migration

To update your database schema, run:

```bash
# If using PostgreSQL/Supabase, execute the SQL file:
psql -h your-host -U your-user -d your-database -f server/update-schema.sql

# Or use your database management tool to execute:
# server/update-schema.sql
```

## Email Templates

All email templates are professionally designed with:
- Responsive HTML layout
- Company branding (logo, name, colors)
- Mobile-friendly design
- Clear call-to-actions
- Security tips (for password reset)

### Template Locations

Email templates are defined in `server/email.ts`:
- `getWelcomeEmailTemplate()` - Welcome email for new users
- `getPasswordResetEmailTemplate()` - Password reset with OTP
- `getInvoiceEmailTemplate()` - Invoice acknowledgment

## Usage Examples

### Creating a User with Email

```typescript
POST /api/users
{
  "username": "john_doe",
  "password": "SecurePass123",
  "email": "john@example.com"
}
// Welcome email automatically sent to john@example.com
```

### Creating an Invoice with Email

```typescript
POST /api/invoices
{
  "invoiceNumber": "INV-2026-00001",
  "customerName": "Jane Smith",
  "customerPhone": "+91 9876543210",
  "customerEmail": "jane@example.com",  // Add this field
  "items": "[...]",
  "subtotal": "1000.00",
  "gstAmount": "180.00",
  "grandTotal": "1180.00"
}
// Invoice email automatically sent to jane@example.com
```

### Password Reset Flow

1. User requests password reset:
```typescript
POST /api/auth/request-reset
{
  "email": "user@example.com"
}
```

2. User receives 6-digit OTP via email (valid for 10 minutes)

3. User verifies OTP (optional step):
```typescript
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```

4. User resets password:
```typescript
POST /api/auth/reset-password
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}
```

## Security Features

### OTP Security

- OTPs are 6-digit random numbers
- Valid for only 10 minutes
- Stored hashed in database
- Automatically cleared after successful password reset
- Expired OTPs are rejected

### Email Validation

- Email addresses are validated using Zod schemas
- Email sending failures don't crash the application
- Failed emails are logged for debugging

## Error Handling

The system gracefully handles email failures:
- User/invoice creation continues even if email fails
- Errors are logged to console
- Users receive appropriate error messages

## Customization

### Updating Email Templates

Edit the template functions in `server/email.ts`:
- Modify HTML structure
- Update styling
- Change content
- Add/remove sections

### Changing Email Sender

Update the `from` field in `server/email.ts`:
```typescript
from: `Your Company <noreply@${MAILGUN_DOMAIN}>`
```

## Testing

### Test Email Sending

1. Create a test user with your email
2. Check your inbox for the welcome email
3. Test password reset flow
4. Create an invoice with your email
5. Verify all emails are received

### Mailgun Sandbox Mode

The current setup uses Mailgun sandbox mode. For production:
1. Verify your domain with Mailgun
2. Update `MAILGUN_DOMAIN` environment variable
3. Add authorized recipients in Mailgun dashboard (sandbox mode)

## Troubleshooting

### Emails Not Sending

1. Check Mailgun API key and domain
2. Verify email addresses are valid
3. Check server logs for errors
4. Ensure Mailgun account is active
5. For sandbox mode, verify recipient email in Mailgun dashboard

### Database Errors

1. Run the migration script: `server/update-schema.sql`
2. Verify database connection
3. Check table schemas match definitions

## Future Enhancements

Potential improvements:
- PDF invoice attachments
- Email templates customization UI
- Email queue for bulk sending
- Email delivery status tracking
- Multiple language support
- Custom email templates per shop

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify Mailgun configuration
3. Test with a known working email address
4. Review EMAIL_FEATURES.md documentation

---

**Last Updated:** January 13, 2026
**Version:** 1.0.0
