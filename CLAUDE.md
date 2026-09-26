# Project: zareweb

## Stack

- Vue 3, Composition API, `<script setup>`, JavaScript (no TypeScript)
- Vite, Vue Router, Pinia
- Firebase: Firestore, Auth
- Styles: Tailwind CSS v4 (`@tailwindcss/vite` plugin, theme configured in CSS via `@theme`, no `tailwind.config.js`)

## Commands

- `npm run dev` – dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run format` – format `src/` with Prettier (config in `.prettierrc.json`)
- `npm run emulators` – Firebase Auth + Firestore + Functions emulators (UI at http://127.0.0.1:4000); data persisted in `emulator-data/`. Changing a function's options (e.g. region) needs an emulator restart.
- `npm run seed` – write `settings/public` and `settings/app` into the running Firestore emulator
- `npm run test:e2e [-- public waitlist renewal login admin parent]` – end-to-end tests in `e2e/` (playwright-core + system Chrome, desktop and 360/390 px, checks Firestore over the emulator REST API). Needs `npm run emulators` and `npm run dev` running; resets `settings/*`, clears `waitlist`, and the `login`/`admin`/`parent` suites replace all Auth accounts, `users`, (admin, parent) `members` and (parent) the `seed:activity` collections with the seeded test data. Add a suite per new page; expected values derive from today's date via `functions/src/shared/`.
- `npm run seed:users` – create test accounts in the emulators, one per role (`spravce@`, `vedouci@`, `rodic@`, `cekajici@`, `zamitnuty@zare.test`), password `heslo1234`
- `npm run seed:members` – children with parents' contacts in `members` (stand-in for the skautIS sync) and some meeting days; pairs `rodic@` with Sojka (vlč) and Bobr (s&s). Run after `seed:users`
- `npm run seed:activity` – replaces `skautisPeople`, `contacts`, `events` (+ posters, participants), `news` and `meetings` with sample data dated relative to today (open / closed / cancelled / past events, attendance). Stand-in for the leader pages until they exist. Run after `seed:members`
- `npm run seed:renewal` – create a waiting-list entry awaiting renewal and print its renewal link (`-- --too-old` for a child past the age limit); stands in for the annual reset until it exists

## Sources of truth

- Behavior and requirements: `docs/SPEC.md`
- Visuals: `design-reference/` is inspiration only. Do NOT copy code from it; everything is rewritten from scratch in Vue.
- Some pages in `design-reference/` are only test pages and do not represent the intended design.

## Firebase

- Config lives in `.env` (`VITE_FIREBASE_*`, template in `.env.example`). Never hardcode it. `.env` is gitignored.
- Local development runs against emulators with the demo project `demo-zareweb` (`VITE_USE_EMULATORS=true`); no real Firebase project exists yet.
- Initialization in `src/services/firebase.js`. Database access only through `src/services/`. No direct Firebase calls in components or stores.
- Firestore security rules live in `firestore.rules`, composite indexes in `firestore.indexes.json` (repo root).
- When the data model changes, update `firestore.rules`, `firestore.indexes.json` (new queries) and the data model description in `docs/SPEC.md`.
- Cloud Functions live in `functions/` (own `package.json`, installed by the root `postinstall`), region `europe-west3`. Implemented: `submitWaitlist`, `getRenewal`, `confirmRenewal`, `withdrawRenewal`, `deleteAccount`. Not yet: waitlist reset (creates renewal tokens), e-mails (incl. admin notification of new accounts), skautIS sync (app not registered with skautIS yet — `members` come from `seed:members`), App Check enforcement.
- Pure logic shared by the web and Cloud Functions (validation, school years) lives in `functions/src/shared/` and is imported in the web as `@shared/...`. It must stay dependency-free.

## State

- Pinia stores (`src/stores/`) for shared state, e.g. `auth` (current user + live `users/{uid}` profile, role, sign-in actions). Route access via `meta.roles` in `src/router/`.
- Component-local state stays in the component.
- Stores call `src/services/` for data; they do not talk to Firebase directly.

## Conventions

- Components in PascalCase, one component per file.

## Responsiveness

- Mobile-first: base styles target mobile, larger screens via `min-width` breakpoints (Tailwind `sm:`, `md:`, …).
- Layout with flexbox/grid, no fixed px widths.
- Everything must be usable from 360 px width (nothing overflows, buttons are tappable).
- Visual polish for mobile comes later; functionality first.

## Language

- All code, identifiers, comments, commit messages and docs (`docs/SPEC.md`) in English.
- UI texts shown to users: Czech.
