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

## Sources of truth

- Behavior and requirements: `docs/SPEC.md`
- Visuals: `design-reference/` is inspiration only. Do NOT copy code from it; everything is rewritten from scratch in Vue.
- Some pages in `design-reference/` are only test pages and do not represent the intended design.

## Firebase

- Config lives in `.env` (`VITE_FIREBASE_*`). Never hardcode it.
- Database access only through `src/services/`. No direct Firebase calls in components or stores.
- Firestore security rules live in `firestore.rules` in the repo root.
- When the data model changes, update both `firestore.rules` and the data model description in `docs/SPEC.md`.

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
