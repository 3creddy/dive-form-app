/**
 * import-legacy-csv.js
 *
 * Usage:
 *   node import-legacy-csv.js ./data/legacy.csv
 *
 * What it does:
 *   - Reads CSV file (header row required)
 *   - Normalizes fields (name/email/phone/dob/etc)
 *   - Computes canonical hash for dedupe
 *   - Inserts each row into staging_submissions
 *   - Logs errors but continues importing
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const crypto = require('crypto');

// -------------------------------
// DB connection
// -------------------------------
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:YOUR_PASSWORD@localhost:5432/diveindia_dev",
});

// -------------------------------
// Normalization helpers
// -------------------------------

// lowercase, alphanumeric only
function normAlphaNumLower(s) {
  if (!s) return "";
  return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// phone: keep digits + optional leading plus
function normPhone(s) {
  if (!s) return "";
  const raw = s.toString().trim();
  const plus = raw.startsWith("+") ? "+" : "";
  return plus + raw.replace(/[^0-9]/g, "");
}

function normEmail(s) {
  if (!s) return "";
  return s.toString().trim().toLowerCase();
}

// Try to parse date from "DD/MM/YYYY" or ISO formats
function parseDate(s) {
  if (!s) return null;
  const str = s.toString().trim();

  // Try ISO (YYYY-MM-DD etc)
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) {
    return iso.toISOString().slice(0, 10);
  }

  // Try DD/MM/YYYY or D/M/YYYY
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const dd = d.padStart(2, "0");
    const mm = mo.padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  return null; // unparseable
}

// Generate canonical fingerprint for dedupe
function computeCanonicalHash(first, last, email, phone, dob) {
  const parts = [
    normAlphaNumLower(first),
    normAlphaNumLower(last),
    normAlphaNumLower(email),
    normPhone(phone).replace(/^\+/, ""), // strip leading + for canonical form
    dob || "",
  ];
  return crypto
    .createHash("sha256")
    .update(parts.join("|"), "utf8")
    .digest("hex");
}

// -------------------------------
// Row mapper (CSV → normalized fields)
// -------------------------------
function mapRowToFields(row) {
  const get = (candidates) => {
    for (const key of candidates) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }
    return null;
  };

  const first = get(["first_name", "firstname", "given_name", "diver_first", "name_first"]);
  const last = get(["last_name", "lastname", "surname", "diver_last"]);
  const email = get(["email", "email_address", "diver_email"]);
  const phone = get(["phone", "mobile", "phone_number", "diver_phone"]);
  const dobRaw = get(["dob", "date_of_birth", "birthdate", "diver_dob"]);

  const facility = get(["facility", "centre", "center", "site"]) || "HAVELOCK";

  const minorRaw = (get(["is_minor", "minor", "under18"]) || "").toString().toLowerCase();
  const isMinorBool = ["1", "true", "yes", "y", "t"].includes(minorRaw);

  return {
    facility,
    diver_first: first || "",
    diver_last: last || "",
    diver_email: normEmail(email),
    diver_phone: normPhone(phone),
    diver_dob: parseDate(dobRaw),
    diver_nationality: get(["nationality", "country"]),
    diver_address: get(["address", "addr", "residence"]),
    is_minor: isMinorBool,
    guardian_name: get(["guardian_name", "guardian"]),
    guardian_email: normEmail(get(["guardian_email"])),
    guardian_phone: normPhone(get(["guardian_phone"])),
    highest_cert: get(["certification", "highest_cert", "cert"]),
    cert_agency: get(["cert_agency", "agency"]),
    cert_number: get(["cert_number", "cert_no"]),
    total_dives: parseInt(get(["total_dives", "dives"]), 10) || null,
    last_dive_date: parseDate(get(["last_dive_date", "last_dive"])),
    activity_date: parseDate(get(["activity_date", "trip_date"])),
    boat_event_ref: get(["boat", "event", "event_ref"]),
    medical_json: {}, // optional add-later
  };
}

// -------------------------------
// Insert row into staging_submissions
// -------------------------------
async function insertStaging(client, fileName, rowNumber, rawRow, fields, canonical_hash) {
  const sql = `
    INSERT INTO staging_submissions (
      source_file, source_row_number, raw_json,
      facility, diver_first, diver_last, diver_email, diver_phone, diver_dob,
      diver_nationality, diver_address, is_minor, guardian_name, guardian_email, guardian_phone,
      highest_cert, cert_agency, cert_number, total_dives, last_dive_date,
      activity_date, boat_event_ref, medical_json, canonical_hash, normalized
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    )
    RETURNING id;
  `;

  const vals = [
    fileName,
    rowNumber,
    rawRow,
    fields.facility,
    fields.diver_first,
    fields.diver_last,
    fields.diver_email,
    fields.diver_phone,
    fields.diver_dob,
    fields.diver_nationality,
    fields.diver_address,
    fields.is_minor,
    fields.guardian_name,
    fields.guardian_email,
    fields.guardian_phone,
    fields.highest_cert,
    fields.cert_agency,
    fields.cert_number,
    fields.total_dives,
    fields.last_dive_date,
    fields.activity_date,
    fields.boat_event_ref,
    JSON.stringify(fields.medical_json || {}),
    canonical_hash,
    true,
  ];

  const res = await client.query(sql, vals);
  return res.rows[0].id;
}

// -------------------------------
// Main import logic
// -------------------------------
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  const client = await pool.connect();
  let rowNumber = 0;
  let ok = 0;

  try {
    for await (const record of parser) {
      rowNumber++;
      try {
        const fields = mapRowToFields(record);
        const canonical_hash = computeCanonicalHash(
          fields.diver_first,
          fields.diver_last,
          fields.diver_email,
          fields.diver_phone,
          fields.diver_dob
        );

        await insertStaging(
          client,
          fileName,
          rowNumber,
          record,
          fields,
          canonical_hash
        );

        ok++;
        if (ok % 100 === 0) console.log(`Imported ${ok} rows...`);
      } catch (err) {
        console.error(`Row ${rowNumber} ERROR: ${err.message}`);
        await client.query(
          `
          INSERT INTO staging_submissions (source_file, source_row_number, raw_json, import_error)
          VALUES ($1,$2,$3,$4)
        `,
          [fileName, rowNumber, record, err.message]
        );
      }
    }
  } finally {
    client.release();
    console.log(`Finished. Imported OK = ${ok} rows.`);
  }
}

// -------------------------------
// Run
// -------------------------------
(async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node import-legacy-csv.js <path-to-csv>");
    process.exit(1);
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error("CSV file not found:", abs);
    process.exit(1);
  }

  console.log("Importing:", abs);
  try {
    await processFile(abs);
    console.log("Done.");
  } catch (err) {
    console.error("Import failed:", err);
  } finally {
    pool.end();
  }
})();
