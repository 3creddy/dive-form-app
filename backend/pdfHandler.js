// backend/pdfHandler.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { format } = require('date-fns');
const { formFiles, centerSuffixes } = require('./utils/fieldMap');
const { coordsByFile, checkboxByFile } = require('./utils/coordMap');

const FORMS_DIR = path.resolve(__dirname, '../forms');

// ---- Startup logging: where are we looking, and what do we see?
(function startupScan() {
  try {
    const listing = fs.existsSync(FORMS_DIR) ? fs.readdirSync(FORMS_DIR) : [];
    console.log('📁 Forms directory:', FORMS_DIR);
    console.log('📄 Files found:', listing.length ? listing.join(', ') : '(none)');
  } catch (e) {
    console.error('❌ Could not read forms directory:', FORMS_DIR, e);
  }
})();

/* -------------------- Helpers -------------------- */

function toDDMMYYYY(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calcIsMinor(dob) {
  try {
    const d = new Date(dob);
    if (isNaN(d)) return false;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age < 18;
  } catch { return false; }
}

// Auto-fit long text to a max width by reducing font size (keeps names tidy)
function drawFittedText(page, font, text, x, y, options = {}) {
  const { baseSize = 12, minSize = 9, maxWidth = 240 } = options;
  if (!text) return;
  let size = baseSize;
  while (size >= minSize) {
    const width = font.widthOfTextAtSize(text, size);
    if (width <= maxWidth) break;
    size -= 0.5;
  }
  page.drawText(text, { x, y, size, font });
}

// Build name variants from split or legacy fields
function buildNameParts(data) {
  const first = (data.firstName || '').trim();
  const middle = (data.middleName || '').trim();
  const last = (data.lastName || '').trim();

  if (first || last) {
    const fullName = [first, middle, last].filter(Boolean).join(' ');
    const middleInitial = middle ? middle[0].toUpperCase() + '.' : '';
    const initials = (first[0] || '') + (middle[0] || '') + (last[0] || '');
    return { firstName:first, middleName:middle, lastName:last, fullName, middleInitial, initials };
  }

  // Fallback: split legacy "name"
  const legacy = (data.name || '').trim();
  if (!legacy) return { firstName:'', middleName:'', lastName:'', fullName:'', middleInitial:'', initials:'' };
  const parts = legacy.split(/\s+/);
  if (parts.length === 1) return { firstName:parts[0], middleName:'', lastName:'', fullName:legacy, middleInitial:'', initials:parts[0][0] || '' };
  const lastName = parts.pop();
  const firstName = parts.shift() || '';
  const middleName = parts.join(' ');
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const middleInitial = middleName ? middleName[0].toUpperCase() + '.' : '';
  const initials = (firstName[0] || '') + (middleName[0] || '') + (lastName[0] || '');
  return { firstName:firstName, middleName, lastName, fullName, middleInitial, initials };
}

function b64ToUint8(b64) {
  const base64 = (b64 || '').split(',')[1] || b64; // handle data URLs
  return Uint8Array.from(Buffer.from(base64 || '', 'base64'));
}

/* -------------------- Overlay engine -------------------- */

/**
 * Overlay values and signatures onto a flat PDF by coordinates.
 * - filename: used to look up coords in coordMap
 * - data: submission payload (expects first/middle/last or legacy name)
 * - sigGuestPNG/sigGuardianPNG: Uint8Array buffers for PNG signatures (optional)
 */
async function overlayWithData(srcBytes, filename, data, sigGuestPNG, sigGuardianPNG) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Value bag available to coord map keys
  const nameParts = buildNameParts(data);
  const bag = {
    firstName:     nameParts.firstName,
    middleName:    nameParts.middleName,
    lastName:      nameParts.lastName,
    fullName:      nameParts.fullName,
    middleInitial: nameParts.middleInitial,
    initials:      nameParts.initials,

    dob: toDDMMYYYY(data.dob),
    // Use frontend-provided dates when available
    date: toDDMMYYYY(data.guestFillingDate || new Date()),
    parentDate: toDDMMYYYY(data.parentGuardianDate || data.guestFillingDate || new Date()),
    email: data.email || '',
    phone: data.phone || '',
    diveCenter: Array.isArray(data.centers) ? data.centers.join(' & ') : (data.centers || data.center || ''),
    today: toDDMMYYYY(new Date()), // legacy fallback
    parentName: data.parentName || '',
  };

  const map  = (coordsByFile[filename] || {});
  const cbox = (checkboxByFile[filename] || {});
  const pages = pdfDoc.getPages();

  // Helper: draw a signature image fitted within a (width x height) box, anchored at bottom-left.
  async function drawSignatureFitted(pdfDoc, page, pngBytes, cfg) {
    if (!pngBytes || !cfg || cfg.x == null || cfg.y == null) return;
    const img = await pdfDoc.embedPng(pngBytes);
    // If height provided, fit to both constraints; else fit to width only.
    const targetW = cfg.width || img.width;
    const targetH = cfg.height || (img.height * (targetW / img.width));
    const scale = Math.min(targetW / img.width, targetH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x: cfg.x, y: cfg.y, width: w, height: h });
  }


  // Text + checkbox overlays
  pages.forEach((page, idx) => {
    const textCfgs = map[idx] || {};
    Object.entries(textCfgs).forEach(([key, cfg]) => {
      if (!cfg || cfg.x == null || cfg.y == null) return;
      if (key.startsWith('sig')) return; // handled in signature section

      const val = bag[key];
      if (!val) return;

      if (cfg.maxWidth) {
        drawFittedText(page, helv, String(val), cfg.x, cfg.y, { baseSize: cfg.size || 11, maxWidth: cfg.maxWidth, minSize: cfg.minSize || 8 });
      } else {
        page.drawText(String(val), { x: cfg.x, y: cfg.y, size: cfg.size || 11, font: helv });
      }
    });

    const cbCfgs = cbox[idx] || {};
    Object.entries(cbCfgs).forEach(([flagKey, pt]) => {
      if (data[flagKey] === true) {
        page.drawText('X', { x: pt.x, y: pt.y, size: 12, font: helv });
      }
    });
  });

  
  // Signatures, if coord keys exist for this file/page
  if (sigGuestPNG || sigGuardianPNG) {
    const pageIdxs = Object.keys(map).map(n => Number(n)).filter(n => !Number.isNaN(n));
    for (const i of pageIdxs) {
      const cfg = map[i] || {};
      const page = pages[i];
      if (!page) continue;

      if (sigGuestPNG && cfg.sigGuest && cfg.sigGuest.x != null) {
        try {
          await drawSignatureFitted(pdfDoc, page, sigGuestPNG, cfg.sigGuest);
        } catch (e) {
          console.warn('Guest signature embed error:', e.message);
        }
      }

      const isMinor = calcIsMinor(data.dob);
      if (isMinor && sigGuardianPNG && cfg.sigGuardian && cfg.sigGuardian.x != null) {
        try {
          await drawSignatureFitted(pdfDoc, page, sigGuardianPNG, cfg.sigGuardian);
        } catch (e) {
          console.warn('Guardian signature embed error:', e.message);
        }
      }
    }
  }

  return await pdfDoc.save();
}

/* -------------------- Packet builder -------------------- */

async function makeCoverSheet(data, centerLabel, sigGuestPNG, sigGuardianPNG) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const draw = (text, x, y, size = 12) => page.drawText(text, { x, y, size, font });

  draw(`DIVEIndia - Guest Packet (${centerLabel})`, 50, 800, 16);

  const lines = [
    `Name: ${(data.fullName || data.name || '').trim()}`,
    `DOB: ${data.dob || ''}`,
    `Phone: ${data.phone || ''}`,
    `Email: ${data.email || ''}`,
    `Centers Selected: ${Array.isArray(data.centers) ? data.centers.join(', ') : (data.centers || data.center || '')}`,
    `Date: ${format(new Date(), 'dd/MM/yyyy')}`,
    ...(data.parentName ? [`Parent/Guardian: ${data.parentName}`] : []),
  ];
  let y = 770;
  for (const line of lines) { draw(line, 50, y); y -= 20; }

  if (sigGuestPNG && sigGuestPNG.length) {
    try {
      const sigImg = await pdfDoc.embedPng(sigGuestPNG);
      const w = 220, h = (w * sigImg.height) / sigImg.width;
      draw('Guest Signature:', 50, 560);
      page.drawImage(sigImg, { x: 50, y: 520, width: w, height: h });
    } catch (e) {
      console.warn('⚠️ Failed to embed guest signature (continuing):', e.message);
    }
  }
  if (sigGuardianPNG && sigGuardianPNG.length) {
    try {
      const sigG = await pdfDoc.embedPng(sigGuardianPNG);
      const w = 220, h = (w * sigG.height) / sigG.width;
      draw('Parent/Guardian Signature:', 320, 560);
      page.drawImage(sigG, { x: 320, y: 520, width: w, height: h });
    } catch (e) {
      console.warn('⚠️ Failed to embed guardian signature (continuing):', e.message);
    }
  }

  return pdfDoc;
}

function ensureFormFileExists(filename) {
  const p = path.join(FORMS_DIR, filename);
  if (!fs.existsSync(p)) {
    const hint = 'Please verify the filename (including exact spelling, case, underscores) matches what pdfHandler expects.';
    throw new Error(`Missing required form file: ${filename}\nLooked in: ${FORMS_DIR}\n${hint}`);
  }
  return p;
}

// Append a filled (overlaid) copy of the source PDF into the output packet
async function appendOriginalFilled(pdfDoc, filename, data) {
  const srcPath = ensureFormFileExists(filename);
  const srcBytes = fs.readFileSync(srcPath);

  const isMinor = calcIsMinor(data.dob);
  const sigGuestPNG = data.signature ? b64ToUint8(data.signature) : null;
  const sigGuardianPNG = isMinor && data.guardianSignature ? b64ToUint8(data.guardianSignature) : null;

  let finalBytes = srcBytes;
  try {
    finalBytes = await overlayWithData(srcBytes, filename, data, sigGuestPNG, sigGuardianPNG);
    console.log(`🖋️  Overlaid: ${filename}`);
  } catch (e) {
    console.warn(`⚠️ Overlay failed for ${filename}, using original.`, e.message);
  }

  const filledDoc = await PDFDocument.load(finalBytes);
  const pages = await pdfDoc.copyPages(filledDoc, filledDoc.getPageIndices());
  pages.forEach(p => pdfDoc.addPage(p));
}

async function buildPacketBuffers(data) {
  const isMinor = calcIsMinor(data.dob);
  const centers = Array.isArray(data.centers) ? data.centers : [data.centers].filter(Boolean);
  const suffixes = centerSuffixes(centers);

  // Validate that required files exist up-front; fail fast with a clear message.
  const requiredKeys = ['medical', 'waiver', 'boat', 'rdc', ...(isMinor ? ['youth'] : [])];
  for (const key of requiredKeys) ensureFormFileExists(formFiles[key]);

  // One packet per center if both selected; otherwise one packet total
  const packets = [];
  const packetLabels = centers.length > 1 ? suffixes : [suffixes[0] || centers[0] || 'Havelock'];

  for (let i = 0; i < packetLabels.length; i++) {
    const label = packetLabels[i];
    console.log(`🧩 Building packet for: ${label}`);

    const packetDoc = await makeCoverSheet(data, label,
      data.signature ? b64ToUint8(data.signature) : null,
      (isMinor && data.guardianSignature) ? b64ToUint8(data.guardianSignature) : null
    );

    // For both centers: medical/waiver/boat per center; RDC + Youth only once (first packet).
    const baseForms = ['medical', 'waiver', 'boat'];
    for (const key of baseForms) {
      await appendOriginalFilled(packetDoc, formFiles[key], data);
    }
    if (centers.length === 1 || i === 0) {
      await appendOriginalFilled(packetDoc, formFiles['rdc'], data);
      if (isMinor) await appendOriginalFilled(packetDoc, formFiles['youth'], data);
    }

    const bytes = await packetDoc.save();
    const safeName = (data.fullName || data.name || 'Guest').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_');
    const filename = `${safeName}_${label}_${format(new Date(), 'yyyyMMdd')}.pdf`;

    console.log(`✅ Packet built: ${filename}`);
    packets.push({ filename, bytes });
  }

  return packets;
}

module.exports = { buildPacketBuffers };
