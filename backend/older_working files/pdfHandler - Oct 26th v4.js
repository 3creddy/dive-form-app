
// backend/pdfHandler_patched.js
// Patched pdfHandler: supports multiple placement coords, templates, combined fields,
// and robust checkbox resolution including medical.boxes A..G array fallback.

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { format } = require('date-fns');
const { formFiles, centerSuffixes } = require('./utils/fieldMap');
const { coordsByFile, checkboxByFile } = require('./utils/coordMap');

const FORMS_DIR = path.resolve(__dirname, '../forms');

// startup scan
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

// dot-path getter
function getNested(obj, path) {
  if (!obj || !path) return undefined;
  if (!String(path).includes('.')) return obj[path];
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

async function overlayWithData(srcBytes, filename, data, sigGuestPNG, sigGuardianPNG) {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function deriveFacilityName(d) {
    const raw = Array.isArray(d?.centers) ? d.centers : (d?.center ? [d.center] : []);
    const vals = raw.map(v => String(v || '').toLowerCase());
    if (vals.find(v => v.includes('havelock'))) return 'DIVEIndia Havelock 791197';
    if (vals.find(v => v.includes('neil')))     return 'DIVEIndia Neil 791033';
    return d?.facilityName || process.env.DEFAULT_FACILITY_NAME || '';
  }

  const nameParts = buildNameParts(data);
  const bag = {
    firstName:     (nameParts.firstName || '').trim(),
    middleName:    (nameParts.middleName || '').trim(),
    lastName:      (nameParts.lastName || '').trim(),
    fullName:      (nameParts.fullName || '').trim(),
    middleInitial: (nameParts.middleInitial || '').trim(),
    initials:      (nameParts.initials || '').trim(),

    dob:           toDDMMYYYY(data.dob),
    email:         data.email || '',
    phone:         data.phone || '',
    diveCenter:    Array.isArray(data.centers) ? data.centers.join(' & ') : (data.centers || data.center || ''),
    facilityName:  deriveFacilityName(data),
    today:         toDDMMYYYY(new Date()),
    parentName:    data.parentName || '',
    parentDate:    toDDMMYYYY(data.parentGuardianDate || data.parentDate || data.guestFillingDate || new Date()),
    date:          toDDMMYYYY(data.guestFillingDate || data.date || new Date())
  };

  const findKey = (obj, key) => {
    if (!obj) return undefined;
    if (!key) return undefined;
    if (obj[key]) return key;
    const lk = String(key || '').toLowerCase();
    return Object.keys(obj).find(k => k.toLowerCase() === lk);
  };

  const mapKey = findKey(coordsByFile, filename);
  const checkboxKey = findKey(checkboxByFile, filename);
  const map  = (coordsByFile[mapKey] || {});
  const cbox = (checkboxByFile[checkboxKey] || {});
  const pages = pdfDoc.getPages();

  const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes';

  function resolveValueForField(key, cfg) {
    if (cfg && typeof cfg.template === 'string') {
      return cfg.template.replace(/\{([^}]+)\}/g, (m, p1) => {
        const k = p1.trim();
        return (bag[k] !== undefined ? bag[k] : (data[k] !== undefined ? data[k] : '')) || '';
      }).trim();
    }

    if (cfg && Array.isArray(cfg.fields)) {
      return cfg.fields.map(k => (bag[k] !== undefined ? bag[k] : (data[k] !== undefined ? data[k] : '')) || '').filter(Boolean).join(cfg.sep || ' ').trim();
    }

    if (bag[key] !== undefined && bag[key] !== '') return bag[key];
    if (data[key] !== undefined && data[key] !== null) return data[key];
    return '';
  }

  function iterateCfgs(cfgOrArray, fn) {
    if (!cfgOrArray) return;
    if (Array.isArray(cfgOrArray)) {
      for (const c of cfgOrArray) fn(c);
    } else {
      fn(cfgOrArray);
    }
  }

  // iterate pages
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];

    // text + embedded checkbox handling
    const textCfgs = map[idx] || {};
    for (const [key, cfgOrArr] of Object.entries(textCfgs)) {
      // signatures handled later
      if (key === 'sigGuest' || key === 'sigGuardian') continue;

      iterateCfgs(cfgOrArr, (cfg) => {
        if (!cfg || cfg.x == null || cfg.y == null) return;

        // embedded checkbox handling (supports medical.boxes fallback)
        if (cfg.type && String(cfg.type).toLowerCase() === 'checkbox') {
          // explicit per-checkbox flag
          const explicit = getNested(data, key) !== undefined ? getNested(data, key) : (getNested(bag, key) !== undefined ? getNested(bag, key) : undefined);
          if (explicit !== undefined && truthy(explicit)) {
            const mark = cfg.mark || 'X';
            const size = cfg.box || cfg.size || 12;
            const adj = size * 0.35;
            page.drawText(mark, { x: cfg.x - adj, y: cfg.y - adj, size, font: helv });
            return;
          }

          const m = key.match(/^(.*)_(yes|no)$/i);
          if (m) {
            const baseKey = m[1];
            const expectedIsYes = m[2].toLowerCase() === 'yes';

            // dot-path-aware lookup
            let baseVal = getNested(data, baseKey);
            if (baseVal === undefined) baseVal = getNested(bag, baseKey);

            // boxes-array fallback
            if (baseVal === undefined) {
              try {
                const parts = String(baseKey).split('.');
                const last = parts[parts.length - 1] || '';
                const boxMatch = String(last).match(/^([A-G])(\d{1,2})$/i);
                if (boxMatch) {
                  const letter = boxMatch[1].toUpperCase();
                  const num = parseInt(boxMatch[2], 10);
                  const idxMedical = parts.findIndex(p => String(p).toLowerCase() === 'medical');
                  const boxesRoot = (idxMedical >= 0)
                    ? parts.slice(0, idxMedical + 1).concat(['boxes']).join('.')
                    : 'medical.boxes';
                  const boxesObj = getNested(data, boxesRoot) || getNested(bag, boxesRoot) || getNested(data, 'medical.boxes');
                  if (boxesObj && typeof boxesObj === 'object') {
                    const arr = boxesObj[letter];
                    if (Array.isArray(arr)) baseVal = arr[Math.max(0, num - 1)];
                  }
                }
              } catch (e) {
                // ignore
              }
            }

            if (baseVal !== undefined) {
              const isYes = truthy(baseVal);
              if ((isYes && expectedIsYes) || (!isYes && !expectedIsYes)) {
                const mark = cfg.mark || 'X';
                const size = cfg.box || cfg.size || 12;
                const adj = size * 0.35;
                page.drawText(mark, { x: cfg.x - adj, y: cfg.y - adj, size, font: helv });
                return;
              }
            }
          }

          // explicit cfg.value fallback
          if (cfg.hasOwnProperty('value') && truthy(cfg.value)) {
            const mark = cfg.mark || 'X';
            const size = cfg.box || cfg.size || 12;
            const adj = size * 0.35;
            page.drawText(mark, { x: cfg.x - adj, y: cfg.y - adj, size, font: helv });
            return;
          }

          return;
        }

        // text rendering
        const val = resolveValueForField(key, cfg);
        if (val == null || String(val).trim() === '') return;
        const strVal = String(val);
        if (cfg.maxWidth) {
          drawFittedText(page, helv, strVal, cfg.x, cfg.y, { baseSize: cfg.size || 12, maxWidth: cfg.maxWidth, minSize: cfg.minSize || 8 });
        } else {
          page.drawText(strVal, { x: cfg.x, y: cfg.y, size: cfg.size || 12, font: helv });
        }
      });
    }

    // checkboxes from checkboxByFile (with boxes-array fallback)
    const boxCfgs = cbox[idx] || {};
    for (const [key, cfgOrArr] of Object.entries(boxCfgs)) {
      iterateCfgs(cfgOrArr, (cfg) => {
        if (!cfg || cfg.x == null || cfg.y == null) return;

        let val = '';
        try {
          val = resolveValueForField(key, cfg);
        } catch (e) {
          val = '';
        }

        if ((val === null || String(val).trim() === '') && cfg && cfg.hasOwnProperty('value')) {
          val = cfg.value;
        }

        if ((val === null || String(val).trim() === '') && key && String(key).includes('.')) {
          const parts = String(key).split('.');
          let v = data;
          for (const p of parts) {
            if (v == null) { v = undefined; break; }
            v = v[p];
          }
          val = v;
        }

        // BOXES ARRAY FALLBACK
        if ((val === null || String(val).trim() === '') && key) {
          try {
            const parts = String(key).split('.');
            const last = parts[parts.length - 1] || '';
            const boxMatch = String(last).match(/^([A-G])(\d{1,2})$/i);
            if (boxMatch) {
              const letter = boxMatch[1].toUpperCase();
              const num = parseInt(boxMatch[2], 10);
              const idxMedical = parts.findIndex(p => String(p).toLowerCase() === 'medical');
              const boxesRoot = (idxMedical >= 0)
                ? parts.slice(0, idxMedical + 1).concat(['boxes']).join('.')
                : 'medical.boxes';
              const boxesObj = (function(){
                return getNested(data, boxesRoot) || getNested(bag, boxesRoot) || getNested(data, 'medical.boxes');
              })();
              if (boxesObj && typeof boxesObj === 'object') {
                const arr = boxesObj[letter];
                if (Array.isArray(arr)) val = arr[Math.max(0, num - 1)];
              }
            }
          } catch (e) {}
        }

        if ((val === null || val === undefined || String(val).trim() === '') && (bag[key] !== undefined || data[key] !== undefined)) {
          val = data[key] !== undefined ? data[key] : bag[key];
        }

        if (!truthy(val)) return;

        const mark = cfg && cfg.mark ? cfg.mark : 'X';
        const size = cfg && (cfg.box || cfg.size) ? (cfg.box || cfg.size) : 12;
        const adj = size * 0.35;
        page.drawText(String(mark), { x: cfg.x - adj, y: cfg.y - adj, size, font: helv });
      });
    }
  } // end pages loop

  // signatures
  if (sigGuestPNG || sigGuardianPNG) {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const cfg = map[pageIndex] || {};
      const page = pages[pageIndex];
      if (!page) continue;

      if (sigGuestPNG && cfg.sigGuest) {
        iterateCfgs(cfg.sigGuest, async (sgCfg) => {
          if (!sgCfg || sgCfg.x == null || sgCfg.y == null) return;
          try {
            const sig = await pdfDoc.embedPng(sigGuestPNG);
            const targetW = sgCfg.width || 220;
            const targetH = sgCfg.height || (sig.height * (targetW / sig.width));
            const scale = Math.min(targetW / sig.width, targetH / sig.height);
            const w = sig.width * scale;
            const h = sig.height * scale;
            page.drawImage(sig, { x: sgCfg.x, y: sgCfg.y, width: w, height: h });
          } catch (e) { console.warn('Guest signature embed error:', e && e.message); }
        });
      }

      const isMinor = calcIsMinor(data.dob);
      if (isMinor && sigGuardianPNG && cfg.sigGuardian) {
        iterateCfgs(cfg.sigGuardian, async (sgCfg) => {
          if (!sgCfg || sgCfg.x == null || sgCfg.y == null) return;
          try {
            const sigG = await pdfDoc.embedPng(sigGuardianPNG);
            const targetW = sgCfg.width || 220;
            const targetH = sgCfg.height || (sigG.height * (targetW / sigG.width));
            const scale = Math.min(targetW / sigG.width, targetH / sigG.height);
            const w = sigG.width * scale;
            const h = sigG.height * scale;
            page.drawImage(sigG, { x: sgCfg.x, y: sgCfg.y, width: w, height: h });
          } catch (e) { console.warn('Guardian signature embed error:', e && e.message); }
        });
      }
    }
  }

  return await pdfDoc.save();
}

function ensureFormFileExists(relName) {
  const candidate = path.resolve(FORMS_DIR, String(relName || '').trim());
  if (!relName) throw new Error('Form file name is empty/undefined in fieldMap.formFiles');
  if (!fs.existsSync(candidate)) {
    throw new Error(`Required form file not found: ${relName} (looked in ${FORMS_DIR})`);
  }
  return candidate;
}

async function appendOriginalFilled(packetDoc, relName, data) {
  const srcPath = ensureFormFileExists(relName);
  const srcBytes = fs.readFileSync(srcPath);
  const guestSig = data.signature ? b64ToUint8(data.signature) : null;
  const guardianSig = (calcIsMinor(data.dob) && data.guardianSignature) ? b64ToUint8(data.guardianSignature) : null;

  const filledBytes = await overlayWithData(srcBytes, relName, data, guestSig, guardianSig);
  const srcDoc = await PDFDocument.load(filledBytes);
  const pageIndices = srcDoc.getPageIndices();
  const pages = await packetDoc.copyPages(srcDoc, pageIndices);
  pages.forEach(p => packetDoc.addPage(p));
}

async function makeCoverSheet(data, label, sigGuestPNG, sigGuardianPNG) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const nameParts = buildNameParts(data);
  const fullName = (nameParts.fullName || data.name || '').trim();

  const draw = (text, x, y, font=helv, size=12) => page.drawText(String(text || ''), { x, y, size, font });

  draw('DIVEIndia Forms Packet', 72, 740, helvBold, 20);
  draw(`Center: ${label}`, 72, 712, helvBold, 14);

  let y = 680;
  const lines = [
    ['Name', fullName || '—'],
    ['DOB', toDDMMYYYY(data.dob) || '—'],
    ['Email', data.email || '—'],
    ['Phone', data.phone || '—'],
    ['Facility', (data.facilityName || '')],
    ['Submitted', toDDMMYYYY(new Date())]
  ];
  for (const [k,v] of lines) {
    draw(`${k}:`, 72, y, helvBold, 12);
    draw(v, 160, y, helv, 12);
    y -= 18;
  }

  try {
    if (sigGuestPNG) {
      const img = await doc.embedPng(sigGuestPNG);
      const w = 180, h = img.height * (w / img.width);
      page.drawImage(img, { x: 72, y: 560 - h, width: w, height: h });
      draw('Guest Signature', 72, 565, helv, 10);
    }
    if (sigGuardianPNG) {
      const img = await doc.embedPng(sigGuardianPNG);
      const w = 180, h = img.height * (w / img.width);
      page.drawImage(img, { x: 300, y: 560 - h, width: w, height: h });
      draw('Guardian Signature', 300, 565, helv, 10);
    }
  } catch (e) {
    console.warn('Cover signature render warning:', e.message);
  }

  return doc;
}

async function buildPacketBuffers(data) {
  const isMinor = calcIsMinor(data.dob);
  const centers = Array.isArray(data.centers) ? data.centers : [data.centers].filter(Boolean);
  const suffixes = centerSuffixes(centers);

  const requiredKeys = ['medical', 'waiver', 'boat', 'rdc', ...(isMinor ? ['youth'] : [])];
  for (const key of requiredKeys) ensureFormFileExists(formFiles[key]);

  const packets = [];
  const packetLabels = centers.length > 1 ? suffixes : [suffixes[0] || centers[0] || 'Havelock'];

  for (let i = 0; i < packetLabels.length; i++) {
    const label = packetLabels[i];
    console.log(`🧩 Building packet for: ${label}`);

    const packetDoc = await makeCoverSheet(data, label,
      data.signature ? b64ToUint8(data.signature) : null,
      (isMinor && data.guardianSignature) ? b64ToUint8(data.guardianSignature) : null
    );

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
