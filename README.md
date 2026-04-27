# Dive Form App

1. Run `npm install` in backend
2. Configure `.env` with `DATABASE_URL` and SMTP settings
3. Run `node server.js`
4. Open `http://localhost:3000/admin` or the LAN admin URL printed by the server. Use password `password123`.

The admin page chooses the diver/activity type and PDF outputs, then opens the guest form. Submissions create separate PDF attachments for each selected component form instead of one combined bundle.
