# CASScan 🎓📷

**CAS Attendance Management System** — a React + Vite web app that automates, manages, and monitors event attendance for the College of Arts and Sciences.

Students download their personal **QR code** (generated from their auto-assigned Student ID) from the web app. At an event, CAS operators scan each QR at the station — CASScan instantly records who is present, tracks trends, and produces reports & CSV exports.

## Tech stack

- ⚛️ React 19 + Vite
- 🔥 Firebase Firestore (real-time data)
- 🧭 React Router
- 📊 Recharts (area / bar / line charts — no pies)
- 📷 html5-qrcode (camera scanning)
- 🧾 QR codes via qrcode.react · CSV via papaparse + file-saver

## Getting started

```bash
npm install
```

### 1. Configure Firebase

1. Create a project at https://console.firebase.google.com and add a **Web app**.
2. Enable **Cloud Firestore**, and under *Authentication → Sign-in method* enable the **Email/Password** provider.
3. *(Optional)* Copy `.env.example` to `.env` and paste your Firebase web config values — these override the defaults baked into `src/firebase.js`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### 2. Run

```bash
npm run dev      # http://localhost:5173  (camera requires localhost or HTTPS)
npm run build    # production build to /dist
```

### 3. First admin

Open the app — if no admin exists yet, the login page shows a **one-time setup form** that creates both the **Firebase Authentication account** and the matching admin profile document (choose CASSC or MAYOR). Afterwards you can add more admins from the *Admins* tab: new operators are registered through a secondary Firebase app instance so your own session stays signed in.

## How it works

| Concept | Format | Notes |
|---|---|---|
| Student ID | `CAS26-001` | auto-generated (`CAS` + 2-digit year + sequence) — this is what the QR encodes |
| Event ID | `CAS-2026-001` | auto-generated per attendance |
| Operator ID | `CASSC-BSMATH2A-001` | auto-generated from classification + program/year/section |

- **Start Attendance** opens a live session (event name, venue, start/end date-time).
- **Scan QR** marks students present in real time; the scanned student's panel shows a countdown — after 2 idle minutes it becomes *"Recently scanned"* until the next scan replaces it.
- **End Attendance** converts every unmarked student to *Absent*.
- Every table supports search, ascending/descending sort, kebab menus, and bulk selection with delete/cancel.
- CSV: students can be imported (`studentNumber, fullName, program, yearLevel, section`) and everything can be exported. Passwords are never exported.
- Dark/light mode, collapsible sidebar, mobile burger layout, toast notifications with sound effects, and confirmation prompts before destructive actions.

## Security notes

- **Authentication runs entirely on Firebase Authentication** (email/password). Passwords are never written to Firestore — each admin profile stores only an opaque `uid` link.
- Change **your own** password from *My Details* (`updatePassword` with double-entry confirmation); reset **another operator's** password via the password-reset email button in the *Admins* tab.
- Editing your email updates both the profile document and the Auth account (`updateEmail`). Sensitive changes require a recent sign-in — Firebase asks you to re-authenticate otherwise.
- Deleting an admin removes their profile document so the app refuses their session; permanently removing the underlying Auth user requires the Admin SDK / Cloud Functions.
- Suggested starter Firestore rules (tighten before going public):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;   // tighten before going public!
    }
  }
}
```

## Project structure

```
src/
├── components/     # DataTable, KebabMenu, Modal, StatCard, Layout…
├── context/        # Theme, Toast(+sounds), Auth, ActiveEvent
├── hooks/          # useFirestoreQuery (realtime subscriptions)
├── pages/          # Login, Overview, ScanAttendance, StartAttendance,
│                   # Attendances, EventAttendanceDetail, Students,
│                   # Admins, MyDetails
├── styles/         # design tokens + component/page styles
└── utils/          # ids, crypto, csv, qr, sounds, formatting, dbOps
```

## Devices & sessions

- **Same account on many devices** — sign in on your desktop and your phone at the same time (monitor Overview on desktop while scanning on the phone). Everything syncs live through Firestore.
- **Multiple operator accounts simultaneously** — every device keeps its own independent session, so several CASSC / MAYOR operators can run stations at once; each scan is attributed through their Operator ID.
- **One active account per browser** — a browser profile holds a single session (Firebase model). The login screen remembers recent accounts on that device as quick-pick chips for fast switching.
- Phone cameras require HTTPS in production (localhost works for development).

## Real quota sync (matches Firebase "Usage and billing")

The sidebar quota monitor can show the project's REAL billable counts - the same
numbers the Firebase Console renders - instead of a single-browser tally. It
reads them straight from Google Cloud Monitoring (the source behind the Usage
dashboard) with a read-only Google grant. No server, no Blaze plan; works on
Cloudflare Pages.

One-time setup:

1. Google Cloud Console (console.cloud.google.com) -> pick the **casssan**
   project -> **APIs & Services -> Library** -> enable **Cloud Monitoring API**.
2. **APIs & Services -> OAuth consent screen** -> External -> add your own
   Google account under **Test users**.
3. **APIs & Services -> Credentials -> Create credentials -> OAuth client ID ->
   Web application**, with **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - your Cloudflare Pages URL, e.g. `https://casscan.pages.dev`
4. Copy the client id (`...apps.googleusercontent.com`) into `.env` as
   `VITE_GOOGLE_OAUTH_CLIENT_ID=...` - and into Cloudflare Pages -> Settings ->
   Environment variables for the deployed build. Redeploy.
5. In the app, open the quota monitor and click **"Sync with Firebase (real
   usage)"**. Google asks once; the token lives ~1 h in the tab and is reused
   silently afterwards (the 5-minute auto-sync runs without popups).

Notes:

- Once synced, the bars snap to the REAL project-wide counts - other devices
  and the Firebase Console viewer included - and the 80%/92% failover
  thresholds act on those numbers too.
- Monitoring data lags the Console by a couple of minutes; that is normal.
- Without the client id the widget stays an honest per-browser estimate and
  says exactly that.

