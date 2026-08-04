# Family Chores

A static React app (Vite) hosted on GitHub Pages, backed by Firestore, with
Google sign-in gated by an email allowlist. No custom backend.

See [`docs/implementation-spec.md`](docs/implementation-spec.md) for the full
spec and [`docs/build-plan.md`](docs/build-plan.md) for the architecture
rationale.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/family-chores/
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Security model

- The **repo is public** — it contains no secrets.
- The **Firebase config object is public by design** (it's an endpoint
  identifier, not a credential) and is committed in `src/firebase.js`.
- The **app is gated**: anyone can load the page, but only allowlisted Google
  accounts can read any data. All access control lives in `firestore.rules`.
- The **one real secret** is the service account key used by the local seed
  script (`seed/serviceAccount.json`). It is `.gitignore`d — never commit it.

## Milestones

- **M0** — Skeleton live on Pages
- **M1** — Rules + Google auth (in progress)
- **M2** — Seed script
- **M3** — Week view (core)
- **M4** — Kids view / kiosk mode
- **M5** — Admin editor
- **M6** — Overrides
- **M7** — Home-screen install (PWA)
