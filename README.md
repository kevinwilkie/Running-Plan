# Half Marathon Tracker — automatic Strava sync

Your sub-10 training tracker, deployed as a real web app. Finished runs check
themselves off automatically (with your actual mile splits), and you can still
tap, note, and log by hand. Built on **Netlify Functions + Firebase (Firestore)**.

## Why Strava and not Garmin
Garmin's developer API is gated behind a business-approval program that isn't
open to individuals. Strava's API is open to any account — and your Garmin watch
already auto-syncs to Strava — so connecting Strava captures every Garmin run.
(If your Garmin → Strava sync isn't on yet: Strava → Settings → Connected Apps →
Garmin → Connect.)

## How it works
1. You tap **Connect Strava** once → OAuth, tokens stored server-side in Firestore.
2. A Strava **webhook** notifies your site whenever a new activity is created.
3. The webhook function matches the run to that day's planned workout, marks it
   done, and fills in your per-mile splits.
4. The tracker reads Firestore live, so the check appears on its own.

Matching is by date (one run per day in the plan), so a Friday run checks off
Friday's long run, etc.

---

## Setup (about 20–30 min, one time)

### 1. Get the code onto your machine
Unzip this project, then inside it:
```
npm install
```

### 2. Create a Strava API application
- Go to https://www.strava.com/settings/api and create an app.
- Set **Authorization Callback Domain** to your future Netlify domain
  (e.g. `your-site.netlify.app`) — domain only, no https, no path.
- Copy the **Client ID** and **Client Secret**.

### 3. Create a Firebase project
- https://console.firebase.google.com → add project.
- Build → **Firestore Database** → create (production mode).
- Build → **Authentication** → Sign-in method → enable **Anonymous**.
- Project settings → **Your apps** → add a **Web app** → copy the
  `firebaseConfig` values.
- Paste those values into `public/index.html` (the `firebaseConfig` block near
  the top, replacing every `REPLACE_ME`).
- Paste the contents of `firestore.rules` into Firestore → Rules → Publish.

### 4. Get a Firebase service account (for the server functions)
- Project settings → **Service accounts** → **Generate new private key**
  → downloads a JSON file.
- Base64-encode it into a single line:
  - macOS/Linux: `base64 -i service-account.json | tr -d '\n'`
- That string is your `FIREBASE_SERVICE_ACCOUNT_B64`.

### 5. Deploy to Netlify
- Push this folder to a GitHub repo and "Import" it in Netlify, **or** drag the
  folder into Netlify's deploy UI / use the Netlify CLI.
- In Netlify → Site configuration → **Environment variables**, add everything
  from `.env.example`:
  - `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`
  - `STRAVA_VERIFY_TOKEN` (invent any random string)
  - `APP_URL` (your live URL, e.g. `https://your-site.netlify.app`, no trailing slash)
  - `FIREBASE_SERVICE_ACCOUNT_B64`
- Redeploy so the variables take effect.
- Make sure the Strava app's **Authorization Callback Domain** matches your
  deployed domain.

### 6. Connect Strava
Open your site and tap **Connect Strava**. Authorize, and you'll land back on the
tracker with the button showing "Strava connected."

### 7. Turn on the live webhook (one time)
With the same values exported locally (or via a tool like `dotenv`):
```
STRAVA_CLIENT_ID=... STRAVA_CLIENT_SECRET=... STRAVA_VERIFY_TOKEN=... \
APP_URL=https://your-site.netlify.app  node scripts/subscribe.js
```
You should see a subscription `id` printed. Strava sync only starts with the
**next new activity** after this — so your next run is what proves it works.

Helpers: `node scripts/view-subscription.js` to inspect it,
`node scripts/unsubscribe.js <id>` to remove it.

---

## Notes & tweaks
- **Auth is anonymous** for simplicity. For a personal app behind an unguessable
  URL that's usually fine; to lock it to only you, tighten `firestore.rules` to a
  specific `request.auth.uid`, or switch Authentication to Google/email.
- **Token security:** Strava tokens live only in Firestore's `strava` collection,
  which the security rules block from all client access — only the server
  functions (Admin SDK) touch them.
- **Splits** are auto-filled from Strava's standard (per-mile) splits; your typed
  notes are never overwritten by the sync.
- **Matching** lives in `netlify/functions/_plan.js`. If you change the plan's
  start date or run days, update it there to keep ids in sync with the frontend.
- The original in-chat tracker still works on its own; this is the deployable
  upgrade.

---

## Install it as an app (PWA)
Once deployed, this works as an installable app — no App Store needed.
- **iPhone (Safari):** open your site → Share → **Add to Home Screen**.
- **Android (Chrome):** open your site → menu → **Install app** / **Add to Home Screen**.
It then launches full-screen from your home screen like a native app, with its
own icon, and loads instantly. (Live data still needs a connection; the app
shell is cached for fast start.)

## Keep building it in Claude Code
This repo is set up for Claude Code — `CLAUDE.md` is the primer it loads each
session.
1. Install Node.js 18+.
2. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
   (or the native installer: `curl -fsSL https://claude.ai/install.sh | bash`).
   Requires a paid Claude plan (Pro/Max) or a Console API key.
3. `cd` into this project and run `claude`.
4. It reads `CLAUDE.md` automatically. Try: "add a weekly summary view" or
   "switch anonymous auth to Google sign-in."
Docs: https://docs.claude.com/en/docs/claude-code/overview

You can also drive Claude Code from the Claude mobile app (remote sessions) once
the repo is on GitHub — handy for tweaking from your phone.
