# Family Chores — Implementation Spec

A spec for Claude Code. Static React app on GitHub Pages, Firestore for all data, Google sign-in gated by an email allowlist. No custom backend.

---

## First: "public" means the repo, not the data

Worth being precise, because it determines how much you need to hide.

- **The GitHub repo is public.** Fine. It contains no secrets.
- **The Firebase config object is public.** By design — it's an API endpoint identifier, not a credential. Commit it. Hiding it in CI secrets buys nothing and costs you a fiddly build.
- **The app is not public.** Anyone can load the page. Only allowlisted Google accounts see any data, because Firestore rules check the caller's verified email on every read.
- **The one real secret is the service account key** used by the local seed script. `.gitignore` it, never commit it, never ship it to the browser.

So: security lives entirely in `firestore.rules`. If those are wrong, everything is exposed. Write them first, test them in the emulator, and don't treat them as an afterthought.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite + React 18 | Fast, trivial static output for Pages |
| Styling | Plain CSS + custom properties | Design tokens already exist; no config overhead |
| Routing | Hash-based, hand-rolled | Pages 404s on client routing; hash sidesteps it entirely |
| Data | Firestore (web SDK v10, modular) | Realtime, offline, no server |
| Auth | Firebase Auth, Google provider | One provider, one button |
| Dates | `date-fns` | Don't hand-roll week math |
| Seeding | `firebase-admin` in a Node script | Bypasses rules, runs locally |

**One change from the earlier plan:** key weeks by the **Monday date string** (`2026-08-03`), not ISO week number. ISO weeks do awkward things at year boundaries (Dec 28 2026 is `2026-W53`, Jan 4 2027 is `2027-W01`), and date strings sort lexicographically for free. Simpler and less to get wrong.

---

## Repo layout

```
family-chores/
├── .github/workflows/deploy.yml
├── .gitignore                      # includes serviceAccount.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── index.html
├── package.json
├── vite.config.js
├── docs/
│   └── family-weekly-chore-chart.md    # human source of truth
├── seed/
│   ├── config.json                     # provided — the seed payload
│   └── seed.mjs                        # idempotent seeding script
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── firebase.js                     # init + exported db/auth (config committed)
    ├── lib/
    │   ├── weeks.js                    # mondayOf, weekId, dayDates, formatting
    │   ├── rotation.js                 # which anchor each adult holds in a week
    │   ├── cleaner.js                  # is this a cleaner week, which day
    │   └── ticks.js                    # tick id encode/decode
    ├── data/
    │   ├── useAuth.js
    │   ├── useConfig.js                # subscribes to config/current
    │   ├── useWeek.js                  # subscribes to weeks/{id}, lazy-creates
    │   └── useProfile.js               # active kiosk profile (localStorage)
    ├── views/
    │   ├── WeekView.jsx                # adults
    │   ├── KidsView.jsx
    │   └── AdminView.jsx
    ├── components/
    │   ├── AuthGate.jsx
    │   ├── ProfilePicker.jsx
    │   ├── WeekNav.jsx
    │   ├── TaskGrid.jsx
    │   ├── CheckBox.jsx
    │   └── Banner.jsx
    └── styles/
        ├── tokens.css
        └── app.css
```

---

## Firestore data model

```
households/{hid}                       hid = "home"
│
├── (doc fields)  name, timezone, weekStartsOn, createdAt
│
├── allowlist/{emailLowercased}
│     { role: "admin" | "adult", personId: "p1" }
│     ── seeded only; the client can never write here
│
├── members/{uid}
│     { email, displayName, photoURL, personId, lastSeen }
│     ── written by the client on first sign-in
│
├── config/current
│     { version, people[], rotation, anchors{}, childTasks{}, cleaner{} }
│
├── configVersions/{version}
│     ── immutable snapshot, written on every admin save
│
└── weeks/{YYYY-MM-DD}                 the Monday of that week
      {
        configVersion: 1,
        roles: { p1: "evening", p2: "morning" },   ← frozen at creation
        cleanerVisit: "2026-08-05" | null,
        ticks: {
          "p1__eve-reset__0": { done: true, by: "p1", at: <ts> },
          "p3__p3-bed__2":    { done: true, by: "p3", at: <ts> }
        },
        overrides: [ { day: 2, type: "swap", note: "…" } ],
        createdAt, updatedAt
      }
```

### Why roles are frozen per week
Compute rotation live and any future change to the rotation rule silently rewrites who did what in September. Freeze `roles` when the week doc is first created, then read it back. History stays true.

### Tick key format
`{personId}__{taskId}__{dayIndex}` — double underscore, day index 0–6 with Monday as 0.

**Do not use dots in tick keys.** Firestore field paths treat dots as nesting, and `updateDoc` with a dotted key will silently create nested objects instead of one flat field. This is the single easiest bug to introduce here.

### Why ticks are a map on the week doc
One read loads a whole week. One `updateDoc` with a dot-path (`ticks.p1__eve-reset__0`) writes a single field, so two people ticking different boxes at the same time merge cleanly without a transaction. A subcollection would mean 100+ reads per week view for no benefit.

---

## Security rules

Write these before any UI. `firestore.rules`:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function email() {
      return request.auth.token.email.lower();
    }

    function allowed(hid) {
      return request.auth != null
        && request.auth.token.email_verified == true
        && exists(/databases/$(database)/documents/households/$(hid)/allowlist/$(email()));
    }

    function role(hid) {
      return get(/databases/$(database)/documents/households/$(hid)/allowlist/$(email())).data.role;
    }

    match /households/{hid} {
      allow read: if allowed(hid);
      allow write: if false;

      match /allowlist/{e} {
        allow read:  if allowed(hid);
        allow write: if false;                       // seed script only
      }

      match /members/{uid} {
        allow read:   if allowed(hid);
        allow write:  if allowed(hid) && request.auth.uid == uid;
      }

      match /config/{doc} {
        allow read:  if allowed(hid);
        allow write: if allowed(hid) && role(hid) == 'admin';
      }

      match /configVersions/{v} {
        allow read:   if allowed(hid);
        allow create: if allowed(hid) && role(hid) == 'admin';
        allow update, delete: if false;              // snapshots are immutable
      }

      match /weeks/{weekId} {
        allow read:           if allowed(hid);
        allow create, update: if allowed(hid);
        allow delete:         if false;
      }
    }
  }
}
```

Allowlist doc IDs **must be lowercase** — the rule lowercases the incoming token email to match.

Add emulator-based rules tests covering: signed-out read denied, non-allowlisted signed-in read denied, allowlisted read allowed, non-admin config write denied, any client allowlist write denied.

---

## Build order

Each milestone should end green and deployable. Don't start the next until the acceptance criterion passes.

### M0 — Skeleton live on Pages
Vite + React scaffold, `base: '/family-chores/'` in `vite.config.js`, Actions workflow deploying `dist/` to Pages.
**Done when:** the GitHub Pages URL renders a placeholder page.

### M1 — Rules and auth
Create the Firebase project. Enable Google auth. Add the Pages origin and `http://localhost:5173` to authorized JavaScript origins. Write `firestore.rules` + emulator tests. Build `AuthGate`: signed out → one Google button; signed in but not allowlisted → a plain "ask to be added" message; allowlisted → children render. Write `members/{uid}` on first sign-in.
**Done when:** rules tests pass, an allowlisted account gets in, a random Google account does not.

### M2 — Seed
`seed/seed.mjs` reads `seed/config.json`, writes `households/home`, `config/current`, `configVersions/1`, and one `allowlist/{email}` doc per entry. Idempotent — re-running overwrites cleanly and never duplicates. Add `npm run seed`.
**Done when:** the console shows the config document and both allowlist docs, and running it twice changes nothing.

### M3 — Week view (the core)
`useConfig` subscribes to `config/current`. `useWeek(weekId)` subscribes to the week doc and lazy-creates it on first access with frozen `roles` and current `configVersion`. `TaskGrid` renders days across, tasks down, driven entirely by config — no hardcoded task text anywhere in `src/`. Toggling a box does a dot-path `updateDoc`. `WeekNav` moves between weeks and deep-links via `#/week/2026-08-03`.
**Done when:** two browsers signed in as different adults see each other's ticks appear live, and the anchor roles alternate correctly week to week.

### M4 — Kids view and kiosk mode
`ProfilePicker` shows the four people as tappable avatars; the choice persists in `localStorage` so the fridge tablet reopens where it was. Kids' view is one person at a time, large touch targets, the day's tasks only — not the full week grid. Ticks record `by: "p3"` while authenticated as the parent who owns the device.
**Done when:** an 8-year-old can go from cold app open to ticking a box in one tap.

### M5 — Admin editor
Form-driven editing of people, anchor steps, daily tasks, weekly tasks, child tasks, rotation, cleaner schedule. On save: bump `version`, write `config/current`, write the snapshot to `configVersions/{version}`. Retire tasks with a `retired: true` flag — **never delete**, or historical weeks lose their labels.
**Done when:** a task can be renamed on a phone and the change appears in the week view without a deploy.

### M6 — Overrides
"Swap anchors tonight", "skip today", "reassign this task" — each appends to the week's `overrides` array and the view honours it. This is what absorbs travel, illness and sleepovers without touching the schedule underneath.
**Done when:** a one-night swap is visible to both adults and doesn't affect the following week.

### M7 — Home screen install
`manifest.webmanifest`, icons, `theme-color`. Firestore offline persistence via `persistentLocalCache`.
**Done when:** it installs to an iPhone home screen and still renders the current week in airplane mode.

---

## Deploy workflow

`.github/workflows/deploy.yml` — build on push to `main`, publish `dist/` with `actions/deploy-pages`. Enable Pages → Source → GitHub Actions in repo settings. No secrets needed.

Set `base` in `vite.config.js` to `/<repo-name>/` for a project site. If you'd rather avoid the subpath entirely, name the repo `<username>.github.io` and set `base: '/'`.

---

## Things to get right

- **Timezone.** Store and compare `YYYY-MM-DD` strings in the household timezone. Never put a JS `Date` in Firestore for a calendar day — UTC drift will slide Sunday's task onto Monday for anyone west of Greenwich.
- **Lazy week creation races.** Two devices opening a new week simultaneously both try to create it. Use `setDoc(ref, {...}, { merge: true })` with a create-only guard, or accept the merge — but don't use a plain `setDoc`, which will clobber ticks.
- **`onSnapshot` cleanup.** Return the unsubscribe from every `useEffect`, or week navigation leaks listeners and the read count climbs.
- **Email case.** Lowercase on write in the seed script and lowercase in rules. A capitalised allowlist entry locks someone out with no error message.
- **`email_verified`.** Kept in the rule deliberately. Without it, a hostile custom token with a spoofed email claim would pass the allowlist check.
- **Don't ship an admin UI that writes `allowlist`.** Adding a member should stay a deliberate act via the seed script. It's the only thing standing between the app and the internet.

---

## Later, if you want it

Calendar integration slots in cleanly once M3–M6 are done: add the `calendar.readonly` scope to the sign-in flow, read the family calendar for the displayed week, and flip `cleaner.source` from `"schedule"` to `"calendar"` so a recurring "Cleaner" event becomes the source of truth. The config already carries both fields, so it's a switch rather than a migration.
