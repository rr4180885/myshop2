import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Settings } from '@shared/schema';
import PDFDocument from 'pdfkit';
import type { Invoice } from '@shared/schema';

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

// Generate Invoice PDF - Matching BillingTab Professional Design
export async function generateInvoicePDF(invoice: any, settings?: Settings): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const shopName = settings?.shopName || 'Brothers Enterprises';
    const shopAddress = settings?.shopAddress || '';
    const shopPhone = settings?.shopPhone || '';
    const shopGSTIN = settings?.shopGSTIN || '';

    // Parse items if they're JSON string
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

    // Header with Logo and Shop Name
    doc.fontSize(20).font('Helvetica-Bold').text(shopName, 50, 50);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb').text('TAX INVOICE', 400, 50, { align: 'right' });
    
    // Header underline
    doc.moveTo(50, 75).lineTo(545, 75).lineWidth(2).stroke('#1e293b');
    
    // Shop Details (left) and Invoice Details (right)
    let currentY = 85;
    doc.fontSize(9).fillColor('#000000').font('Helvetica');
    if (shopAddress) doc.text(shopAddress, 50, currentY, { width: 250 });
    currentY += 12;
    if (shopGSTIN) doc.text(`GSTIN: ${shopGSTIN}`, 50, currentY);
    currentY += 12;
    if (shopPhone) doc.text(`Phone: ${shopPhone}`, 50, currentY);

    // Invoice details on right
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Invoice #:', 380, 85);
    doc.font('Helvetica').text(invoice.invoiceNumber, 450, 85);
    doc.font('Helvetica-Bold').text('Date:', 380, 97);
    doc.font('Helvetica').text(new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN'), 450, 97);

    // Customer Details
    currentY = 125;
    doc.fontSize(9).font('Helvetica-Bold').text('BILL TO:', 50, currentY);
    currentY += 15;
    doc.fillColor('#f8fafc').rect(50, currentY, 495, 45).fill();
    currentY += 8;
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text(invoice.customerName || 'Walk-in Customer', 58, currentY);
    currentY += 14;
    doc.fontSize(9).font('Helvetica');
    if (invoice.customerPhone && invoice.customerPhone !== 'N/A') {
      doc.text(`Phone: ${invoice.customerPhone}`, 58, currentY);
    }

    // Items Table
    currentY = 190;
    const tableTop = currentY;
    
    // Table Header
    doc.rect(50, tableTop, 495, 20).fill('#1e293b');
    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('#', 55, tableTop + 6, { width: 20 });
    doc.text('Item Description', 80, tableTop + 6, { width: 180 });
    doc.text('HSN', 265, tableTop + 6, { width: 50, align: 'center' });
    doc.text('Qty', 320, tableTop + 6, { width: 35, align: 'center' });
    doc.text('Rate', 360, tableTop + 6, { width: 60, align: 'right' });
    if (!invoice.hideGST) {
      doc.text('GST%', 425, tableTop + 6, { width: 40, align: 'center' });
    }
    doc.text('Amount', 470, tableTop + 6, { width: 70, align: 'right' });

    // Table Items
    currentY = tableTop + 25;
    doc.fillColor('#000000');
    
    items.forEach((item: any, index: number) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const qty = Number(item.quantity) || 0;
      const rate = Number(item.sellingPrice) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const amount = Number(item.amount) || (qty * rate);

      // Row background (alternating)
      if (index % 2 === 0) {
        doc.rect(50, currentY - 2, 495, 20).fill('#f8fafc');
      }

      doc.fontSize(8).fillColor('#000000').font('Helvetica');
      doc.text((index + 1).toString(), 55, currentY, { width: 20 });
      
      // Item name and code
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text(item.name || 'Product', 80, currentY, { width: 180 });
      doc.fontSize(7).font('Helvetica').fillColor('#64748b');
      doc.text(`Code: ${item.code}`, 80, currentY + 9, { width: 180 });
      
      doc.fillColor('#000000').fontSize(8);
      doc.text(item.hsnCode || '8708', 265, currentY, { width: 50, align: 'center' });
      doc.text(qty.toString(), 320, currentY, { width: 35, align: 'center' });
      doc.text(`₹${invoice.hideGST ? (rate * qty / qty).toFixed(2) : rate.toFixed(2)}`, 360, currentY, { width: 60, align: 'right' });
      if (!invoice.hideGST) {
        doc.text(`${gstRate}%`, 425, currentY, { width: 40, align: 'center' });
      }
      doc.font('Helvetica-Bold');
      const displayAmount = invoice.hideGST ? (rate * qty * (100 / (100 + gstRate))).toFixed(2) : amount.toFixed(2);
      doc.text(`₹${displayAmount}`, 470, currentY, { width: 70, align: 'right' });

      currentY += 22;
    });

    // Table border
    doc.rect(50, tableTop, 495, currentY - tableTop).stroke('#e2e8f0');

    // Totals Section
    currentY += 10;
    const totalsX = 350;
    doc.rect(totalsX, currentY, 195, invoice.hideGST ? 50 : 70).fill('#f8fafc').stroke('#e2e8f0');
    
    currentY += 10;
    doc.fontSize(9).fillColor('#000000').font('Helvetica');
    
    if (!invoice.hideGST) {
      doc.text('Subtotal:', totalsX + 10, currentY);
      doc.font('Helvetica-Bold').text(`₹${Number(invoice.subtotal).toFixed(2)}`, totalsX + 10, currentY, { width: 175, align: 'right' });
      currentY += 15;
      
      doc.font('Helvetica').text('GST Amount:', totalsX + 10, currentY);
      doc.font('Helvetica-Bold').text(`₹${Number(invoice.gstAmount).toFixed(2)}`, totalsX + 10, currentY, { width: 175, align: 'right' });
      currentY += 20;
    } else {
      currentY += 5;
    }
    
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(invoice.hideGST ? 'Total:' : 'Grand Total:', totalsX + 10, currentY);
    doc.fillColor('#2563eb').fontSize(13);
    const displayTotal = invoice.hideGST ? Number(invoice.subtotal).toFixed(2) : Number(invoice.grandTotal).toFixed(2);
    doc.text(`₹${displayTotal}`, totalsX + 10, currentY, { width: 175, align: 'right' });

    // Terms & Conditions
    currentY += 40;
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }

    doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
    doc.text('TERMS & CONDITIONS:', 50, currentY);
    currentY += 15;
    doc.fontSize(8).font('Helvetica').fillColor('#475569');
    if (settings?.customText1) {
      doc.text(`• ${settings.customText1}`, 50, currentY, { width: 495 });
      currentY += 12;
    }
    if (settings?.customText2) {
      doc.text(`• ${settings.customText2}`, 50, currentY, { width: 495 });
      currentY += 12;
    }
    if (settings?.customText3) {
      doc.text(`• ${settings.customText3}`, 50, currentY, { width: 495 });
    }

    // Signature Section
    currentY = doc.page.height - 100;
    doc.fontSize(8).fillColor('#000000').font('Helvetica-Bold');
    doc.text('Authorized Signature', 420, currentY, { width: 125, align: 'center' });
    doc.moveTo(420, currentY - 5).lineTo(545, currentY - 5).stroke('#94a3b8');

    // Footer
    doc.fontSize(8).fillColor('#64748b').font('Helvetica');
    doc.text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center', width: 495 });
    doc.text('This is a computer-generated invoice', 50, doc.page.height - 38, { align: 'center', width: 495 });

    doc.end();
  });
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 40px; text-align: center;">
              ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" style="max-width: 120px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🎉 Welcome Aboard!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${shopName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #1a202c;">
                Hello <strong style="color: #10b981;">${username}</strong>!
              </p>
              
              <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Thank you for joining ${shopName}! We're thrilled to have you as part of our community. Your account has been successfully created and is ready to use.
              </p>
              
              <!-- Account Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 25px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #10b981; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Account Details</p>
                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #1a202c;">
                      <strong>Username:</strong> <span style="color: #10b981;">${username}</span>
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #1a202c;">
                      <strong>Status:</strong> <span style="color: #10b981;">✓ Active</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                You can now log in to your account and start managing your business operations with our comprehensive platform.
              </p>
              
              <!-- Features Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #f7fafc; border-radius: 12px; padding: 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; color: #2d3748; font-weight: 600; text-align: center;">✨ What You Can Do</p>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
                            <strong style="color: #10b981;">📦</strong> Manage inventory and products
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
                            <strong style="color: #10b981;">📄</strong> Create and track invoices
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
                            <strong style="color: #10b981;">📊</strong> Monitor sales analytics
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
                            <strong style="color: #10b981;">⚙️</strong> Customize settings
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
                            <strong style="color: #10b981;">📈</strong> Generate detailed reports
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Support Note -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                      <strong>💬 Need Help?</strong> If you have any questions or need assistance, our support team is here to help you get started!
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 10px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We're excited to see what you'll achieve!
              </p>
              
              <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Best regards,<br>
                <strong style="color: #10b981;">The ${shopName} Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #718096;">
                &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
              ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" style="max-width: 120px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🔐 Password Reset</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${shopName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1a202c;">
                Hello <strong style="color: #667eea;">${username}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We received a request to reset your password. Use the verification code below to proceed with resetting your password.
              </p>
              
              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%); border: 3px solid #667eea; border-radius: 12px; padding: 40px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #667eea; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Your Verification Code</p>
                    <div style="font-size: 48px; font-weight: 800; color: #667eea; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; margin: 20px 0;">${otp}</div>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #718096;">
                      <strong>⏱️ Valid for 10 minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #c53030; font-weight: 600;">
                      ⚠️ Security Notice
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #742a2a;">
                      If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Tips -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #f7fafc; border-radius: 8px; padding: 25px;">
                    <p style="margin: 0 0 15px 0; font-size: 16px; color: #2d3748; font-weight: 600;">🛡️ Security Tips:</p>
                    <ul style="margin: 0; padding: 0 0 0 20px;">
                      <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.6; color: #4a5568;">Never share your verification code with anyone</li>
                      <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.6; color: #4a5568;">Our team will never ask for your OTP</li>
                      <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.6; color: #4a5568;">Always use a strong, unique password</li>
                      <li style="margin-bottom: 0; font-size: 14px; line-height: 1.6; color: #4a5568;">Change your password regularly</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 10px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Need help? Contact our support team.
              </p>
              
              <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Best regards,<br>
                <strong style="color: #667eea;">The ${shopName} Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #718096;">
                &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 50px 40px; text-align: center;">
              ${shopLogo ? `<img src="${shopLogo}" alt="${shopName}" style="max-width: 120px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📄 Invoice Confirmation</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${shopName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <p style="margin: 0 0 10px 0; font-size: 18px; line-height: 1.6; color: #1a202c; text-align: center;">
                <strong style="font-size: 24px; color: #3b82f6;">🎉 Thank You!</strong>
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a5568; text-align: center;">
                Dear <strong style="color: #3b82f6;">${customerName}</strong>
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Thank you for your recent purchase! We truly appreciate your business and trust in ${shopName}. Your invoice has been successfully generated.
              </p>
              
              <!-- Invoice Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 3px solid #3b82f6; border-radius: 12px; padding: 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; color: #1e40af; font-weight: 600; text-align: center;">Invoice Summary</p>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #93c5fd;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #64748b; font-weight: 500;">Invoice Number:</td>
                              <td style="font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #93c5fd;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #64748b; font-weight: 500;">Date:</td>
                              <td style="font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${new Date().toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #93c5fd;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="font-size: 14px; color: #64748b; font-weight: 500;">Customer:</td>
                              <td style="font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${customerName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 0 0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="font-size: 16px; color: #1e40af; font-weight: 600;">Total Amount:</td>
                              <td style="font-size: 24px; color: #3b82f6; font-weight: 800; text-align: right;">₹${grandTotal}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Attachment Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #0c4a6e; font-weight: 600;">
                      📎 Invoice Document
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #164e63;">
                      Your detailed invoice is attached to this email in PDF format for your records.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We hope you're satisfied with your purchase. If you have any questions or concerns about your invoice, please don't hesitate to reach out to us.
              </p>
              
              ${shopAddress || shopPhone ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #f7fafc; border-radius: 8px; padding: 25px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 16px; color: #2d3748; font-weight: 600;">📞 Contact Us</p>
                    ${shopAddress ? `<p style="margin: 8px 0; font-size: 14px; color: #4a5568; line-height: 1.6;">📍 ${shopAddress}</p>` : ''}
                    ${shopPhone ? `<p style="margin: 8px 0; font-size: 14px; color: #4a5568; line-height: 1.6;">☎️ ${shopPhone}</p>` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5568; text-align: center;">
                <strong>Thank you for choosing ${shopName}!</strong><br>
                We look forward to serving you again.
              </p>
              
              <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Best regards,<br>
                <strong style="color: #3b82f6;">The ${shopName} Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #718096;">
                &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
