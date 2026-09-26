# MU Anant 1.0 — Hackathon Registration + Referral System

Why not Google Forms: Forms can't generate unique codes, validate a code against
past entries, increment a counter, or show a live leaderboard — none of that logic
runs on Forms. This is a small full app instead: a Node.js + MongoDB backend, and
a static HTML frontend styled like Claude's own interface.

## What's included
- `backend/` — Express API + MongoDB models (Referral, Team)
- `frontend/index.html` — single-page UI: Register Team / Get Referral Code / Leaderboard
- `frontend/admin.html` — password-gated dashboard listing every registered team, with CSV export

## Payment screenshot (required)
Registration requires uploading a screenshot of the entry-fee payment. The image
is uploaded client-side to imgbb (API key is already set in `index.html`), and
the returned image URL is what gets stored on the team's record in MongoDB
(`Team.screenshotUrl`) — no raw image ever touches your own server.

**Add your QR code**: drop a file named `qr.png` next to `index.html` (same folder).
The registration page references it directly as `<img src="qr.png">`, so any team
scanning it sees your real payment QR.

## Admin dashboard
Open `frontend/admin.html`, enter the `ADMIN_KEY` you set in the backend's `.env`,
and you'll see every registered team — members, contact info, payment proof link,
and who referred them — plus a "Export CSV" button. The key is sent as a header
(`x-admin-key`) on each request and kept only in the browser tab's session storage,
never in the URL or committed anywhere.

## 1. Set up MongoDB (free)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Add a database user and allow network access from anywhere (0.0.0.0/0) for simplicity, or your host's IPs
3. Copy the connection string (Connect → Drivers)

## 2. Run the backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env: paste your MONGODB_URI, set CORS_ORIGIN to wherever you host index.html
npm start
```
The API runs on `http://localhost:4000` by default with these routes:
- `POST /api/referral` — `{ studentName, department, year }` → `{ code }`
- `POST /api/register` — team registration, optional `referralCode`, required `screenshotUrl`
- `GET /api/leaderboard` — top referrers by teams referred
- `GET /api/teams` — all registered teams (requires `x-admin-key` header or `?key=` matching `ADMIN_KEY`)

## 3. Point the frontend at your backend
Open `frontend/index.html` **and** `frontend/admin.html` and edit the top of each
`<script>` block:
```js
const API_BASE = "http://localhost:4000"; // change to your deployed backend URL
```

## 4. Deploy
- **Backend**: Render, Railway, or Fly.io all have free/cheap tiers that run
  a Node server continuously (needed here, unlike a static site). Set the same
  environment variables from `.env` in their dashboard.
- **Frontend**: `index.html` is a single static file — host it anywhere
  (Netlify, Vercel, GitHub Pages, or even a shared campus link). Just make sure
  `API_BASE` points at your live backend URL, and that the backend's `CORS_ORIGIN`
  includes the frontend's URL.

## Team size rule
Registration enforces 3–4 members total, leader included (`Team.members` array,
validated both client-side and server-side).

## Notes
- Referral codes are 6 characters (e.g. `AR7X2K`), unique, no ambiguous characters.
- A team can register with at most one referral code; leave it blank if none applies.
- The leaderboard only lists students with at least one successful referral.
