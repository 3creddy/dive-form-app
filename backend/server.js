// --- Load env early
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Helpers
const { format } = require('date-fns');
const { buildPacketBuffers } = require('./pdfHandler');   // if you’ve added it
const { sendPackets } = require('./emailSender');          // if you’ve added it
const { listAll } = require('./debugListFields');          // if you created it
const { gridOverlayFor } = require('./debugGrid');         // if you created it

// --- Create app BEFORE using app.get/app.use
const app = express();
const PORT = 3000;

// --- Ensure submissions dir exists
const SUB_DIR = path.resolve(__dirname, '../submissions');
fs.mkdirSync(SUB_DIR, { recursive: true });

// --- Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '15mb' }));

// --- Routes

// Ping test (handy sanity check)
app.get('/ping', (req, res) => res.send('pong'));

// Debug: list fields (will be empty for your flat PDFs; safe to keep)
app.get('/debug/list-fields', async (req, res) => {
  try {
    const out = await listAll();
    res.json(out);
  } catch (e) {
    console.error('List-fields error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Debug grid overlay: http://localhost:3000/debug/grid?file=TR-RDC-SCUBA_English-Metric.pdf
app.get('/debug/grid', async (req, res) => {
  try {
    const file = req.query.file;
    if (!file) return res.status(400).send('Missing ?file=xxx.pdf');
    const bytes = await gridOverlayFor(file);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (e) {
    console.error('Grid error:', e);
    res.status(500).send(e.message);
  }
});

// Main submit route (works with or without the PDF/email layer wired)
app.post('/submit', async (req, res) => {
  try {
    const data = req.body;

    // Normalize centers to array for consistency
    const centers = Array.isArray(data.centers)
      ? data.centers
      : (data.center ? [data.center] : []);
    data.centers = centers;

    // Always log raw submission
    const rawName = `submission-${Date.now()}.json`;
    fs.writeFileSync(path.join(SUB_DIR, rawName), JSON.stringify(data, null, 2));

    // If you haven’t wired PDF/email yet, uncomment the next line to return early:
    // return res.status(200).send('Form received! (PDF/email not wired yet)');

    // Build PDFs and email (only if pdfHandler/emailSender are set up)
    const packets = await buildPacketBuffers(data);

    const dateStr = format(new Date(), 'dd/MM/yyyy');
    const centerText = centers.length ? centers.join(' & ') : 'DIVEIndia';
    const subject = `Dive Forms - ${data.name} - ${centerText} - ${dateStr}`;
    const htmlBody = `
      <p>Hello ${data.name},</p>
      <p>Attached are your DIVEIndia form packets${centers.length>1?' for both centers':''}.<br/>
      Thank you and see you underwater!</p>
      <p>— DIVEIndia</p>
    `;

    await sendPackets({
      guestEmail: data.email,
      subject,
      htmlBody,
      packets,
      extraRecipients: [] // optional future cc’s
    });

    res.status(200).send('Forms generated and emailed!');
  } catch (err) {
    console.error('❌ Submit error:', err);
    res.status(500).send('Server error processing forms');
  }
});

// --- Start server LAST
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
