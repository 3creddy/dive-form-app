# DIVEIndia Backup Forms Roadmap

This roadmap tracks the local-network backup form utility. The product goal is a staff-operated fallback for slow or unavailable internet registration: collect only essential guest details, fill the correct signed PDFs, store submissions when possible, and email the generated paperwork.

Recent completed work from session 2026-04-27:

- The guest workflow now generates separate component PDF attachments and sends all selected forms on one email.
- Admin can choose diver/activity type, review the output matrix, browse stored submissions, regenerate PDFs, download regenerated files, and resend them to a specified email address.
- The admin surface now includes a roadmap kanban, pathway planning workspace, PDF coordinate mapper link, and launch dashboard with local/LAN/public QR cards.
- The Windows launcher can start the backend and, when configured, start an ngrok tunnel while preserving LAN as the offline fallback.
- The guest form was cleaned up for real use: no visible admin setup link, no preview JSON, mobile signature pads track touch input correctly, and submit now shows an in-page spinner/success/error state instead of a browser alert.

## Layer 0 - Keep Current Backup Flow Safe

- [x] **Separate PDF attachments** - Generate each selected component form as its own PDF and attach all generated PDFs to one single email. (done session 2026-04-27)
- [x] **Admin workflow setup** - Add a staff-facing setup screen for diver type, activity type, and PDF outputs. (done session 2026-04-27)
- [x] **Server-side form defaults** - Enforce activity-based output defaults on the backend so stale browser payloads cannot drop required forms. (done session 2026-04-27)
- [x] **Admin password gate** - Protect the admin setup route with a simple password. (done session 2026-04-27)
- [x] **Guest submit lock and spinner** - While a form is submitting, prevent page interaction and show a centered progress state until PDF/email work completes. (done session 2026-04-27)
- [x] **Polished submit success/error modal** - Replace browser alert popups with an in-page completion state: spinner becomes a green tick on success, and errors show in the same modal. (done session 2026-04-27)
- [x] **Mobile signature pad fix** - Resize signature canvases with device-pixel scaling and touch-aware pointer handling so ink follows the finger on phones. (done session 2026-04-27)
- [x] **Guest form cleanup** - Remove the admin setup link/status strip and remove the preview JSON from the guest-facing form. (done session 2026-04-27)
- [ ] **DB failure should not block PDFs** - Reconcile current code with the intended backup behavior: if Postgres is down, still generate/save/email PDFs and log the DB failure clearly.
- [ ] **Submission smoke-test checklist** - Create a repeatable manual test checklist for course, fun dive, course plus fun dive, minor, both-center, LAN QR, public QR, and mobile signature submissions.
- [ ] **Server-side validation** - Add minimal backend validation for required identity fields, centers, DOB, email, signatures, and medical answers.
- [ ] **Operator-facing failure recovery** - Make failed email/DB/PDF states obvious to staff, with clear next steps and enough saved artifacts to recover manually.

## Layer 1 - Operational Admin Tools

- [x] **One-click Windows launcher** - Add a root launcher script that starts the Node server from the right folder and opens admin in the browser. (done session 2026-04-27)
- [x] **Launch dashboard with QR codes** - Add an admin launch view showing local, LAN, and optional public guest/admin links with QR codes. (done session 2026-04-27)
- [x] **Offline QR generation** - Generate QR SVGs locally from the backend so QR display does not depend on an external QR service. (done session 2026-04-27)
- [x] **Public URL readiness check** - Check configured public/tunnel URL against `/healthz` and show reachable/error status without replacing LAN fallback. (done session 2026-04-27)
- [x] **Ngrok launcher support** - Let `Start Dive Forms.bat` read `PUBLIC_BASE_URL`/`PUBLIC_TUNNEL_PROVIDER` and start an ngrok tunnel through PowerShell when configured. (done session 2026-04-27)
- [x] **Roadmap kanban tab** - Add a roadmap data file and admin kanban renderer for tracking product work. (done session 2026-04-27)
- [x] **PDF coordinate mapper link** - Add an admin link to the existing frontend PDF coordinate mapper utility. (done session 2026-04-27)
- [x] **Future pathway placeholders** - Show planned XR, freediving, and snorkeling paperwork pathways in admin without enabling unmapped forms. (done session 2026-04-27)
- [x] **Pathway development workspace** - Let admin click planned pathways, review forms/rules/questions, track readiness, and save local notes before implementation. (done session 2026-04-27)
- [x] **Submission browser** - Admin view for recent DB submissions with search by name, email, phone, and center. (done session 2026-04-27)
- [x] **Regenerate submission PDFs** - Allow staff to rerun PDF filling for a selected DB submission, then download admin-protected generated files. (done session 2026-04-27)
- [x] **Resend email action** - Allow staff to resend regenerated PDFs for a selected submission as one email to a specified address. (done session 2026-04-27)
- [x] **Repo-local working memory** - Add project instructions and memory files so future sessions know the app purpose, form rules, roadmap sync rule, and commit habits. (done session 2026-04-27)
- [ ] **Test mode controls** - Add a visible admin control for test mode/local-save behavior instead of relying on query params or headers.
- [ ] **Environment health panel** - Show DB status, SMTP status, forms directory status, dependency status, configured public URL, and active LAN URL in the admin panel.
- [ ] **Launcher process management** - Detect already-running Node/ngrok processes, avoid duplicate tunnel errors, and give staff a clean restart/stop/reuse path.
- [ ] **Launch QR print/share view** - Provide a staff-friendly full-screen or printable QR page for guests, with LAN and public options clearly labeled.
- [ ] **Public tunnel hardening** - Keep ngrok working now, then decide whether to stay on ngrok or move to Cloudflare Tunnel/Tailscale Funnel for regular operations.

## Layer 2 - Form Coverage and Polish

- [ ] **Extensible form catalog** - Replace hardcoded form keys/rules with a catalog that can represent scuba, XR, freediving, snorkeling, student, and fun-diver pathways.
- [ ] **PDF intake and mapping workflow** - Define where new source PDFs are stored, how they are named, how coordinate maps are created, and how a mapped PDF becomes selectable.
- [ ] **Pathway source PDF inventory** - Create a checklist of missing PDFs for XR, freediving, snorkeling, and any center-specific variants before mapping begins.
- [ ] **Promote pathway workspace to implementation queue** - Convert a ready planned pathway into code tasks for form catalog entries, PDF files, coordinate maps, output rules, and smoke tests.
- [ ] **Output rule matrix editor** - Move the diver/activity/form matrix toward data-driven admin configuration while preserving backend safety defaults.
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
| DB failure should not block PDFs | Layer 0 | Should failed DB writes be retried later, saved to a local queue, or only logged? What should staff see in the moment? |
| Operator-facing failure recovery | Layer 0 | What counts as good enough recovery during a busy day: local PDF save, resend queue, visible incident log, or all three? |
| Launcher process management | Layer 1 | If Node or ngrok is already running, should the launcher reuse, restart, or ask staff what to do? |
| Launch QR print/share view | Layer 1 | Should guests scan one QR that prefers internet, or should staff display separate "WiFi/LAN" and "internet" QR codes? |
| Public tunnel hardening | Layer 1 | Should the public URL stay on ngrok, move to Cloudflare Tunnel/domain, or use Tailscale Funnel, and who owns the account/domain? |
| Extensible form catalog | Layer 2 | What is the stable vocabulary for diver type, activity type, certification/student status, center specificity, age gates, and form families? |
| PDF intake and mapping workflow | Layer 2 | Where should unmapped source PDFs live, and what checklist promotes them into active selectable outputs? |
| Pathway source PDF inventory | Layer 2 | Which exact source documents are required for XR, freediving, snorkeling, and each center-specific variant? |
| Promote pathway workspace to implementation queue | Layer 2 | Should readiness notes become a generated checklist, GitHub issue, or just roadmap updates? |
| Output rule matrix editor | Layer 2 | Which rules should admin be able to change safely, and which must remain fixed backend policy? |
| Snorkeling fun/student pathways | Layer 2 | What health declaration is sufficient, and does snorkeling use the current liability waiver or separate documents? |
| Freediving fun/student pathways | Layer 2 | Which SSI freediving forms are required, and are they center-specific or student-specific? |
| XR pathway | Layer 2 | Are XR waiver and XR RDC enough, or are there extra risk/equipment/instructor forms? |

## Deferred - not building for now

| Item | Why deferred |
| --- | --- |
| Automatic PDF coordinate detection | Manual coordinate maps are more predictable for these source PDFs, and previous auto-detection attempts were rolled back. |
| Full authentication system | Current operational need is a LAN backup tool; simple admin password protection is enough for now. |
| Replacing the local-first model with a hosted app | The whole motivation is resilience when internet is slow or unavailable; public access should be additive, with LAN remaining the fallback. |
