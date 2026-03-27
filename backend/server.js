// Load env
require('dotenv').config();

const path = require('path');
const fs   = require('fs');
const os   = require('os'); // for LAN IP logging
const express = require('express');
const cors    = require('cors');
const bodyParser = require('body-parser');
const { format } = require('date-fns');

const { createSubmission } = require('./services/submissionService');

const { buildPacketBuffers } = require('./pdfHandler');
let sendPackets = null;
try { ({ sendPackets } = require('./emailSender')); } catch { /* optional */ }

const app  = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const SUB_DIR      = path.resolve(__dirname, '../submissions');
const FORMS_DIR    = path.resolve(__dirname, '../forms');
fs.mkdirSync(SUB_DIR, { recursive: true });

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

// Startup banner
try {
  const files = fs.readdirSync(FORMS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`📁 Forms directory: ${FORMS_DIR}`);
  console.log(`📄 Files found: ${files.join(', ') || '(none)'}`);
} catch (e) {
  console.warn(`⚠️ Could not read forms directory at ${FORMS_DIR}.`);
}

// Health
app.get('/healthz', (_req,res)=>res.json({ ok:true, port: PORT }));

// Dev: list and fetch saved PDFs
app.get('/dev/submissions', (_req,res) => {
  const files = fs.readdirSync(SUB_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort((a,b)=>fs.statSync(path.join(SUB_DIR,b)).mtimeMs - fs.statSync(path.join(SUB_DIR,a)).mtimeMs);
  res.json({ files, base: '/dev/submissions' });
});
app.get('/dev/submissions/:file', (req,res) => {
  const file = req.params.file;
  const full = path.join(SUB_DIR, file);
  if (!/^[\w.\-]+$/.test(file)) return res.status(400).send('Bad filename');
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  res.setHeader('Content-Type','application/pdf');
  res.send(fs.readFileSync(full));
});

// Submit route with tester mode
app.post('/submit', async (req, res) => {
  try {
    const mode = (req.query.mode || '').toString().toLowerCase(); // 'test' to enable tester
    const testMode = mode === 'test' || req.headers['x-dev-mode'] === 'test';

    const data = req.body || {};
    const centers = Array.isArray(data.centers) ? data.centers : (data.center ? [data.center] : []);
    data.centers = centers;

    // Always log raw JSON
    const rawPath = path.join(SUB_DIR, `submission-${Date.now()}${testMode?'-TEST':''}.json`);
    fs.writeFileSync(rawPath, JSON.stringify(data, null, 2));
	
	// Attach request metadata for audit/debug
data._userAgent = req.headers['user-agent'] || null;

// Save submission to Postgres
let submissionId;
try {
  submissionId = await createSubmission(data);
  console.log('📝 Submission saved to Postgres with id:', submissionId);
} catch (dbErr) {
  console.error('❌ Failed to save submission to Postgres:', dbErr);
  return res.status(500).send('Failed to save submission');
}


    console.log(`🧩 Building packet for: ${centers.join(' & ') || 'Unknown'} ${testMode?'[TEST]':''}`);
    const packets = await buildPacketBuffers(data);

    // In test mode: save PDFs and return JSON with download URLs
    if (testMode || !sendPackets) {
      const saved = [];
      for (const p of packets) {
        const name = (p.filename || p.label || 'packet');
        const buf  = (p.bytes || p.buffer);
        const safe = name.replace(/[^\w.-]+/g,'_');
        const out  = path.join(SUB_DIR, `${Date.now()}-${safe}.pdf`);
        fs.writeFileSync(out, buf);
        saved.push(path.basename(out));
      }
      return res.status(200).json({
        ok: true,
        testMode: true,
        message: 'Forms generated and saved locally.',
        downloads: saved.map(f => `/dev/submissions/${f}`)
      });
    }

    // Otherwise, email the packets
    const dateStr = format(new Date(), 'dd/MM/yyyy');
    const centerText = centers.length ? centers.join(' & ') : 'DIVEIndia';
    const subject = `Dive Forms - ${data.name || 'Guest'} - ${centerText} - ${dateStr}`;
    const htmlBody = `<p>Hello ${data.name || 'Guest'},</p><p>Attached are your DIVEIndia form packets.</p>`;

    await sendPackets({ guestEmail: data.email, subject, htmlBody, packets, extraRecipients: [] });
    res.status(200).send('Forms generated and emailed!');
  } catch (err) {
    console.error('❌ Submit error:', err);
    res.status(500).send(err?.message || 'Server error processing forms');
  }
});

// Serve frontend
app.use(express.static(FRONTEND_DIR));
app.get('/', (_req,res)=>res.sendFile(path.join(FRONTEND_DIR,'index.html')));

// Listen on all interfaces (localhost + LAN)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   • http://localhost:${PORT}`);

  const nets = os.networkInterfaces();
  Object.values(nets).forEach(ifaces => {
    ifaces
      .filter(i => i.family === 'IPv4' && !i.internal)
      .forEach(i => {
        console.log(`   • http://${i.address}:${PORT}`);
      });
  });
});
