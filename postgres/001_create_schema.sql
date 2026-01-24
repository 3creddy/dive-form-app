-- 001_create_schema.sql
-- Schema for DIVEIndia submissions system
-- Run on Postgres 12+ (works on managed Postgres at Supabase, Render, ElephantSQL, AWS RDS, etc.)

-- 1) Useful extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- optional, for levenshtein/soundex
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- for digest() hashing

-- 2) Users table (registered guests / accounts)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text,
  first_name text,
  last_name text,
  dob date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Submissions table (canonical store for form fills)
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  facility text NOT NULL, -- e.g. HAVELOCK, NEIL
  diver_first text,
  diver_last text,
  diver_dob date,
  diver_email text,
  diver_phone text,
  diver_nationality text,
  diver_address text,
  is_minor boolean DEFAULT false,
  guardian_name text,
  guardian_email text,
  guardian_phone text,
  highest_cert text,
  cert_agency text,
  cert_number text,
  total_dives int,
  last_dive_date date,
  insurance_yn boolean,
  insurance_provider text,
  emergency_contact_name text,
  emergency_contact_relation text,
  emergency_contact_phone text,
  activity_date date,
  boat_event_ref text,
  student_vs_certified text,
  medical_json jsonb,         -- medical q1..q10, boxes A..G, physicianRequired bool
  signatures_json jsonb,     -- { guest: url, guardian: url, perPdf: {...} }
  files_json jsonb,          -- stored output PDFs / uploaded IDs (array)
  physician_required boolean DEFAULT false,
  physician_reason jsonb,    -- { byForm: bool, byAndamans: bool }
  user_id uuid REFERENCES users(id),
  expiry_date date,
  canonical_hash text,       -- sha256 hex
  source text,               -- 'web','legacy-csv','manual'
  metadata jsonb,            -- ip_hash, ua, session, etc
  processed boolean DEFAULT false,
  last_processed_at timestamptz
);

-- 4) Events / audit trail
CREATE TABLE IF NOT EXISTS submission_events (
  id bigserial PRIMARY KEY,
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'import','submit','email_sent','pdf_generated','resend_attempt', ...
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5) Indexes for search and performance
-- Trigram index for fuzzy name searches
CREATE INDEX IF NOT EXISTS idx_submissions_name_trgm
  ON submissions USING gin (lower(coalesce(diver_first,'') || ' ' || coalesce(diver_last,'')) gin_trgm_ops);

-- Lowercased email index (fast exact searches)
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions (lower(diver_email));

-- Phone index
CREATE INDEX IF NOT EXISTS idx_submissions_phone ON submissions (diver_phone);

-- DOB index
CREATE INDEX IF NOT EXISTS idx_submissions_dob ON submissions (diver_dob);

-- Canonical hash index for fast exact dedupe checks
CREATE INDEX IF NOT EXISTS idx_submissions_canonical_hash ON submissions (canonical_hash);

-- Created at for reporting
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at);

-- 6) Helper: function to compute canonical_hash from key identity fields
-- Use a normalized concatenation then sha256 -> hex
CREATE OR REPLACE FUNCTION compute_canonical_hash(first text, last text, email text, phone text, dob date)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(
    digest(
      lower(coalesce(regexp_replace(first, '[^a-z0-9]', '', 'g'), '')) || '|' ||
      lower(coalesce(regexp_replace(last,  '[^a-z0-9]', '', 'g'), '')) || '|' ||
      lower(coalesce(regexp_replace(email, '[^a-z0-9]', '', 'g'), '')) || '|' ||
      coalesce(regexp_replace(phone, '[^0-9]', '', 'g'), '') || '|' ||
      coalesce(dob::text, ''),
      'sha256'
    ),
    'hex'
  );
$$;

-- 7) Example: materialized view for quick "latest valid submission per diver_email"
-- (optional convenience)
CREATE MATERIALIZED VIEW IF NOT EXISTS latest_valid_by_email AS
SELECT DISTINCT ON (lower(diver_email)) *
FROM submissions
WHERE diver_email IS NOT NULL AND expiry_date IS NOT NULL AND expiry_date >= current_date
ORDER BY lower(diver_email), created_at DESC;

-- Note: refresh materialized view via REFRESH MATERIALIZED VIEW latest_valid_by_email;

-- End of migration
