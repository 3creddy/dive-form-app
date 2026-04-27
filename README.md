# Dive Form App

## Quick Start

On Windows, double-click `Start Dive Forms.bat` from the repo root. It starts the backend and opens the admin launch dashboard.

The Launch tab shows QR codes for:

- guest form on the local network
- admin page on the local network
- guest form on this computer
- public guest form when `PUBLIC_BASE_URL` is configured

Guests should scan the LAN or public guest QR, not `localhost`.

## Manual Start

1. Run `npm install` in backend
2. Configure `.env` with `DATABASE_URL` and SMTP settings
3. Run `node server.js`
4. Open `http://localhost:3000/admin` or the LAN admin URL printed by the server. Use password `password123`.

The admin page chooses the diver/activity type and PDF outputs, then opens the guest form. Submissions create separate PDF attachments for each selected component form instead of one combined bundle.
