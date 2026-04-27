const pool = require('../db/pool');
const crypto = require('crypto');

/**
 * Compute a canonical hash for dedupe.
 * (Simple version for now — can evolve later)
 */
function computeCanonicalHash({ firstName, lastName, dob }) {
  const base = `${firstName}|${lastName}|${dob}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(base).digest('hex');
}

/**
 * TEMP expiry logic:
 * default = 365 days from submission
 * (will be configurable later)
 */
function computeExpiryDate(submittedAt = new Date(), days = 365) {
  const d = new Date(submittedAt);
  d.setDate(d.getDate() + days);
  return d;
}

async function createSubmission(payload) {
  const {
    firstName,
    lastName,
    dob,
    email,
    phone,
    nationality,
    address,
    centers,
    parentName,
    guardianEmail,
    guardianPhone,
    medical,
    signature,
    guardianSignature
  } = payload;

  const isMinor = !!parentName;

  const canonicalHash = computeCanonicalHash({
    firstName,
    lastName,
    dob
  });

  const physicianRequired = !!medical?.needsMedicalClearance;

  const expiryDate = computeExpiryDate();

  const result = await pool.query(
    `
    INSERT INTO submissions (
      facility,
      diver_first,
      diver_last,
      diver_dob,
      diver_email,
      diver_phone,
      diver_nationality,
      diver_address,
      is_minor,
      guardian_name,
      guardian_email,
      guardian_phone,
      medical_json,
      signatures_json,
      physician_required,
      expiry_date,
      canonical_hash,
      source,
      metadata
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
      $13,$14,$15,$16,$17,$18,$19
    )
    RETURNING id
    `,
    [
      centers?.[0] || null,
      firstName,
      lastName,
      dob || null,
      email || null,
      phone || null,
      nationality || null,
      address || null,
      isMinor,
      parentName || null,
      guardianEmail || null,
      guardianPhone || null,
      medical || null,
      {
        guest: signature || null,
        guardian: guardianSignature || null
      },
      physicianRequired,
      expiryDate,
      canonicalHash,
      'web-form',
      {
        userAgent: payload._userAgent || null,
        diverType: payload.diverType || null,
        activityType: payload.activityType || null,
        selectedForms: Array.isArray(payload.selectedForms) ? payload.selectedForms : [],
        centers: Array.isArray(payload.centers) ? payload.centers : [],
        fullPayload: payload
      }
    ]
  );

  return result.rows[0].id;
}

function rowToSubmissionPayload(row) {
  if (row?.metadata?.fullPayload) return row.metadata.fullPayload;

  const signatures = row.signatures_json || {};
  const metadata = row.metadata || {};
  const centers = Array.isArray(metadata.centers) && metadata.centers.length
    ? metadata.centers
    : [row.facility].filter(Boolean);
  const firstName = row.diver_first || '';
  const lastName = row.diver_last || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return {
    firstName,
    lastName,
    fullName,
    name: fullName,
    dob: row.diver_dob ? new Date(row.diver_dob).toISOString().slice(0, 10) : null,
    email: row.diver_email || null,
    phone: row.diver_phone || null,
    centers,
    center: centers[0] || null,
    parentName: row.guardian_name || null,
    guardianEmail: row.guardian_email || null,
    guardianPhone: row.guardian_phone || null,
    medical: row.medical_json || null,
    signature: signatures.guest || null,
    guardianSignature: signatures.guardian || null,
    diverType: metadata.diverType || null,
    activityType: metadata.activityType || null,
    selectedForms: Array.isArray(metadata.selectedForms) ? metadata.selectedForms : [],
    guestFillingDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : null
  };
}

async function listSubmissions({ search = '', limit = 50 } = {}) {
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const term = String(search || '').trim();
  const values = [];
  let where = '';

  if (term) {
    values.push(`%${term.toLowerCase()}%`);
    where = `
      WHERE lower(coalesce(diver_first,'') || ' ' || coalesce(diver_last,'')) LIKE $1
         OR lower(coalesce(diver_email,'')) LIKE $1
         OR lower(coalesce(diver_phone,'')) LIKE $1
         OR lower(coalesce(facility,'')) LIKE $1
    `;
  }

  values.push(boundedLimit);
  const limitParam = values.length;

  const result = await pool.query(
    `
    SELECT id, created_at, facility, diver_first, diver_last, diver_email,
           diver_phone, diver_dob, is_minor, physician_required, expiry_date,
           source, metadata
    FROM submissions
    ${where}
    ORDER BY created_at DESC
    LIMIT $${limitParam}
    `,
    values
  );

  return result.rows;
}

async function getSubmission(id) {
  const result = await pool.query(
    `
    SELECT *
    FROM submissions
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  createSubmission,
  listSubmissions,
  getSubmission,
  rowToSubmissionPayload
};
