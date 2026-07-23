# CLAUDE.md — Half Marathon Tracker

Primer for continuing this project in Claude Code. Keep this file updated as the
app evolves.

## What this is
A personal, installable (PWA) half-marathon training tracker for a **sub-10:00/mi**
goal, race **Sat Sep 26, 2026** (Carrollton Half). The user taps runs done, logs
per-mile splits, and adds notes by hand. Strength sessions and fueling guidance
are built in.

## Training premise (drives all plan content)
This is a **late-race (miles 11–13) durability problem, not a top-end speed
problem.** Four years of Carrollton data (13:08 → 11:57 → 11:02 → 10:24, PR
2:16:39): the first 10 miles already average under goal (9:53/mi in 2025), then
miles 11–13 fall apart (12:25 / 11:37 / 12:32). The course also climbs late
(669 ft; gains on 11/12/13 and a wall near mile 8). So weeks 5–13 are built
around **late-race durability**: goal-pace closing miles on every long run
(1→2→3), hill repeats (wks 6, 9), a wk-11 race simulation, peak 28 mi/week, and
conservative early race pacing (10:00–10:10 miles 1–3). **Judge any future plan
change against: does it help miles 11–13?**

## Stack
- **Frontend:** single static `public/index.html` (vanilla JS, no build step).
  Firebase Web SDK (v10.12, via gstatic CDN) for Firestore + Auth.
- **Backend:** Netlify Functions (Node, CommonJS) in `netlify/functions/`.
- **Data:** Firebase Firestore, offline persistence enabled (IndexedDB local
  cache) so check-offs made offline queue and replay on reconnect.
- **Auth:** **Google sign-in**, locked to a single owner. The app is gated behind
  a "Sign in with Google" screen; `firestore.rules` restricts `log/*` to one
  verified owner email (`ownerEmail()` — currently `kevinwilkie92@gmail.com`).
  Sign-in uses `signInWithPopup` with a `signInWithRedirect` fallback (popup
  avoids the cross-site auth-storage partitioning that broke redirect).
- **Integration:** Strava API code exists but is **currently disabled** (the
  Connect button is commented out; app runs manual-only). The functions/webhook
  still work if re-enabled with env vars.
- **PWA:** `manifest.webmanifest` + `sw.js` (network-first app-shell cache; bump
  `CACHE` on shell changes; never caches Firebase/Strava/cross-origin).
- **Also shipped:** dark mode (`prefers-color-scheme`), per-week summary line
  (done/total · miles vs plan · avg pace), collapsible week cards, JSON/CSV
  export, and a safer reset with an Undo toast.

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

## Critical invariant: run ids (protects logged data)
Both the frontend and `_plan.js` compute run ids as `w{week}r{index}` where
`index` is the position of that day within the week's run list. Firestore stores
each check-off/split/note under `log/{runId}`, so **changing the number or order
of runs in a week silently orphans that week's logged data.** If you change the
**plan start date**, the **run days**, or the **order of runs in a week**, update
BOTH:
- `public/index.html` → `weeks[].runs` (and `dateFor`, START = Jun 29 2026)
- `netlify/functions/_plan.js` → `START` and `RUN_DAYS`

**Run-days table (60 runs total):**
- weeks 1–4: `MON, TUE, WED, FRI` (4 runs)
- weeks 5–12: `MON, TUE, WED, FRI, SAT` (5 runs — Saturday joins at week 5)
- week 13: `MON, TUE, FRI, SAT` (Sat = race)

**⚠️ Weeks 1–4 are FROZEN.** The user has completed runs logged against
`w1r0…w4r3`. Do not renumber or reorder weeks 1–4 — keep those runs and their
MON/TUE/WED/FRI order byte-identical. `START`/`MON0` must stay Jun 29 2026.
The strength auto-add (TUE→A, SAT→B for weeks <13) uses the disjoint `s`
namespace (`w{n}sA/sB`), so it never collides with run ids — note weeks 5–12 now
show both a Saturday run and a Saturday strength session.

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
- Store `weeks` in Firestore so the plan is editable without a redeploy (then
  generate `_plan.js` matching from the same source to preserve the invariant).
- If re-enabling Strava: pull HR / cadence into the run detail; backfill the last
  N days of runs on connect (not just future ones).
- Push notification on race-week milestones.

Done already: Google sign-in (owner-locked), offline persistence, per-week
summary, dark mode, JSON/CSV export, safer reset with undo, collapsible weeks.

## Conventions
- Keep the frontend dependency-free (no bundler); it's intentionally one file.
- Functions are CommonJS; Node 18+ (global `fetch` is available — don't add
  node-fetch).
- Test any plan/matching change against both `index.html` and `_plan.js`.
