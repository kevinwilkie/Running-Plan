# CLAUDE.md — Half Marathon Tracker

Primer for continuing this project in Claude Code. Keep this file updated as the
app evolves.

## What this is
A personal, installable (PWA) half-marathon training tracker for a **sub-10:00/mi**
goal, race **Sat Sep 26, 2026**. Runs auto-check themselves off from **Strava**;
the user can also tap, log per-mile splits, and add notes by hand. Strength
sessions and fueling guidance are built in.

## Stack
- **Frontend:** single static `public/index.html` (vanilla JS, no build step).
  Firebase Web SDK (v10, via gstatic CDN) for Firestore + anonymous Auth.
- **Backend:** Netlify Functions (Node, CommonJS) in `netlify/functions/`.
- **Data:** Firebase Firestore. **Auth:** Firebase Anonymous.
- **Integration:** Strava API (OAuth2 + activity webhooks).
- **PWA:** `manifest.webmanifest` + `sw.js` (app-shell cache; never caches
  Firebase/Strava/cross-origin requests).

## File map
- `public/index.html` — the whole UI + client logic. Plan data lives in the
  `weeks` array; rendering in `render()`; live sync via Firestore `onSnapshot`
  → `applyRemote()`. Writes are per-document via `saveItem(id)`.
- `netlify/functions/strava-auth.js` — OAuth: redirects to Strava, handles the
  callback, stores tokens in Firestore `strava/tokens`.
- `netlify/functions/strava-webhook.js` — GET validates the subscription
  (echoes `hub.challenge`); POST handles `activity/create`, matches the run,
  writes `done` + `splits` to `log/{runId}`.
- `netlify/functions/_strava.js` — token refresh + activity fetch.
- `netlify/functions/_firebase.js` — Admin SDK init from
  `FIREBASE_SERVICE_ACCOUNT_B64`.
- `netlify/functions/_plan.js` — **date → runId matching**. MUST stay in sync
  with the frontend's plan (see below).
- `scripts/` — one-time webhook subscribe / view / unsubscribe.
- `firestore.rules` — `log/*` requires auth; `strava/*` is server-only.

## Critical invariant: run ids
Both the frontend and `_plan.js` compute run ids as `w{week}r{index}` where
`index` is the position of that day within the week's run list. If you change
the **plan start date**, the **run days**, or the **order of runs in a week**,
update BOTH:
- `public/index.html` → `weeks[].runs` (and `dateFor`, START = Jun 29 2026)
- `netlify/functions/_plan.js` → `START` and `RUN_DAYS`
Matching is by calendar date (one run per day). Weeks 1–12 run days are
`MON,TUE,WED,FRI`; week 13 is `MON,TUE,FRI,SAT` (Sat = race).

## Firestore shape
- `strava/tokens` → `{ access_token, refresh_token, expires_at, athlete_id }`
  (server-only; blocked from clients by rules).
- `log/{runId}` → `{ done, note, splits:{0:"9:45",...}, strava:{...} }`.
  The webhook writes `done`/`splits`/`strava` and never overwrites the user's
  `note`.

## Env vars (Netlify)
`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_VERIFY_TOKEN`, `APP_URL`,
`FIREBASE_SERVICE_ACCOUNT_B64`. Frontend `firebaseConfig` is filled in directly
in `index.html` (public values, fine to commit — security is enforced by rules).

## Local / deploy
- No build step. `npm install` only pulls `firebase-admin` for the functions.
- Deploy by pushing to GitHub and importing in Netlify (publish dir `public`,
  functions dir `netlify/functions`).
- After first deploy + Strava connect, run `npm run subscribe` (with env vars set)
  to turn on the webhook. See `README.md` for the full walkthrough.

## Sensible next steps (ideas, not committed)
- Lock auth to a single uid (or add Google sign-in) instead of anonymous.
- Store `weeks` in Firestore so the plan is editable without a redeploy (then
  generate `_plan.js` matching from the same source to preserve the invariant).
- Pull HR / cadence from Strava into the run detail.
- A weekly summary view (planned vs actual mileage, average pace trend).
- Backfill: on connect, import the last N days of Strava runs, not just future ones.
- Push notification on race-week milestones.

## Conventions
- Keep the frontend dependency-free (no bundler); it's intentionally one file.
- Functions are CommonJS; Node 18+ (global `fetch` is available — don't add
  node-fetch).
- Test any plan/matching change against both `index.html` and `_plan.js`.
