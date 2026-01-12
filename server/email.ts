import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Settings } from '@shared/schema';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '42b8ce75-291b2041';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox625af6d203784a64bf650ceb7840dcb5.mailgun.org';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    data: Buffer;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const messageData = {
      from: `Brothers Enterprises <noreply@${MAILGUN_DOMAIN}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.attachments && { attachment: options.attachments }),
    };

    const response = await mg.messages.create(MAILGUN_DOMAIN, messageData);
    console.log('Email sent successfully:', response);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email Templates
export function getWelcomeEmailTemplate(username: string, settings?: Settings): string {
  const shopName = settings?.shopName || 'Brothers Enterprises';
  const shopLogo = settings?.logoPath || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${shopName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-message {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message-text {
      font-size: 16px;
      color: #555;
      margin-bottom: 15px;
    }
    .credentials-box {
      background: #f8f9ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .credentials-box p {
      margin: 8px 0;
      font-size: 15px;
    }
    .credentials-box strong {
      color: #667eea;
    }
    .button {
      display: inline-block;
      padding: 14px 35px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .features {
      background: #f8f9ff;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .features h3 {
      color: #667eea;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #777;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" class="logo">` : ''}
      <h1>${shopName}</h1>
    </div>
    
    <div class="content">
      <div class="welcome-message">Welcome to Our Platform!</div>
      
      <p class="message-text">Dear <strong>${username}</strong>,</p>
      
      <p class="message-text">
        Thank you for registering with ${shopName}! We're excited to have you on board. 
        Your account has been successfully created and is now ready to use.
      </p>
      
      <div class="credentials-box">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Account Status:</strong> Active ✓</p>
      </div>
      
      <p class="message-text">
        You can now log in to your account and start managing your business operations 
        with our comprehensive platform.
      </p>
      
      <div class="features">
        <h3>What You Can Do:</h3>
        <ul>
          <li>Manage inventory and products</li>
          <li>Create and track invoices</li>
          <li>Monitor sales analytics</li>
          <li>Customize settings</li>
          <li>Generate reports</li>
        </ul>
      </div>
      
      <p class="message-text">
        If you have any questions or need assistance, please don't hesitate to reach out 
        to our support team.
      </p>
      
      <p class="message-text">
        Best regards,<br>
        <strong>The ${shopName} Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailTemplate(username: string, otp: string, settings?: Settings): string {
  const shopName = settings?.shopName || 'Brothers Enterprises';
  const shopLogo = settings?.logoPath || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ${shopName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-message {
      font-size: 18px;
      color: #f5576c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message-text {
      font-size: 16px;
      color: #555;
      margin-bottom: 15px;
    }
    .otp-box {
      background: linear-gradient(135deg, #fff5f7 0%, #ffe5e9 100%);
      border: 2px solid #f5576c;
      padding: 30px;
      margin: 25px 0;
      border-radius: 10px;
      text-align: center;
    }
    .otp-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #f5576c;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
    }
    .otp-validity {
      font-size: 13px;
      color: #888;
      margin-top: 10px;
    }
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .warning-box p {
      margin: 5px 0;
      font-size: 14px;
      color: #856404;
    }
    .security-tips {
      background: #f8f9fa;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .security-tips h3 {
      color: #f5576c;
      font-size: 16px;
      margin-bottom: 12px;
    }
    .security-tips ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .security-tips li {
      padding: 6px 0;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
    }
    .security-tips li:before {
      content: "🔒";
      position: absolute;
      left: 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" class="logo">` : ''}
      <h1>${shopName}</h1>
    </div>
    
    <div class="content">
      <div class="alert-message">Password Reset Request</div>
      
      <p class="message-text">Dear <strong>${username}</strong>,</p>
      
      <p class="message-text">
        We received a request to reset your password. Use the OTP (One-Time Password) below 
        to proceed with resetting your password.
      </p>
      
      <div class="otp-box">
        <div class="otp-label">Your OTP Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">⏱️ Valid for 10 minutes</div>
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ Important:</strong></p>
        <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
      
      <div class="security-tips">
        <h3>Security Tips:</h3>
        <ul>
          <li>Never share your OTP with anyone</li>
          <li>Our team will never ask for your OTP</li>
          <li>Always use a strong, unique password</li>
          <li>Enable two-factor authentication when available</li>
        </ul>
      </div>
      
      <p class="message-text">
        If you're experiencing any issues or didn't request this reset, please contact 
        our support team immediately.
      </p>
      
      <p class="message-text">
        Best regards,<br>
        <strong>The ${shopName} Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getInvoiceEmailTemplate(
  invoiceNumber: string,
  customerName: string,
  grandTotal: string,
  settings?: Settings
): string {
  const shopName = settings?.shopName || 'Brothers Enterprises';
  const shopLogo = settings?.logoPath || '';
  const shopAddress = settings?.shopAddress || '';
  const shopPhone = settings?.shopPhone || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - ${shopName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .thank-you-message {
      font-size: 20px;
      color: #667eea;
      margin-bottom: 20px;
      font-weight: 600;
      text-align: center;
    }
    .message-text {
      font-size: 16px;
      color: #555;
      margin-bottom: 15px;
    }
    .invoice-summary {
      background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
      border: 2px solid #667eea;
      padding: 25px;
      margin: 25px 0;
      border-radius: 10px;
    }
    .invoice-summary h3 {
      color: #667eea;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 18px;
    }
    .invoice-detail {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #d0d7ff;
    }
    .invoice-detail:last-child {
      border-bottom: none;
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #667eea;
    }
    .invoice-detail .label {
      font-weight: 500;
      color: #666;
    }
    .invoice-detail .value {
      font-weight: 600;
      color: #333;
    }
    .invoice-detail.total .value {
      font-size: 22px;
      color: #667eea;
    }
    .attachment-notice {
      background: #e7f3ff;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .attachment-notice p {
      margin: 5px 0;
      font-size: 14px;
      color: #0c5a99;
    }
    .contact-info {
      background: #f8f9fa;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
      text-align: center;
    }
    .contact-info h3 {
      color: #667eea;
      font-size: 16px;
      margin-bottom: 12px;
    }
    .contact-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #777;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" class="logo">` : ''}
      <h1>${shopName}</h1>
      <p>Thank You for Your Purchase!</p>
    </div>
    
    <div class="content">
      <div class="thank-you-message">🎉 Purchase Confirmed!</div>
      
      <p class="message-text">Dear <strong>${customerName}</strong>,</p>
      
      <p class="message-text">
        Thank you for your recent purchase! We truly appreciate your business and trust in 
        ${shopName}. Your invoice has been generated and is attached to this email.
      </p>
      
      <div class="invoice-summary">
        <h3>Invoice Summary</h3>
        <div class="invoice-detail">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoiceNumber}</span>
        </div>
        <div class="invoice-detail">
          <span class="label">Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="invoice-detail">
          <span class="label">Customer:</span>
          <span class="value">${customerName}</span>
        </div>
        <div class="invoice-detail total">
          <span class="label">Total Amount:</span>
          <span class="value">₹${grandTotal}</span>
        </div>
      </div>
      
      <div class="attachment-notice">
        <p><strong>📎 Invoice Attached</strong></p>
        <p>Please find your detailed invoice attached to this email in PDF format.</p>
      </div>
      
      <p class="message-text">
        We hope you're satisfied with your purchase. If you have any questions or concerns 
        about your invoice, please don't hesitate to contact us.
      </p>
      
      ${shopAddress || shopPhone ? `
      <div class="contact-info">
        <h3>Contact Us</h3>
        ${shopAddress ? `<p>📍 ${shopAddress}</p>` : ''}
        ${shopPhone ? `<p>📞 ${shopPhone}</p>` : ''}
      </div>
      ` : ''}
      
      <p class="message-text" style="text-align: center; margin-top: 30px;">
        Thank you for choosing ${shopName}!<br>
        We look forward to serving you again.
      </p>
      
      <p class="message-text">
        Best regards,<br>
        <strong>The ${shopName} Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}
