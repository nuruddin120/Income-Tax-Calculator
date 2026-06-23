const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // CORS (same-origin for Vercel, but safe to set)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { email, pdfBase64, filename, timestamp, source } = req.body;

  if (!email || !pdfBase64) {
    return res.status(400).json({ error: 'Missing email or PDF data' });
  }

  // ── 1. Gmail SMTP দিয়ে PDF পাঠাও ──────────────────
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD   // Gmail App Password (2FA লাগবে)
    }
  });

  await transporter.sendMail({
    from   : `"IncoTax Solutions" <${process.env.GMAIL_USER}>`,
    to     : email,
    subject: 'আপনার আয়কর হিসাব — IncoTax Solutions',
    html   : `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1e293b">
        <div style="background:#0b3d2e;padding:24px 28px;border-radius:10px 10px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">IncoTax Solutions</h2>
          <p style="color:#86efac;margin:4px 0 0;font-size:13px">Income Tax Calculator</p>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 10px 10px;border:1px solid #e2e8f0">
          <p style="margin:0 0 14px">আস-সালামু আলাইকুম,</p>
          <p style="margin:0 0 14px">আপনার অনুরোধ করা <strong>বিস্তারিত আয়কর হিসাব (AY 2026-27 ও 2027-28)</strong> এই ইমেইলের সাথে পিডিএফ হিসেবে সংযুক্ত করা হলো।</p>
          <p style="margin:0 0 14px">আয়কর রিটার্ন দাখিলে সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন:</p>
          <p style="margin:0 0 6px">📱 <a href="https://wa.me/8801521222707" style="color:#0b3d2e">WhatsApp: 01521 222 707</a></p>
          <p style="margin:0 0 20px">🔗 <a href="https://www.linkedin.com/in/nmahmudcu/" style="color:#0b3d2e">LinkedIn Profile</a></p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
          <p style="margin:0;font-size:12px;color:#64748b">
            Md. Nur Uddin Mahmud — Income Tax Practitioner<br>
            BBA &amp; MBA, University of Chittagong
          </p>
        </div>
      </div>
    `,
    attachments: [{
      filename   : filename || 'income-tax.pdf',
      content    : Buffer.from(pdfBase64, 'base64'),
      contentType: 'application/pdf'
    }]
  });

  // ── 2. Google Sheets-এ ট্র্যাক করো (optional) ────────
  const sheetsUrl = process.env.APPS_SCRIPT_URL;
  if (sheetsUrl) {
    try {
      await fetch(sheetsUrl, {
        method : 'POST',
        body   : JSON.stringify({ email, timestamp, source }),
      }).catch(() => {});
    } catch (_) {}
  }

  return res.status(200).json({ status: 'success' });
};
