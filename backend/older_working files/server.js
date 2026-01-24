// --- Load env early
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { format } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Paths
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const FORMS_DIR    = path.resolve(__dirname, '../forms');
const SUB_DIR      = path.resolve(__dirname, '../submissions');

// --- Ensure dirs exist
fs.mkdirSync(SUB_DIR, { recursive: true });

// --- Log forms directory and PDF files (like your older build)
try {
  const files = fs.readdirSync(FORMS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`📁 Forms directory: ${FORMS_DIR}`);
  console.log(`📄 Files found: ${files.join(', ') || '(none)'}`);
} catch (e) {
  console.warn(`⚠️ Could not read forms directory at ${FORMS_DIR}. Create it and place your PDFs there.`);
}

// --- Require pdf pipeline (hard requirement)
let buildPacketBuffers;
try {
  ({ buildPacketBuffers } = require('./pdfHandler'));
  if (typeof buildPacketBuffers !== 'function') {
    console.error('❌ pdfHandler.buildPacketBuffers is not a function. Check your exports.');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Failed to load ./pdfHandler:', e && e.message ? e.message : e);
  process.exit(1);
}

// --- Optional email sender
let sendPackets = null;
try {
  ({ sendPackets } = require('./emailSender'));
  if (typeof sendPackets !== 'function') {
    console.warn('⚠️ emailSender loaded but sendPackets not a function; falling back to local save.');
    sendPackets = null;
  }
} catch {
  console.warn('⚠️ emailSender not found; will save PDFs locally instead of emailing.');
}

// --- Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

// --- Health
app.get('/healthz', (_req,res)=>res.json({ ok:true, port: PORT }));
app.get('/ping', (_req,res)=>res.send('pong'));

// --- Submit
app.post('/submit', async (req,res) => {
  try {
    const data = req.body || {};
    const centers = Array.isArray(data.centers) ? data.centers : (data.center ? [data.center] : []);
    data.centers = centers;

    // Persist raw submission for debugging
    const rawPath = path.join(SUB_DIR, `submission-${Date.now()}.json`);
    fs.writeFileSync(rawPath, JSON.stringify(data, null, 2));

    console.log('🧩 Building packet for:', centers.join(' & ') || 'Unknown Center');
    const packets = await buildPacketBuffers(data); // [{filename,bytes}] or [{label,buffer}]

    if (sendPackets) {
      const dateStr = format(new Date(), 'dd/MM/yyyy');
      const centerText = centers.length ? centers.join(' & ') : 'DIVEIndia';
      const subject = `Dive Forms - ${data.name || 'Guest'} - ${centerText} - ${dateStr}`;
      const htmlBody = `<p>Hello ${data.name || 'Guest'},</p><p>Attached are your DIVEIndia form packets.</p>`;
      await sendPackets({ guestEmail: data.email, subject, htmlBody, packets, extraRecipients: [] });
      return res.status(200).send('Forms generated and emailed!');
    } else {
      // Save packets locally for inspection
      const saved = [];
      for (const p of packets) {
        const name = (p.filename || p.label || 'packet');
        const buf  = (p.bytes || p.buffer);
        const safe = name.replace(/[^\w.-]+/g, '_');
        const outPath = path.join(SUB_DIR, `${Date.now()}-${safe}.pdf`);
        fs.writeFileSync(outPath, buf);
        saved.push(outPath);
      }
      return res.status(200).send(`Forms generated and saved locally:\n${saved.map(s => path.basename(s)).join('\n')}`);
    }
  } catch (err) {
    console.error('❌ Submit error:', err);
    res.status(500).send(err && err.message ? err.message : 'Server error processing forms');
  }
});

// --- Static frontend
app.use(express.static(FRONTEND_DIR));
app.get('/', (_req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));

// --- Start
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
