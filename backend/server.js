// Load env
require('dotenv').config();

const path = require('path');
const fs   = require('fs');
const os   = require('os'); // for LAN IP logging
const express = require('express');
const cors    = require('cors');
const bodyParser = require('body-parser');
const { format } = require('date-fns');
const QRCode = require('qrcode');

const {
  createSubmission,
  listSubmissions,
  getSubmission,
  rowToSubmissionPayload
} = require('./services/submissionService');

const { buildComponentFormBuffers, normalizeSelectedForms } = require('./pdfHandler');
let sendPackets = null;
try { ({ sendPackets } = require('./emailSender')); } catch { /* optional */ }

const app  = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const PUBLIC_DIR    = path.resolve(__dirname, '../public');
const SUB_DIR      = path.resolve(__dirname, '../submissions');
const FORMS_DIR    = path.resolve(__dirname, '../forms');
fs.mkdirSync(SUB_DIR, { recursive: true });

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [, pass = ''] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (pass === (process.env.ADMIN_PASSWORD || 'password123')) return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="DIVEIndia Forms Admin"');
  return res.status(401).send('Admin password required');
}

function safePdfName(name) {
  return String(name || 'form').replace(/[^\w.-]+/g, '_');
}

function savePacketsLocally(packets, prefix = 'regenerated') {
  const saved = [];
  for (const p of packets) {
    const safe = safePdfName(p.filename || p.label || 'form.pdf');
    const out = path.join(SUB_DIR, `${prefix}-${Date.now()}-${safe}`);
    fs.writeFileSync(out, Buffer.from(p.bytes || p.buffer));
    saved.push(path.basename(out));
  }
  return saved;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  Object.values(nets).forEach(ifaces => {
    ifaces
      .filter(i => i.family === 'IPv4' && !i.internal)
      .forEach(i => addresses.push(i.address));
  });
  return addresses;
}

function baseUrlFor(host) {
  return `http://${host}:${PORT}`;
}

function urlSet(base) {
  return {
    base,
    guestUrl: `${base}/`,
    adminUrl: `${base}/admin`
  };
}

async function checkPublicUrl(publicBase) {
  if (!publicBase) return { status: 'not_configured', reachable: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.PUBLIC_TUNNEL_CHECK_TIMEOUT_MS || 3500));
  try {
    const res = await fetch(`${publicBase}/healthz`, {
      method: 'GET',
      signal: controller.signal
    });
    return {
      status: res.ok ? 'reachable' : 'error',
      reachable: res.ok,
      httpStatus: res.status,
      checkedUrl: `${publicBase}/healthz`,
      message: res.ok ? 'Public URL reached this server health check.' : `Health check returned HTTP ${res.status}.`
    };
  } catch (err) {
    return {
      status: 'error',
      reachable: false,
      checkedUrl: `${publicBase}/healthz`,
      message: err.name === 'AbortError' ? 'Public URL check timed out.' : err.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

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

app.get('/admin/api/launch-info', requireAdmin, async (_req, res) => {
  const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const publicCheck = await checkPublicUrl(publicBase);
  res.json({
    ok: true,
    port: PORT,
    local: urlSet(baseUrlFor('localhost')),
    lan: getLanAddresses().map(ip => ({ ip, ...urlSet(baseUrlFor(ip)) })),
    internet: {
      configured: !!publicBase,
      ...(publicBase ? urlSet(publicBase) : {}),
      provider: process.env.PUBLIC_TUNNEL_PROVIDER || null,
      ...publicCheck,
      note: publicBase ? publicCheck.message : 'Not configured. Use local network as fallback.'
    }
  });
});

app.get('/admin/api/qr', requireAdmin, async (req, res) => {
  try {
    const data = String(req.query.data || '').trim();
    if (!data) return res.status(400).send('Missing QR data');
    const svg = await QRCode.toString(data, {
      type: 'svg',
      margin: 1,
      width: 220,
      errorCorrectionLevel: 'M'
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).send('Failed to generate QR');
  }
});

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

app.get('/admin/api/submissions', requireAdmin, async (req, res) => {
  try {
    const rows = await listSubmissions({
      search: req.query.q || '',
      limit: req.query.limit || 50
    });
    res.json({ ok: true, submissions: rows });
  } catch (err) {
    console.error('Admin submissions list error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to list submissions' });
  }
});

app.get('/admin/api/submissions/:id', requireAdmin, async (req, res) => {
  try {
    const row = await getSubmission(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Submission not found' });
    res.json({ ok: true, submission: row, regenerationPayload: rowToSubmissionPayload(row) });
  } catch (err) {
    console.error('Admin submission detail error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to load submission' });
  }
});

app.get('/admin/api/generated/:file', requireAdmin, (req, res) => {
  const file = req.params.file;
  const full = path.join(SUB_DIR, file);
  if (!/^[\w.\-]+$/.test(file)) return res.status(400).send('Bad filename');
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/pdf');
  res.send(fs.readFileSync(full));
});

app.post('/admin/api/submissions/:id/generate', requireAdmin, async (req, res) => {
  try {
    const row = await getSubmission(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Submission not found' });

    const action = String(req.body?.action || 'save').toLowerCase();
    const payload = rowToSubmissionPayload(row);
    payload.selectedForms = normalizeSelectedForms(payload);
    const packets = await buildComponentFormBuffers(payload);

    if (action === 'email') {
      const email = String(req.body?.email || '').trim();
      if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'Valid recipient email is required' });
      if (!sendPackets) return res.status(500).json({ ok: false, error: 'Email sender is not available' });

      const dateStr = format(new Date(), 'dd/MM/yyyy');
      const name = payload.name || payload.fullName || [payload.firstName, payload.lastName].filter(Boolean).join(' ') || 'Guest';
      const subject = `Dive Forms - ${name} - regenerated - ${dateStr}`;
      const list = packets.map(p => `<li>${p.filename}</li>`).join('');
      const htmlBody = `<p>Attached are regenerated DIVEIndia forms as separate PDFs in this single email.</p><ul>${list}</ul>`;
      await sendPackets({
        guestEmail: email,
        subject,
        htmlBody,
        packets,
        extraRecipients: [],
        includeDefaultRecipients: false
      });

      return res.json({
        ok: true,
        action: 'email',
        message: `Emailed ${packets.length} regenerated PDF attachment(s) to ${email}.`,
        selectedForms: payload.selectedForms,
        files: packets.map(p => p.filename)
      });
    }

    const saved = savePacketsLocally(packets, `regenerated-${req.params.id.slice(0, 8)}`);
    res.json({
      ok: true,
      action: 'save',
      message: `Generated ${saved.length} PDF file(s).`,
      selectedForms: payload.selectedForms,
      downloads: saved.map(f => `/admin/api/generated/${f}`)
    });
  } catch (err) {
    console.error('Admin regenerate error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to regenerate PDFs' });
  }
});

// Submit route with tester mode
app.post('/submit', async (req, res) => {
  try {
    const mode = (req.query.mode || '').toString().toLowerCase(); // 'test' to enable tester
    const testMode = mode === 'test' || req.headers['x-dev-mode'] === 'test';

    const data = req.body || {};
    const centers = Array.isArray(data.centers) ? data.centers : (data.center ? [data.center] : []);
    data.centers = centers;
    data.selectedForms = normalizeSelectedForms(data);

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


    const selectedForms = data.selectedForms;
    console.log(`🧩 Building separate forms for: ${centers.join(' & ') || 'Unknown'} (${selectedForms.join(', ')}) ${testMode?'[TEST]':''}`);
    const packets = await buildComponentFormBuffers(data);

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
        message: 'Forms generated as separate PDFs and saved locally.',
        selectedForms,
        downloads: saved.map(f => `/dev/submissions/${f}`)
      });
    }

    // Otherwise, email the packets
    const dateStr = format(new Date(), 'dd/MM/yyyy');
    const centerText = centers.length ? centers.join(' & ') : 'DIVEIndia';
    const subject = `Dive Forms - ${data.name || 'Guest'} - ${centerText} - ${dateStr}`;
    const attachmentList = packets.map(p => `<li>${p.filename}</li>`).join('');
    const htmlBody = `<p>Hello ${data.name || 'Guest'},</p><p>Attached are your DIVEIndia forms as separate PDFs in this single email.</p><ul>${attachmentList}</ul>`;

    console.log(`📧 Sending one email with ${packets.length} PDF attachment(s): ${packets.map(p => p.filename).join(', ')}`);
    await sendPackets({ guestEmail: data.email, subject, htmlBody, packets, extraRecipients: [] });
    res.status(200).send(`Forms generated and emailed as ${packets.length} separate attachment(s)!`);
  } catch (err) {
    console.error('❌ Submit error:', err);
    res.status(500).send(err?.message || 'Server error processing forms');
  }
});

// Serve frontend
app.get(['/admin', '/admin.html'], requireAdmin, (_req,res)=>res.sendFile(path.join(FRONTEND_DIR,'admin.html')));
app.use(express.static(PUBLIC_DIR));
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
