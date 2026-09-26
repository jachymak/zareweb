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
- `npm run emulators` – Firebase Auth + Firestore emulators (UI at http://127.0.0.1:4000); data persisted in `emulator-data/`

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
- Cloud Functions (waitlist sign-up/renewal/reset, e-mails, skautIS sync) are not set up yet.

## State

- Pinia stores (`src/stores/`) for shared state (e.g. the current auth user).
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
