# Project: zareweb

## Stack

- Vue 3, Composition API, `<script setup>`, JavaScript (no TypeScript)
- Vite, Vue Router, Pinia
- Firebase: Firestore, Auth, Storage (photo albums), Cloud Functions
- Styles: Tailwind CSS v4 (`@tailwindcss/vite` plugin, theme configured in CSS via `@theme`, no `tailwind.config.js`)

## Commands

- `npm start` – everything for a normal local run in one terminal (`scripts/start.sh`): emulators in the background (log `.emulators.log`, reused if already running), test data on the first run (`npm start -- --seed` re-seeds), then the dev server; Ctrl+C stops all and saves emulator data. **Keep it in sync**: when a normal run needs a new step (seed, service, …), add it there; tests only go into its header comment.
- `npm run dev` – dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run format` – format `src/` with Prettier (config in `.prettierrc.json`)
- `npm run emulators` – Firebase Auth + Firestore + Functions + Storage emulators (UI at http://127.0.0.1:4000); data persisted in `emulator-data/`. Changing a function's options (e.g. region) needs an emulator restart.
- `npm run seed` – write `settings/public` and `settings/app` into the running Firestore emulator
- `npm run test:e2e [-- public history waitlist renewal login admin parent poster preview leader attendance events news clubhouse waitlistadmin adminextras photos contacts skautis]` – end-to-end tests in `e2e/` (playwright-core + system Chrome, desktop and 360/390 px, checks Firestore over the emulator REST API). Needs `npm run emulators` and `npm run dev` running; resets `settings/*`, clears `waitlist`, and the `login`/`admin`/`parent`/`poster`/`preview`/`leader`/`attendance`/`events`/`news`/`clubhouse` suites replace all Auth accounts, `users`, (admin, parent, poster, preview, leader, attendance, events, news) `members` and (admin, parent, poster, preview, leader, attendance, events, news) the `seed:activity` collections with the seeded test data; `waitlistadmin` replaces the whole `waitlist` and runs the annual reset; `adminextras` reseeds like the activity suites, clears `invitations` and edits `settings/*` and `packingTemplates` (the runner resets `settings/*` — `settings/meetings` and `settings/emails` are removed, so defaults apply); `photos` reseeds like the activity suites plus all `albums` and their Storage files (`seed:photos`), uploads, deletes and publishes test albums; `contacts` reseeds like the activity suites and replaces the Storage files under `contacts/`; `skautis` replaces `members` and reseeds like the activity suites, then syncs from the skautIS fixture. Add a suite per new page; expected values derive from today's date via `functions/src/shared/`.
- `npm run seed:users` – create test accounts in the emulators, one per role (`spravce@`, `vedouci@`, `rodic@`, `cekajici@`, `zamitnuty@zare.test`), password `heslo1234`
- `npm run seed:members` – children with parents' contacts in `members` (as the skautIS sync writes them) and some meeting days; pairs `rodic@` with Sojka (vlč) and Bobr (s&s). Run after `seed:users`
- `npm run seed:activity` – replaces `skautisPeople`, `contacts`, `events` (+ posters, participants), `news`, `meetings` and `packingTemplates` with sample data (incl. one manual contact) dated relative to today (open / closed / cancelled / past events, attendance), and links `vedouci@` to Ondys (vlč) and `spravce@` to Hobit (s&s) via `users.personId`. Stand-in for the leader pages until they exist. Run after `seed:members`
- `npm run seed:photos` – replaces `albums` (+ photos) and all Storage files under `originals/`, `previews/`, `thumbs/` with 6 albums of generated photos (on the past `seed:activity` events, last year's camp, one hidden album), waits for `processPhoto` (~45 s). Needs the Functions + Storage emulators. Run after `seed:activity`
- `npm run seed:waitlist` – replaces `waitlist` and `waitlistResets` with ~35 active entries dated relative to today (notes, renewals) plus one awaiting renewal and one admitted
- `npm run seed:renewal` – create a waiting-list entry awaiting renewal and print its renewal link (`-- --too-old` for a child past the age limit); a quicker way than running the reset
- `npm run map:clubhouse` – redraw the clubhouse map on the public home (`src/assets/public/mapa-klubovna.svg`) from OpenStreetMap data (Overpass API, cached in `.clubhouse-map-osm.json`; `-- --refresh` downloads it again): streets, buildings, greenery and a handwritten note with an arrow at the clubhouse; the view, street labels and the note are constants in `scripts/clubhouse-map.js`
- `npm run skautis:probe -- <token> [unitId]` – dump raw skautIS API data (user, roles, members, parents, contacts) for a login token to `.skautis-probe.json`; without a token prints the login link

## Sources of truth

- Behavior and requirements: `docs/SPEC.md`
- Deployment (Firebase project, upload to the skauting.cz hosting, preview behind the countdown, launch): `docs/DEPLOY.md`
- Visuals: `design-reference/` is inspiration only. Do NOT copy code from it; everything is rewritten from scratch in Vue.
- Some pages in `design-reference/` are only test pages and do not represent the intended design.

## Firebase

- Config lives in `.env` (`VITE_FIREBASE_*`, template in `.env.example`). Never hardcode it. `.env` is gitignored.
- Local development runs against emulators with the demo project `demo-zareweb` (`VITE_USE_EMULATORS=true`); no real Firebase project exists yet.
- Initialization in `src/services/firebase.js`. Database access only through `src/services/`. No direct Firebase calls in components or stores.
- Firestore security rules live in `firestore.rules`, Storage rules in `storage.rules`, composite indexes in `firestore.indexes.json` (repo root).
- When the data model changes, update `firestore.rules`, `firestore.indexes.json` (new queries) and the data model description in `docs/SPEC.md`.
- Cloud Functions live in `functions/` (own `package.json`, installed by the root `postinstall`), region `europe-west3`. Implemented: `submitWaitlist`, `getRenewal`, `confirmRenewal`, `withdrawRenewal`, `resetWaitlist`, `deleteAccount`, `inviteParent`, `onUserWritten` (e-mails about accounts), `onEventUpdated` (e-mails about events), `processPhoto` (Storage trigger: previews/thumbnails with `sharp`), `deletePhotos`, `deleteAlbum`, `previewSkautisSync` / `applySkautisSync` (skautIS sync, `functions/src/skautis/`). Storage rules in `storage.rules`; the production bucket must be in `europe-west3` (storage triggers run in the bucket's region). E-mails (waiting-list confirmation and renewal, accounts, events) go through `functions/src/mail.js`: Gmail SMTP from `MAIL_FROM` (a skaut.cz unit account, app password in the secret `SMTP_PASSWORD`, functions that send use `MAIL_OPTIONS`), replies to `MAIL_REPLY_TO`; the emulator only logs them (with their links); texts in `settings/emails`, defaults in `functions/src/shared/emails.js`. Not yet: App Check enforcement.
- skautIS (SPEC §4.8 skautIS): the web stays on the skauting.cz hosting (Apache + PHP), not Firebase Hosting. After the skautIS login, skautIS posts the token to `public/skautis/prihlaseni.php`, which redirects to `/vedouci/administrace#skautis=<token>`. There is only the production skautIS app (the test app was cancelled); its app id and the two oddíly are `SKAUTIS` in `functions/src/shared/skautis.js`, and a real login returns to `zare.skauting.cz` — unless that browser opened `https://zare.skauting.cz/skautis/prihlaseni.php?vyvoj=1` (a cookie; `?vyvoj=0` off), then to `http://localhost:5173`. Otherwise development uses the emulator tokens `fixture` / `fixture-basic`, which read `functions/src/skautis/fixture.js` instead of skautIS. `npm run skautis:probe -- <token> [unitId]` dumps raw API data (real personal data) to `.skautis-probe.json` (gitignored).
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
