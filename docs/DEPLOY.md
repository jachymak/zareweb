# Deployment

The web is static files on the skauting.cz hosting (Apache + PHP, `zare.skauting.cz`); Firestore, Auth, Storage and Cloud Functions run in a Firebase project.

## Firebase project (once)

1. Create the project, Blaze plan (Cloud Functions need it).
2. Firestore and the Storage bucket in `europe-west3` (`processPhoto` runs in the bucket's region).
3. Auth: enable the e-mail/password provider; add `zare.skauting.cz` to the authorized domains.
4. Put the project id into `.firebaserc` (`default`).
5. `functions/.env`: `APP_URL=https://zare.skauting.cz` (links in e-mails).
6. `firebase deploy` — rules, indexes, Storage rules, functions.
7. `.env.production` (gitignored): the `VITE_FIREBASE_*` values of the web app from Project settings → Your apps, and `VITE_USE_EMULATORS=false`. `npm run build` reads it over `.env`.

Nothing has to be written into Firestore: missing `settings/*` documents fall back to the defaults in `functions/src/shared/`. Never run the `seed:*` scripts against production.

**First admin:** register on the web, then in the Firebase console set `users/{uid}.role` to `admin`. Everyone else is approved in Administration.

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
