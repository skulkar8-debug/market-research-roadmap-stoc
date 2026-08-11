# Market Research Roadmap (STOC)

One clear view of STOC Advisory's market research publishing pipeline across
sectors: when research is being completed, when reports are being released,
what supporting content is going out, and direct links to every underlying
asset. The root URL redirects to `/roadmap`.

## Routes

- `/roadmap` — dashboard: pipeline stats, upcoming releases, released reports + assets
- `/roadmap/sectors` (+ `/roadmap/sectors/[id]`) — sector list and detail with asset links (Report, Data, TIP, LinkedIn, Website)
- `/roadmap/calendar` — publishing timeline: Gantt by sector, month, and list views
- `/roadmap/settings` — Google Sheets connection, local data export/reset

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
