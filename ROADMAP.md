# DIVEIndia Backup Forms Roadmap

This roadmap tracks the local-network backup form utility. Recent completed work: admin workflow setup, activity-based form selection, separate component PDF attachments in one email, admin password protection, and repo-local memory/instructions.

## Layer 0 - Keep Current Backup Flow Safe

- [x] **Separate PDF attachments** - Generate each selected component form as its own PDF and attach all generated PDFs to one single email. (done session 2026-04-27)
- [x] **Admin workflow setup** - Add a staff-facing setup screen for diver type, activity type, and PDF outputs. (done session 2026-04-27)
- [x] **Server-side form defaults** - Enforce activity-based output defaults on the backend so stale browser payloads cannot drop required forms. (done session 2026-04-27)
- [x] **Admin password gate** - Protect the admin setup route with a simple password. (done session 2026-04-27)
- [ ] **DB failure should not block PDFs** - Reconcile current code with the intended backup behavior: if Postgres is down, still generate/save/email PDFs and log the DB failure clearly.
- [ ] **Submission smoke-test checklist** - Create a repeatable manual test checklist for course, fun dive, course plus fun dive, minor, and both-center submissions.
- [ ] **Server-side validation** - Add minimal backend validation for required identity fields, centers, DOB, email, signatures, and medical answers.

## Layer 1 - Operational Admin Tools

- [x] **One-click Windows launcher** - Add a root launcher script that starts the Node server from the right folder and opens admin in the browser. (done session 2026-04-27)
- [x] **Launch dashboard with QR codes** - Add an admin launch view showing local, LAN, and optional public guest/admin links with QR codes. (done session 2026-04-27)
- [x] **Public URL readiness check** - Check configured public/tunnel URL against `/healthz` and show reachable/error status without replacing LAN fallback. (done session 2026-04-27)
- [x] **Roadmap kanban tab** - Add a roadmap data file and admin kanban renderer for tracking product work. (done session 2026-04-27)
- [x] **PDF coordinate mapper link** - Add an admin link to the existing frontend PDF coordinate mapper utility. (done session 2026-04-27)
- [x] **Future pathway placeholders** - Show planned XR, freediving, and snorkeling paperwork pathways in admin without enabling unmapped forms. (done session 2026-04-27)
- [x] **Pathway development workspace** - Let admin click planned pathways, review forms/rules/questions, track readiness, and save local notes before implementation. (done session 2026-04-27)
- [x] **Submission browser** - Admin view for recent DB submissions with search by name, email, phone, and center. (done session 2026-04-27)
- [x] **Regenerate submission PDFs** - Allow staff to rerun PDF filling for a selected DB submission, then download admin-protected generated files. (done session 2026-04-27)
- [x] **Resend email action** - Allow staff to resend regenerated PDFs for a selected submission as one email to a specified address. (done session 2026-04-27)
- [ ] **Test mode controls** - Add a visible admin control for test mode/local-save behavior instead of relying on query params or headers.
- [ ] **Environment health panel** - Show DB status, SMTP status, forms directory status, and LAN URL in the admin panel.
- [ ] **Public tunnel integration** - Choose and wire Cloudflare Tunnel, ngrok, or Tailscale Funnel so the launch page's public URL can become reachable with local-network fallback.

## Layer 2 - Form Coverage and Polish

- [ ] **Extensible form catalog** - Replace hardcoded form keys/rules with a catalog that can represent scuba, XR, freediving, snorkeling, student, and fun-diver pathways.
- [ ] **PDF intake and mapping workflow** - Define where new source PDFs are stored, how they are named, how coordinate maps are created, and how a mapped PDF becomes selectable.
- [ ] **Promote pathway workspace to implementation queue** - Convert a ready planned pathway into code tasks for form catalog entries, PDF files, coordinate maps, output rules, and smoke tests.
- [ ] **Medical contact fields** - Finish coordinate mapping for email/phone fields on the medical PDF.
- [ ] **XR pathway** - Add Extended Range support, including XR waiver and XR RDC source PDFs, coordinate maps, and activity-to-output rules.
- [ ] **Freediving fun diver pathway** - Define, load, map, and route the paperwork needed for certified/non-student freediving guests.
- [ ] **Freediving student pathway** - Define, load, map, and route the paperwork needed for freediving students.
- [ ] **Snorkeling fun diver pathway** - Define, load, map, and route the paperwork needed for snorkeling guests.
- [ ] **Snorkeling student pathway** - Define, load, map, and route the paperwork needed for snorkeling students.
- [ ] **Center expansion support** - Make facility names, center codes, and per-center outputs data-driven for future DIVEIndia locations.

## Design conversations needed

| Item | Layer | Key questions |
| --- | --- | --- |
| Extensible form catalog | Layer 2 | What is the stable vocabulary for diver type, activity type, certification/student status, center specificity, and age gates? |
| PDF intake and mapping workflow | Layer 2 | Where should unmapped source PDFs live, and what checklist promotes them into active selectable outputs? |
| Promote pathway workspace to implementation queue | Layer 2 | Should readiness notes become a generated checklist, GitHub issue, or just roadmap updates? |
| Snorkeling fun/student pathways | Layer 2 | What health declaration is sufficient, and does snorkeling use the current liability waiver or separate documents? |
| Freediving fun/student pathways | Layer 2 | Which SSI freediving forms are required, and are they center-specific or student-specific? |
| XR pathway | Layer 2 | Are XR waiver and XR RDC enough, or are there extra risk/equipment/instructor forms? |
| DB failure should not block PDFs | Layer 0 | Should failed DB writes be retried later, saved to a local queue, or only logged? |
| Public tunnel integration | Layer 1 | Should the public URL use Cloudflare Tunnel/domain, ngrok, or Tailscale Funnel, and who manages the account/domain? |

## Deferred - not building for now

| Item | Why deferred |
| --- | --- |
| Automatic PDF coordinate detection | Manual coordinate maps are more predictable for these source PDFs, and previous auto-detection attempts were rolled back. |
| Full authentication system | Current operational need is a LAN backup tool; simple admin password protection is enough for now. |
