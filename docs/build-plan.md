# Family Chore App — Architecture & Build Plan

Static frontend on GitHub Pages · Google Cloud backend · Google Sign-In · Google Calendar integration

---

## The one decision to make first

You asked for GitHub Pages + a Google Cloud backend. Before designing that, it's worth knowing you can probably skip the backend entirely.

**Firebase is Google Cloud.** Firestore is a database your browser can talk to directly, with access rules enforced server-side. For an app used by two adults and two kids, that means:

| | Custom backend (Cloud Run) | Direct-to-Firestore |
|---|---|---|
| Server code to write | REST API, auth middleware, CORS | none |
| Deploys | container build + push | frontend only |
| CORS debugging | yes | none |
| Realtime sync across devices | you build it | built in |
| Offline support | you build it | built in |
| Monthly cost | ~$0 (scale to zero) | $0 |
| Can run scheduled jobs | yes | no |

**Recommendation: start direct-to-Firestore. Add Cloud Run only when you need something to happen while nobody is looking** — a nightly calendar sync, a Sunday-evening summary email, a reminder push. That's a real line, and it's the only thing that justifies a server here.

Everything below is written so that adding Cloud Run later is a small addition, not a rewrite.

---

## Architecture

```
┌──────────────────────────────────────────┐
│  GitHub Pages  (static, free, HTTPS)     │
│  Vite + vanilla JS or React              │
│  ─ Google Identity Services (sign-in)    │
│  ─ Firebase SDK (Firestore, offline)     │
│  ─ Calendar API (read, browser token)    │
└───────────┬──────────────────────────────┘
            │  auth'd reads/writes
            ▼
┌──────────────────────────────────────────┐
│  Firestore  (rules enforce allowlist)    │
│  config · weeks · overrides              │
└───────────┬──────────────────────────────┘
            │  (phase 3 only)
            ▼
┌──────────────────────────────────────────┐
│  Cloud Run + Cloud Scheduler             │
│  nightly calendar sync, reminders        │
│  Secret Manager: refresh token           │
└──────────────────────────────────────────┘
```

---

## Making the format fluid

This is the requirement that shapes the whole design, so it's worth being explicit: **the chore definitions live in the database, not in the code.**

Right now the schedule is hardcoded in a JS array. If it stays there, every schedule change is an edit-commit-deploy cycle, and you will stop making changes by October. Move it to a Firestore config document with an admin screen, and changing the schedule becomes a thing you do on your phone in two minutes.

Config document shape:

```jsonc
{
  "people": [
    { "id": "p1", "name": "…", "type": "adult", "email": "…@gmail.com" },
    { "id": "p3", "name": "…", "type": "child", "age": 8 }
  ],
  "anchors": {
    "morning": { "label": "Morning launch", "steps": ["…"], "weekly": ["…"] },
    "evening": { "label": "Evening closedown", "steps": ["…"], "weekly": ["…"] }
  },
  "rotation": { "swapEveryNWeeks": 1, "startRole": { "p1": "evening" } },
  "cleaner": { "source": "calendar", "calendarQuery": "Cleaner" },
  "childTasks": {
    "p3": { "daily": ["…"], "byDay": { "mon": "Set the table" } }
  }
}
```

Two consequences worth designing for:

- **Version the config.** Keep `configVersion` on each week document. When you change the task list in November, October's completed weeks still render with the tasks that actually existed then.
- **Never delete a task, retire it.** Add `retiredOn` instead. Deleting breaks historical weeks.

---

## Data model

```
households/{householdId}
  config              ← the document above
  members/{uid}       ← email, displayName, role: admin | adult | kid
  weeks/{2026-W32}    ← ISO week key, sorts and computes cleanly
    ticks: { "p1:reset:mon": { done: true, at: <ts>, by: "p1" }, … }
    roles: { p1: "evening", p2: "morning" }   ← frozen at week start
    cleanerVisit: "2026-08-05"
    configVersion: 4
  overrides/{date}    ← one-off changes: "swap tonight", "skip", "reassign"
```

**Why freeze roles per week:** if rotation is computed live from week parity, changing the rotation rule in November silently rewrites who did what in September. Freezing on first access makes history stable.

**Why an overrides collection:** real life is exceptions. One parent travels Thursday, someone's sick, a kid has a sleepover. Overrides let you deviate for a night without touching the underlying schedule, which is what actually keeps a system like this alive.

---

## Auth

**Google Identity Services** for sign-in, **Firebase Auth** to exchange it for a Firestore session.

Setup:
1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).
2. Authorized JavaScript origins: `https://<username>.github.io` and `http://localhost:5173` for dev.
3. OAuth consent screen: **External**, publishing status **Testing**, add the two adult emails as test users. Testing mode caps you at 100 users and never needs Google verification — correct for a family app. (Test-mode refresh tokens expire after 7 days, which matters only in Phase 3.)
4. Firebase Console → Authentication → enable Google provider.

Access control lives in Firestore rules, not in the frontend:

```js
function isMember() {
  return exists(/databases/$(database)/documents/households/$(hh)/members/$(request.auth.uid));
}
match /households/{hh}/config {
  allow read:  if isMember();
  allow write: if isMember() && get(/…/members/$(request.auth.uid)).data.role == 'admin';
}
match /households/{hh}/weeks/{week} {
  allow read, write: if isMember();
}
```

**Kids and sign-in.** Under-13s can't have standalone Google accounts; Family Link accounts add friction you don't want at 7am. Use **kiosk mode**: the fridge tablet or a shared phone stays signed in as a parent, and the app shows a profile picker. Kids tap their face, tick boxes, tap done. `by: "p3"` records who did it without needing a second identity. This is both simpler and more likely to actually get used.

---

## Google Calendar integration

Three tiers, in increasing order of ambition. Tier 1 alone is worth the effort.

### Tier 1 — Read the family calendar into the week view *(do this)*

Scope: `https://www.googleapis.com/auth/calendar.readonly`

Pull events for the displayed week and render them above each day column. Now the chart shows that Thursday has soccer at 5:30 next to the Thursday task list, and you can see the collision before it happens rather than at 5:25.

**Also derive the cleaner schedule from the calendar.** Put a recurring "Cleaner" event on the family calendar and have the app query for it instead of computing week parity. When the cleaner reschedules, you move one calendar event and the clear-the-decks reminder follows automatically. This directly solves the "keep it fluid" goal and removes the parity coupling issue.

Browser-only. No server. Access tokens last an hour; refresh silently with `prompt: ''` on the token client.

### Tier 2 — Write a small number of events back

Scope: `https://www.googleapis.com/auth/calendar.events`

**Do not push every chore to the calendar.** Twenty-eight events a week will bury the events you actually need to see, and you'll mute the calendar within a fortnight.

Push only:
- The clear-the-decks reminder, the evening before the cleaner
- Grocery/meal-plan on Friday
- Anything with a hard external dependency

Write these to a **dedicated secondary calendar** ("Household") so it can be toggled off in one click. Store each created event's `id` in Firestore so updates modify rather than duplicate — the classic failure mode here is a sync loop that creates a fresh event every run.

### Tier 3 — Let the calendar reshape the plan *(the interesting one)*

Read busy-times for both adults and adjust automatically:

- Evening-anchor person has a 7pm commitment → auto-suggest swapping anchors for that night, written as an override
- A day is heavily booked → drop that day's weekly task to the next open day rather than letting it silently fail
- Cleaner event moved → clear-the-decks reminder moves with it

This needs read access to both adults' calendars via free/busy, and it's where a server starts earning its place — you want the swap suggested at 4pm, not when someone happens to open the app.

---

## Build phases

**Phase 1 — Port what exists (a weekend)**
Move the current HTML into a Vite project, replace in-memory ticks with Firestore, add Google sign-in, deploy to Pages via GitHub Actions. Task definitions still hardcoded. You now have a real, shared, persistent chart.

**Phase 2 — Fluid config (a weekend)**
Move definitions into the Firestore config doc. Build a simple admin screen. Add the overrides collection and a "swap tonight" button. Add the web manifest so it installs to a home screen. This is the phase that determines whether the app survives a schedule change.

**Phase 3 — Calendar read (an evening)**
Tier 1 above. Events in the week view, cleaner schedule from the calendar.

**Phase 4 — Server, only if you want unattended work**
Cloud Run service + Cloud Scheduler for nightly sync, a Sunday-evening "here's next week" email, or push reminders. Store the refresh token in Secret Manager. Move the OAuth app out of Testing mode if 7-day token expiry becomes annoying.

---

## Cost

| Item | Cost |
|---|---|
| GitHub Pages | $0 |
| Firestore | $0 — free tier is 50k reads/day; you'll use a few hundred |
| Firebase Auth | $0 |
| Calendar API | $0 |
| Cloud Run (phase 4) | ~$0 with scale-to-zero |
| Custom domain (optional) | ~$12/yr |

---

## Gotchas worth knowing before you start

- **GitHub Pages project sites serve from a subpath** (`/repo-name/`). Set Vite's `base` accordingly or use a user site (`<username>.github.io`) to avoid it entirely.
- **Client-side routing 404s on Pages.** Use hash routing, or copy `index.html` to `404.html` at build time.
- **The Firebase config object in your frontend is not a secret.** It's meant to be public; security comes from rules. Don't waste time hiding it — but do write real rules, because there's nothing behind them.
- **Test Firestore rules in the emulator.** Rules that are wrong in the permissive direction fail silently.
- **Timezone.** Store dates as `YYYY-MM-DD` strings in a fixed household timezone, not `Date` objects. Chore charts are local-calendar things and UTC drift will shift a Sunday task into Monday.
- **ISO week keys roll over oddly around New Year.** Week 1 of 2027 starts Jan 4; the Dec 28 week is `2026-W53`. Use a library rather than hand-rolling it.
- **Design for the 7am case.** The realistic usage is a phone held in one hand while pouring cereal. If ticking a box takes more than one tap from cold start, the paper version wins.
