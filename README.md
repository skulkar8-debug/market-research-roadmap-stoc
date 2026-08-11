# Market Research Roadmap (STOC)

Internal sector roadmap, calendar, reminders, and Data + TIP tracker.
Extracted from the BD-dashboard-STOC app (`src/app/roadmap`) as a standalone
Next.js app. The root URL redirects to `/roadmap`.

## Routes

- `/roadmap` — dashboard
- `/roadmap/sectors` (+ `/roadmap/sectors/[id]`) — sector list and detail
- `/roadmap/calendar` — workflow calendar / Gantt / resource views
- `/roadmap/reminders` — reminders
- `/roadmap/data-tip` — Data + TIP sync tracker
- `/roadmap/people` — people admin
- `/roadmap/settings` — settings, Google Sheets connection

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 (redirects to `/roadmap`).

## Deploying on Vercel

1. Import this repo in Vercel — it is auto-detected as Next.js; no extra
   configuration is needed to get a working deploy.
2. (Optional, for Google Sheets sync) Add the environment variables listed in
   [`.env.example`](.env.example) under Project → Settings → Environment
   Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, and
   `NEXT_PUBLIC_APP_URL` (set to your production domain). Also add your
   production callback URL
   (`https://<your-project>.vercel.app/api/auth/google/callback`) to the OAuth
   client's authorized redirect URIs in Google Cloud Console.

Without the Google variables the app still deploys and runs using built-in
seed data; only the Sheets sync features are disabled.
