# Deployment

The web is static files on the skauting.cz hosting (Apache + PHP, `zare.skauting.cz`); Firestore, Auth, Storage and Cloud Functions run in a Firebase project.

## Firebase project (once)

1. Create the project (without Google Analytics), switch to the Blaze plan (Cloud Functions need it) and set a budget alert.
2. Firestore (production mode) and the Storage bucket in `europe-west3` — the location can't be changed later; `processPhoto` runs in the bucket's region.
3. Auth: enable the e-mail/password and Google providers; add `zare.skauting.cz` to the authorized domains (`localhost` is there already); Templates → template language Czech (password reset e-mail).
4. Register a web app (Project settings → Your apps) and put its config into `.env.production` (gitignored) with `VITE_USE_EMULATORS=false`. `npm run build` reads it over `.env`.
5. `.firebaserc`: add the project as the alias `prod` next to `default`. `default` stays `demo-zareweb`, so the emulators never touch production.
6. `functions/.env.<project-id>`: `APP_URL=https://zare.skauting.cz` (links in e-mails; only loaded when deployed to that project).
7. `firebase login`, `firebase deploy --project prod` — rules, indexes, Storage rules, functions. The first deploy enables the needed Google Cloud APIs and may have to be repeated after a few minutes; accept the offered Artifact Registry cleanup policy.

Nothing has to be written into Firestore: missing `settings/*` documents fall back to the defaults in `functions/src/shared/`. Never run the `seed:*` scripts against production.

**Before uploading:** `npx vite --mode production` runs the dev server on localhost against the production project — register, try the functions, photos and skautIS (with `?vyvoj=1`, SPEC §4.8).

**First admin:** register, then in the Firebase console set `users/{uid}.role` to `admin`. Everyone else is approved in Administration.

After every change to rules, indexes or functions: `firebase deploy --project prod` (or `--only firestore`, `--only functions`, …).

## Upload

`npm run build`, then upload the contents of `dist/` into the web root (next to `old/` and `el_prihlaska/`, which stay). `dist/` includes `.htaccess` and `skautis/prihlaseni.php`.

## Preview before launch

Until launch, `public/.htaccess` serves the countdown (`public/launch.html`) for every path except `/old/`, `/el_prihlaska/` and `/skautis/`. The new web shows only in a browser with the preview cookie:

- `https://zare.skauting.cz/?nahled=1` — turns the preview on in this browser for 30 days,
- `https://zare.skauting.cz/?nahled=0` — off.

This hides the web, it does not protect it (anyone who knows the parameter sees it); the data is protected by the Firestore rules as always. Testing writes into the production data: delete test accounts, waiting-list entries, albums etc. before launch.

## Launch

1. In `public/.htaccess` delete the block between `--- Before launch` and `--- end before launch ---`.
2. Delete `public/launch.html` and `public/rozcestnik-800.webp`.
3. `npm run build` and upload `dist/` again. On the server, delete `launch.html` and `rozcestnik-800.webp` too.
