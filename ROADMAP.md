# DIVEIndia Backup Forms Roadmap

This roadmap tracks the local-network backup form utility. The product goal is a staff-operated fallback for slow or unavailable internet registration: collect only essential guest details, fill the correct signed PDFs, store submissions when possible, and email the generated paperwork.

## Completed session 2026-04-27

- The guest workflow now generates separate component PDF attachments and sends all selected forms on one email.
- Admin can choose diver/activity type, review the output matrix, browse stored submissions, regenerate PDFs, download regenerated files, and resend them to a specified email address.
- The admin surface now includes a roadmap kanban, pathway planning workspace, PDF coordinate mapper link, and launch dashboard with local/LAN/public QR cards.
- The Windows launcher can start the backend and, when configured, start an ngrok tunnel while preserving LAN as the offline fallback.
- The guest form was cleaned up for real use: no visible admin setup link, no preview JSON, mobile signature pads track touch input correctly, and submit now shows an in-page spinner/success/error state instead of a browser alert.

## Completed session 2026-04-29

- **Railway backend deployed** — live at `https://dive-form-app-production.up.railway.app/`. Root `package.json` added for Nixpacks detection; `postinstall` installs backend deps; `railway.json` sets healthcheck. Form template PDFs committed to git via `.gitignore` negation so Railway can serve them.
- **Railway Postgres connected** — DB pool auto-detects cloud vs local via URL regex and enables SSL (`rejectUnauthorized: false`) for Railway while keeping no-SSL for localhost.
- **Admin PDF modal viewer** — Two new in-memory streaming endpoints (`/admin/api/submissions/:id/pdfs` and `/admin/api/submissions/:id/pdf/:index`) regenerate filled PDFs on demand without any disk write. Admin panel has a tabbed modal with iframe preview, individual download, and bulk download all.
- **Ngrok authtoken self-healing** — Token stored in `backend/.env`. `Start Dive Forms.bat` silently reinstalls it via `ngrok config add-authtoken` on every launch, so MSIX updates that wipe `ngrok.yml` no longer break the tunnel.
- **SMTP blocked on Railway** — Gmail port 587 is ETIMEDOUT from Railway IPs. Added nodemailer timeouts to fail fast (10s/30s). Email bypassed for now via the PDF viewer. Fix (Resend API) is next.

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
- [x] **Admin PDF modal viewer** - In-memory PDF streaming endpoints + tabbed modal with iframe preview and individual/bulk download. No disk writes, works on Railway ephemeral FS. (done session 2026-04-29)
- [x] **Ngrok authtoken self-healing** - Store token in `backend/.env`. Launcher reinstalls it silently on every start so MSIX/system updates can't break the tunnel. (done session 2026-04-29)
- [ ] **Transactional email provider** - Switch from Gmail SMTP to Resend (HTTP API). Gmail port 587 is ETIMEDOUT from Railway IPs. Resend free tier: 3,000 emails/month. Node SDK replaces nodemailer.
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

## Layer 3 - Cloud Infrastructure and Sync

Decided session 2026-04-29: Railway (Postgres + backend hosting) + Cloudflare R2 (template storage). No new paid accounts. Railway $5/month hobby plan covers DB + hosting. R2 free tier (10GB, zero egress) covers templates.

Architecture: phone is a thin local gateway. Cloud is source of truth. Offline = graceful degradation via local cache and submission queue, not a separate mode.

```
Guest phone (browser)
       │ scan QR, fill form on LAN
       ▼
Operator phone (Node.js, LAN server)
       │ online: POST to Railway  │ offline: local JSON queue → flush when online
       ▼
Railway Express backend  ──►  Railway Postgres (submissions)
                         ──►  Cloudflare R2 (template PDFs, coordMap JSON)
                         ──►  Admin panel (any browser, anywhere)
```

### Phase A - Cloud foundation

- [x] **Railway Postgres provisioning** - Railway Postgres live. DB pool auto-detects SSL via URL regex. Migration run via remote psql. Submissions saving correctly. (done session 2026-04-29)
- [x] **Railway backend deploy** - Live at `https://dive-form-app-production.up.railway.app/`. Nixpacks build via root `package.json`. All routes verified. (done session 2026-04-29)
- [ ] **Cloudflare R2 bucket setup** - Create R2 bucket for templates. Generate R2 API key pair. Configure CORS so the admin panel can upload directly. Store credentials in Railway env vars.
- [ ] **Upload existing templates to R2** - Upload current PDF source files and a JSON export of `coordMap.js` entries to R2 as the initial baseline.

### Phase B - Template management

- [ ] **Template version manifest** - Store a `manifest.json` in R2 listing each template file with a content hash and updated timestamp. Backend serves this at `/admin/api/templates/manifest`.
- [ ] **Admin template upload UI** - Staff can upload a new PDF or updated coordMap JSON via the admin panel. Files go to R2. Manifest updates automatically. Old version is kept with a timestamp suffix as backup.
- [ ] **Phone template sync** - On startup, phone fetches manifest from Railway, compares hashes against local cache, downloads only changed files from R2. Uses cached versions if Railway is unreachable.

### Phase C - Offline submission queue

- [ ] **Local submission queue** - When Railway is unreachable, phone saves the full submission payload to a local JSON queue file with a UUID. PDF generation and local save still happen immediately so staff have artifacts.
- [ ] **Background queue flush** - Phone runs a background interval that checks connectivity and posts queued submissions to Railway. Each item is removed from the queue only after a confirmed 2xx response.
- [ ] **Queue status in admin** - Launch tab shows number of pending unsynced submissions and a manual "sync now" button.

## Layer 4 - Android Staff Launcher

Goal: any staff member runs the server from their own Android phone. Guests stay on LAN, scan QR, fill the form in their browser. Templates come from R2 cache. Submissions go to Railway with offline queue fallback.

Approach: validate the concept with Termux (no code changes needed), then build a polished APK once the concept is proven.

### Why Termux first

Termux runs a real Linux environment inside an Android app — no root, no custom Android code. You install Node.js, clone the repo, and run `node server.js` exactly as on the laptop. If LAN peer-to-peer works and the server stays alive through a screen lock, the APK work is worthwhile. If either fails, you learn that cheaply before investing in native Android development.

### Phase A - Termux proof of concept (no code changes, no new packages)

- [ ] **Termux install and Node.js setup** — Install Termux from F-Droid (not Play Store — Play Store version is outdated). Inside Termux: `pkg update && pkg install nodejs git`. Verify `node --version` shows 20+.
- [ ] **Clone repo and configure** — `git clone <repo> dive-form-app`. Copy `backend/.env` to the phone (via WhatsApp/shared drive or type it). Run `npm install` inside `backend/`.
- [ ] **First server start** — `node backend/server.js` from the repo root. Confirm the server log shows the phone's LAN IP and port 3000.
- [ ] **Guest phone connectivity test** — On a second phone (guest's), open a browser and hit `http://<operator-ip>:3000`. Confirm the form loads and a test submission goes through.
- [ ] **Screen lock survival test** — Lock the operator phone. On the guest phone, reload the form and submit again. Document whether the server stays alive or dies. If it dies, test `termux-wake-lock` (a Termux utility that requests a CPU wakelock).
- [ ] **Hotspot fallback test** — Turn on the operator phone's WiFi hotspot. Connect the guest phone to that hotspot. Repeat the form load and submission test. This is the fully air-gapped fallback when venue WiFi blocks phone-to-phone traffic.
- [ ] **Termux startup script** — Write `start.sh` in repo root: `cd backend && git pull && npm install --omit=dev && node server.js`. Staff run one command. Update this to print the LAN QR URL clearly so staff can show it to guests without opening the admin panel first.

### What to test and document during Termux POC

| Question | Pass criterion | Fallback if fail |
| --- | --- | --- |
| Does venue WiFi allow phone-to-phone traffic? | Guest phone loads form at operator LAN IP | Operator phone creates hotspot |
| Does server survive screen lock? | Submission works 5 min after screen locks | `termux-wake-lock` + partial-wakelock setting |
| Does `git pull` work inside Termux? | Latest code fetched with no git errors | Manual `.env` copy + skip pull step |
| Can non-technical staff follow the setup? | Staff member sets up phone without help | Simplify or scripted setup further |

### Phase B - Proper Android APK (after Termux proves concept viable)

The APK embeds a real Node.js runtime using `nodejs-mobile-react-native` — no Termux, no terminal visible to staff. The operator taps Start and gets a QR code. Everything else is background.

- [ ] **nodejs-mobile-react-native scaffold** — React Native project with embedded Node.js engine. Copy `backend/` into the assets bundle. Confirm `server.js` starts inside the app sandbox.
- [ ] **Android foreground service** — Wrap the Node.js thread in a foreground service with a persistent notification ("DIVEIndia Forms is running"). This tells Android not to kill it when the screen locks or memory is pressured.
- [ ] **Native operator UI (minimal)** — Single screen: app name + status, Start/Stop button, LAN IP + QR code (generated natively via a React Native QR library), submission count from Railway, queue pending count. No admin panel — admin stays in the browser.
- [ ] **Hotspot mode toggle** — Button to create a WiFi hotspot programmatically (requires `CHANGE_NETWORK_STATE` permission). When enabled, show "Hotspot mode: guests connect to DIVEIndia-Forms network."
- [ ] **APK build and sideload** — Build a release APK with `./gradlew assembleRelease`. Distribute via WhatsApp or Google Drive as a shared file. Staff enable "install from unknown sources" once and sideload. No Play Store needed initially.
- [ ] **OTA update check** — On startup, app hits Railway `/api/version` endpoint. If a newer version is available, shows "Update available — download now" linking to the latest APK on Drive. Staff tap once to download and reinstall.
- [ ] **iOS staff path (decision point)** — nodejs-mobile supports iOS too. After Android APK is stable, assess whether any staff use iPhones as the operator device. If yes, the same codebase builds an IPA. Deferred until Android is working.

## Design conversations needed (Layers 3 and 4)

| Item | Status | Key questions |
| --- | --- | --- |
| Cloud provider | **Resolved 2026-04-29** | Railway (Postgres + hosting) + Cloudflare R2 (storage). No new paid accounts. |
| Template updates | **Resolved 2026-04-29** | Admin UI uploads to R2. Phone syncs on startup via manifest hash check. |
| LAN client isolation | **Open — test in Termux POC** | Does dive center WiFi block phone-to-phone traffic? If yes, hotspot mode becomes the default, not the fallback. |
| APK distribution | **Open** | Sideload via WhatsApp/shared drive is the path of least resistance. Assess Play Store internal track if staff churn is high. |
| iOS staff devices | **Deferred** | Android-only for operator role until Android APK is proven. Same codebase can build iOS later. |
| Termux vs APK for ops | **Open — answer after Termux POC** | If Termux is stable enough and staff can manage it, APK may not be needed. APK adds polish but also maintenance burden. |

## Deferred - not building for now

| Item | Why deferred |
| --- | --- |
| Automatic PDF coordinate detection | Manual coordinate maps are more predictable for these source PDFs, and previous auto-detection attempts were rolled back. |
| Full authentication system | Current operational need is a LAN backup tool; simple admin password protection is enough for now. |
| Replacing the local-first model with a hosted app | The whole motivation is resilience when internet is slow or unavailable; public access should be additive, with LAN remaining the fallback. |
