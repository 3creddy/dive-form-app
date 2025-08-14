// backend/debugGrid.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const FORMS_DIR = path.resolve(__dirname, '../forms');

async function gridOverlayFor(file) {
  const bytes = fs.readFileSync(path.join(FORMS_DIR, file));
  const pdfDoc = await PDFDocument.load(bytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    // Draw light grid every 25 pts
    const step = 25;
    for (let x = 0; x <= width; x += step) {
      page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: rgb(0.9,0.9,0.9), thickness: 0.5 });
      if (x % 100 === 0) {
        page.drawText(String(x), { x: x + 2, y: 2, size: 8, font: helv, color: rgb(0.4,0.4,0.4) });
      }
    }
    for (let y = 0; y <= height; y += step) {
      page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: rgb(0.9,0.9,0.9), thickness: 0.5 });
      if (y % 100 === 0) {
        page.drawText(String(y), { x: 2, y: y + 2, size: 8, font: helv, color: rgb(0.4,0.4,0.4) });
      }
    }
    // Page label
    page.drawText(`page ${idx} — ${Math.round(width)}x${Math.round(height)} pts`, {
      x: 10, y: height - 15, size: 10, font: helv, color: rgb(0.2,0.2,0.2)
    });
  });

  return await pdfDoc.save();
}

async function gridAll() {
  const files = fs.readdirSync(FORMS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  const out = {};
  for (const f of files) {
    try {
      out[f] = 'ok';
    } catch (e) {
      out[f] = e.message;
    }
  }
  return { files };
}

module.exports = { gridOverlayFor };
