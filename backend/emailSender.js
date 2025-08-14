// backend/emailSender.js
const nodemailer = require('nodemailer');

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });
}

async function sendPackets({ guestEmail, subject, htmlBody, packets, extraRecipients = [] }) {
  // Default recipients from .env (comma-separated)
  const defaultRecipients = (process.env.DEFAULT_RECIPIENTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // TO = guest email + default recipients
  const toList = [...(guestEmail ? [guestEmail] : []), ...defaultRecipients];

  // CC = any extra recipients passed in
  const ccList = extraRecipients.filter(Boolean);

  const transporter = makeTransport();
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: toList,
    cc: ccList,
    subject,
    html: htmlBody,
    attachments: packets.map(p => ({
      filename: p.filename,
      content: Buffer.from(p.bytes),
      contentType: 'application/pdf'
    })),
  });
}

module.exports = { sendPackets };