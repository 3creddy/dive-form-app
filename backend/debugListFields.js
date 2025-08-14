// backend/debugListFields.js
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const FORMS_DIR = path.resolve(__dirname, '../forms');

async function listFieldsForFile(filename) {
  const bytes = fs.readFileSync(path.join(FORMS_DIR, filename));
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  return fields.map(f => ({
    name: f.getName(),
    type: f.constructor.name // e.g., PDFTextField, PDFCheckBox, PDFDropdown, etc.
  }));
}

async function listAll() {
  const results = {};
  const files = fs.readdirSync(FORMS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  for (const f of files) {
    try {
      results[f] = await listFieldsForFile(f);
    } catch (e) {
      results[f] = { error: e.message };
    }
  }
  return results;
}

module.exports = { listAll };
