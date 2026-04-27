# Project State

## What This App Is

This is a standalone local-network backup registration utility for DIVEIndia. It is used when the normal online customer registration flow is too slow, unavailable, or frustrating for a guest. Staff run it on local WiFi/LAN, collect the distilled minimum customer data, generate signed PDFs, and email them when internet/SMTP is available.

The current stack is:

- Vanilla HTML/JS frontend served from `frontend/`
- Node/Express backend in `backend/server.js`
- PDF filling with `pdf-lib` and manual coordinate maps
- Nodemailer for email
- Postgres submission storage via `DATABASE_URL`

## Core Form Rules

The app generates separate PDF attachments, not one combined bundle. All generated PDFs should go on the same single email.

Current mapped forms:

- `medical`: Medical declaration. Applies to anyone diving with DIVEIndia.
- `rdc`: Responsible Diver Code. Applies to course/training guests.
- `waiver`: Assumption of risk / liability release / hold harmless agreement. Applies to course/training guests.
- `boat`: Boat waiver. Applies to certified fun divers and guests who have completed a course and are fun diving.
- `youth`: Youth waiver addendum. This is specifically an addendum to the waiver and is auto-included for minors only when waiver is included.

Current activity defaults:

- `course`: `medical + rdc + waiver`
- `fun_dive`: `medical + boat`
- `course_and_fun_dive`: `medical + rdc + waiver + boat`
- Minor guest with waiver: add `youth`

Backend must enforce these defaults from `activityType`/`diverType` as a safety net, even if the browser sends a stale or incomplete `selectedForms` array.

## Admin Page

The staff-facing setup page is `frontend/admin.html`, served at `/admin` and `/admin.html`.

- It chooses diver type, activity type, and desired PDF outputs.
- It includes a Roadmap tab that mounts the vanilla JS kanban renderer.
- It links to the existing PDF coordinate mapper at `/pdf%20coordinate%20mapper/pdf-coordinate-tester-lite.html`.
- It shows disabled/planned placeholders for XR, freediving, and snorkeling pathways until source PDFs are loaded and mapped.
- It includes a Submissions tab for browsing DB submissions, regenerating filled PDFs, downloading regenerated files, and emailing regenerated PDFs to a specified address.
- It stores setup in browser `localStorage` under `diveFormAdminConfig`.
- The guest-facing form reads that config quietly.
- The guest page should not expose the full admin matrix.
- Admin access is protected by HTTP Basic auth. Default password is `password123`, configurable as `ADMIN_PASSWORD`.

## Future Paperwork Pathways

The app needs the same overarching model for multiple pathways: diver/activity type -> required output forms -> source PDF files -> coordinate maps -> generated separate PDF attachments -> one email.

Planned but not yet active because PDFs are not loaded/mapped:

- Extended Range (XR): XR waiver and XR RDC are expected.
- Freediving fun divers: required form set still needs scoping.
- Freediving students: required form set still needs scoping.
- Snorkeling fun divers: required form set still needs scoping.
- Snorkeling students: required form set still needs scoping.

Do not enable these as selectable outputs until their source PDFs exist in the repo and their coordinate maps are complete.

## Roadmap System

Roadmap has two manually synced sources:

- `ROADMAP.md`: human-readable plan with layered checklist sections, design conversations, and deferred items.
- `public/data/roadmap.json`: machine-readable data served at `/data/roadmap.json` for the admin kanban UI.

The renderer is `public/js/admin/roadmap.js`. It is vanilla JS, self-contained, and mounts into `<div id="roadmap-root">` when `initRoadmap()` is called from the admin Roadmap tab.

Whenever one roadmap source changes, update the other in the same session.

## Guest Form

The guest-facing form is `frontend/index.html`, served at `/`.

- It collects participant details, dive center(s), signatures, and medical Q1-Q10.
- If DOB is under 18, guardian fields/signature are shown and required.
- It displays only a compact staff setup summary and an admin link.

## Backend Flow

Submit route: `POST /submit`

1. Normalize centers.
2. Normalize selected forms server-side.
3. Save raw JSON in `submissions/`.
4. Save submission to Postgres.
5. Build component PDF buffers via `buildComponentFormBuffers`.
6. In test mode or if mailer is unavailable, save separate PDFs locally.
7. Otherwise call `sendPackets` once so all component PDFs attach to one email.

Important current caveat: the code currently blocks PDF/email generation if Postgres insert fails. Earlier memory said DB should be non-blocking; code and desired behavior may need reconciliation.

Admin regeneration flow:

1. Admin calls `/admin/api/submissions` to browse/search DB rows.
2. Admin calls `/admin/api/submissions/:id` to view a row and reconstructed regeneration payload.
3. Admin calls `/admin/api/submissions/:id/generate` with `action: "save"` to regenerate PDFs and get protected download links.
4. Admin calls the same endpoint with `action: "email"` and an email address to send one email with regenerated PDFs as separate attachments.

New submissions store `metadata.fullPayload` so future regeneration can use the original form payload. Older rows are reconstructed from DB columns, `medical_json`, `signatures_json`, and metadata when possible.

## Non-Obvious Design Decisions

- PDF filling uses manual x/y coordinate overlays in `backend/utils/coordMap.js`, not AcroForm fields.
- Coordinates can break if source PDFs are re-exported, resized, or replaced.
- Do not introduce AI/automatic field-position detection for PDF mapping unless the user explicitly asks.
- Center-specific forms (`medical`, `waiver`, `boat`) may produce per-center PDFs.
- RDC and youth waiver addendum are generated once.

## Known Sharp Edges

- Some medical email/phone coordinate entries are still commented out.
- Server-side validation is minimal.
- Duplicate canonical hashes are computed but not enforced.
- `postgres/import-legacy-csv.js` references `staging_submissions`, but the current migration may not create it.
- `.env.example` should stay aligned with required env vars: `DATABASE_URL`, `ADMIN_PASSWORD`, SMTP settings, and `DEFAULT_RECIPIENTS`.

## Recent Session Notes

### 2026-04-27

Added admin-driven form selection and separate component PDF generation. The admin page stores workflow config locally; the guest form reads it. Backend now normalizes selected forms from activity type so stale payloads still generate required outputs. Email path sends one message with all selected PDFs as separate attachments. Admin access is protected with password `password123` by default.

Added the roadmap system: `ROADMAP.md`, `public/data/roadmap.json`, and `public/js/admin/roadmap.js`, with an admin Roadmap tab. Future roadmap edits must keep Markdown and JSON in sync.

Added admin placeholders for future XR, freediving, and snorkeling pathways plus a link to the PDF coordinate mapper. Roadmap updated with extensible form catalog and PDF intake/mapping workflow tasks.

Added admin submission browser and regeneration actions. Staff can search DB submissions, regenerate PDFs for a selected submission, download admin-protected regenerated files, or email regenerated PDFs to a specified address.
