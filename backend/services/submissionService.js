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
        userAgent: payload._userAgent || null
      }
    ]
  );

  return result.rows[0].id;
}

module.exports = {
  createSubmission
};
