import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Settings } from '@shared/schema';
import PDFDocument from 'pdfkit';
import type { Invoice } from '@shared/schema';
import https from 'https';
import http from 'http';

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

// Helper function to fetch image from URL
async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          console.log(`Failed to fetch image: ${url}, status: ${response.statusCode}`);
          resolve(null);
          return;
        }
        
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => {
          console.log(`Error fetching image: ${err.message}`);
          resolve(null);
        });
      }).on('error', (err) => {
        console.log(`Error fetching image: ${err.message}`);
        resolve(null);
      });
    } catch (err) {
      console.log(`Exception fetching image: ${err}`);
      resolve(null);
    }
  });
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate Invoice PDF - Matching BillingTab Professional Design
export async function generateInvoicePDF(invoice: any, settings?: Settings): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
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
    let headerY = 50;
    let shopNameX = 50;
    
    // Fetch and add logo if available
    if (settings?.logoPath && settings.logoPath.trim() !== '') {
      try {
        console.log('🖼️ Fetching logo for PDF:', settings.logoPath);
        const logoBuffer = await fetchImageAsBuffer(settings.logoPath);
        if (logoBuffer) {
          doc.image(logoBuffer, 50, headerY, { width: 60, height: 60 });
          shopNameX = 120; // Move shop name to the right of logo
          console.log('✅ Logo added to PDF');
        } else {
          console.log('⚠️ Logo fetch failed, using text only');
        }
      } catch (err) {
        console.log('❌ Error adding logo to PDF:', err);
      }
    }
    
    doc.fontSize(20).font('Helvetica-Bold').text(shopName, shopNameX, headerY);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb').text('TAX INVOICE', 400, headerY, { align: 'right' });
    
    // Header underline
    doc.moveTo(50, headerY + 25).lineTo(545, headerY + 25).lineWidth(2).stroke('#1e293b');
    
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
    const hasVehicle = Boolean(invoice.vehicleNo?.trim());
    const customerBoxHeight = hasVehicle ? 57 : 45;
    doc.fillColor('#f8fafc').rect(50, currentY, 495, customerBoxHeight).fill();
    currentY += 8;
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text(invoice.customerName || 'Walk-in Customer', 58, currentY);
    currentY += 14;
    doc.fontSize(9).font('Helvetica');
    if (invoice.customerPhone && invoice.customerPhone !== 'N/A') {
      doc.text(`Phone: ${invoice.customerPhone}`, 58, currentY);
      currentY += 12;
    }
    if (hasVehicle) {
      doc.text(`Vehicle No: ${invoice.vehicleNo!.trim()}`, 58, currentY);
    }

    // Items Table
    currentY = 125 + 15 + customerBoxHeight + 20;
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
    
    // Fetch and add signature if available
    if (settings?.signaturePath && settings.signaturePath.trim() !== '') {
      try {
        console.log('✍️ Fetching signature for PDF:', settings.signaturePath);
        const signatureBuffer = await fetchImageAsBuffer(settings.signaturePath);
        if (signatureBuffer) {
          doc.image(signatureBuffer, 420, currentY - 50, { width: 100, height: 40, align: 'center' });
          console.log('✅ Signature added to PDF');
        } else {
          console.log('⚠️ Signature fetch failed, using text only');
        }
      } catch (err) {
        console.log('❌ Error adding signature to PDF:', err);
      }
    }
    
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

// Email Templates - Minimalistic & Clean Design
export function getWelcomeEmailTemplate(username: string, settings?: Settings): string {
  const shopName = settings?.shopName || 'Brothers Enterprises';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${shopName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 40px 32px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; margin: 0 auto 24px; line-height: 48px;">
                <span style="font-size: 24px;">👋</span>
              </div>
              <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 22px; font-weight: 600;">Welcome to ${shopName}!</h1>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Your account is ready to use</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
                <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; line-height: 1.5;">
                  Hello <strong style="color: #0f172a;">${username}</strong>,
                </p>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  Thank you for joining! Your account has been successfully created. You can now log in and start managing your business.
                </p>
              </div>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
                If you have any questions, our support team is here to help.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${shopName}
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
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 40px 32px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #f1f5f9; border-radius: 12px; margin: 0 auto 24px; line-height: 48px;">
                <span style="font-size: 24px;">🔐</span>
              </div>
              <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 22px; font-weight: 600;">Password Reset</h1>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Enter this code to reset your password</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 500;">Your Code</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #0f172a; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${otp}</p>
              </div>
              <p style="margin: 0 0 20px; text-align: center; font-size: 13px; color: #64748b; line-height: 1.5;">
                This code expires in <strong style="color: #0f172a;">10 minutes</strong>.<br>
                If you didn't request this, please ignore this email.
              </p>
              <div style="background: #fffbeb; border-radius: 6px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; text-align: center;">
                  ⚠️ Never share this code with anyone.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${shopName}
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
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 40px 32px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; margin: 0 auto 24px; line-height: 48px;">
                <span style="font-size: 24px;">📄</span>
              </div>
              <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 22px; font-weight: 600;">Invoice Confirmed</h1>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Thank you for your purchase</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
                <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
                  Dear <strong style="color: #0f172a;">${customerName}</strong>,
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 12px; color: #64748b;">Invoice Number</p>
                      <p style="margin: 4px 0 0; font-size: 14px; color: #0f172a; font-weight: 600;">${invoiceNumber}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 12px; color: #64748b;">Date</p>
                      <p style="margin: 4px 0 0; font-size: 14px; color: #0f172a; font-weight: 600;">${new Date().toLocaleDateString('en-IN')}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0;">
                      <p style="margin: 0; font-size: 12px; color: #64748b;">Total Amount</p>
                      <p style="margin: 4px 0 0; font-size: 24px; color: #0f172a; font-weight: 700;">₹${grandTotal}</p>
                    </td>
                  </tr>
                </table>
              </div>
              <div style="background: #eff6ff; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; color: #1e40af; text-align: center;">
                  📎 Your invoice PDF is attached to this email
                </p>
              </div>
              <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
                Questions? Contact our support team anytime.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; text-align: center; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${shopName}
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
