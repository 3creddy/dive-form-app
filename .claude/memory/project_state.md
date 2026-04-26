# Project State

## What this app is

An offline-capable web form app for DIVEIndia (scuba dive centers, currently Havelock + Neil Island under SSI affiliation). It replaces/supplements Zoho Forms for collecting signed liability and medical paperwork from anyone entering the water, served over local WiFi so it works without internet.

The problem it solves: SSI's own system only covers SSI students whose courses are unlocked under DIVEIndia's center. Everyone else (fun divers, PADI students, SSI students under a different center, snorkelers, freedivers) needs paperwork collected outside SSI. This app collects that paperwork, fills pre-built PDFs with the form data, and emails them when internet is available.

## Diver types that need forms

1. **Fun divers** — certified divers, not students. Need medical + boat waiver + general waiver (liability release). Age-dependent (minors need guardian + youth addendum).
2. **SSI students (courses NOT under DIVEIndia)** — same as fun divers from a paperwork perspective. SSI system either doesn't apply or has wrong-center forms.
3. **PADI students with freelance instructors** — completely outside SSI, need full DIVEIndia paperwork set.
4. **SSI students (courses under DIVEIndia)** — primary paperwork goes via SSI system. This app is a fallback or supplement.
5. **Snorkelers** — lighter form set (no scuba medical depth, still need liability waiver + basic health check).
6. **Freedivers** — SSI freediving pathway, has its own forms.
7. **Recreational scuba students** — full form set.
8. **Extended range (XR) students** — full form set, potentially additional forms.
9. **Minors (any category)** — guardian signature required + Youth Addendum PDF.

## Form types (PDFs currently mapped)

| Form | Applies to |
|------|-----------|
| Medical Statement | All divers doing any underwater activity |
| Boat Waiver (Havelock / Neil variants) | All |
| General Waiver | All |
| RDC Liability Release | All |
| Youth Addendum | Minors only |

More PDFs need coordinate-mapping for freediving / snorkeling / XR pathways.

## Internet / local network toggle

Goal: same QR code / link works whether app is internet-accessible or LAN-only. Currently no toggle — server runs on port 3000, local only.

## Medical form conditional logic

Answering "yes" to certain questions cascades into mandatory "yes" answers on follow-up boxes (A–G). This is partly implemented on the frontend. A physician sign-off requirement can be triggered.

## Deployment & infra

- Running locally on port 3000 (no live deployment URL yet)
- Stack: Node.js / Express, PostgreSQL (optional/non-blocking), pdf-lib, Nodemailer, Vanilla JS
- Backend entry: `backend/server.js` — serves static files from `frontend/`
- Start: open terminal in `backend/` folder → `node server.js` → prints LAN IP(s) to console
- Two centers currently: Havelock, Neil. More planned as DIVEIndia scales.
- **CRITICAL: the current flow (form → PDF generation → local save / email) is working and in active use as a backup to the main Zoho + SSI system. Nothing we build should break this. Every change must be tested against a real submission before committing.**

## Non-obvious design decisions

- PDF generation uses manual x/y coordinate maps (coordMap.js) — not AcroForm fields. Coordinates break if PDFs are re-exported or resized.
- Postgres insert is non-blocking: if DB is down, submission still generates PDFs.
- Email transport is created per-request (not a singleton).
- Do NOT use Claude API or any AI to auto-detect PDF field positions — this was tried and rolled back. Stay on manual coordinate mapping.

## Active bugs (known, not yet fixed)

- Some coordMap.js entries are commented out (email/phone fields on medical form)
- No server-side input validation (email format, phone, name length)
- Duplicate submission detection exists (canonical hash) but not enforced

## Session history (newest first)

### Session 3 (2026-04-26)
Rolled back repo to 4175da4 (last known-working backup before Postgres/admin experiments). Memory files preserved and restored. Clean slate for design-first approach over next sessions.

### Session 2 (2026-04-26)
Consolidated memory systems. Resolved merge conflicts. No feature code changed.

### Session 1 (2026-04-26)
Set up session system and captured full business context. Created ROADMAP.md, roadmap kanban. No submission flow or PDF logic changed.
