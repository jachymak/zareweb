# Deployment

The web is static files on the skauting.cz hosting (Apache + PHP, `zare.skauting.cz`); Firestore, Auth, Storage and Cloud Functions run in a Firebase project.

## Firebase project (once)

1. Create the project (without Google Analytics), switch to the Blaze plan (Cloud Functions need it) and set a budget alert.
2. Firestore (production mode) and the Storage bucket in `europe-west3` — the location can't be changed later; `processPhoto` runs in the bucket's region.
3. Auth: enable the e-mail/password and Google providers; add `zare.skauting.cz` to the authorized domains (`localhost` is there already); Templates → template language Czech (password reset e-mail).
4. Register a web app (Project settings → Your apps) and put its config into `.env.production` (gitignored) with `VITE_USE_EMULATORS=false`. `npm run build` reads it over `.env`.
5. `.firebaserc`: add the project as the alias `prod` next to `default`. `default` stays `demo-zareweb`, so the emulators never touch production.
6. `functions/.env.<project-id>`: `APP_URL=https://zare.skauting.cz` (links in e-mails), `MAIL_FROM=web.zare@skaut.cz`, `MAIL_REPLY_TO=zare@skaut.cz`; only loaded when deployed to that project.
   E-mails: `MAIL_FROM` is a skaut.cz unit account (created in skautIS → the unit → Google služby) with two-step verification and an app password (myaccount.google.com/apppasswords); store it with `firebase functions:secrets:set SMTP_PASSWORD --project prod`. Deploy fails until the secret exists.
7. App Check: in Google Cloud (project `zare-web`) Security → reCAPTCHA (Fraud Defense) → create a Web key for `zare.skauting.cz` and `localhost` (no checkbox challenge); Firebase console → App Check → the web app → Fraud Defense: paste the key, TTL 1 day. The key goes into `.env.production` as `VITE_RECAPTCHA_SITE_KEY`. Don't enforce anything on the App Check „APIs“ tab — enforcement is only in the public functions.
8. `firebase login`, `firebase deploy --project prod` — rules, indexes, Storage rules, functions. The first deploy enables the needed Google Cloud APIs and may have to be repeated after a few minutes; accept the offered Artifact Registry cleanup policy.

Nothing has to be written into Firestore: missing `settings/*` documents fall back to the defaults in `functions/src/shared/`. Never run the `seed:*` scripts against production.

**Before uploading:** `npx vite --mode production` runs the dev server on localhost against the production project — register, try the functions, photos and skautIS (with `?vyvoj=1`, SPEC §4.8).

**First admin:** register, then in the Firebase console set `users/{uid}.role` to `admin`. Everyone else is approved in Administration.

After every change to rules, indexes or functions: `firebase deploy --project prod` (or `--only firestore`, `--only functions`, …).

## Upload

`npm run build` (also writes the static HTML of the public pages and `sitemap.xml`, SPEC §8), then upload the contents of `dist/` into the web root (next to `old/` and `el_prihlaska/`, which stay). `dist/` includes `.htaccess` and `skautis/prihlaseni.php`.

## Old site

The old site stays under `/old/` on the server, reached only by typing `https://zare.skauting.cz/old/` (nothing links to it after launch). `.htaccess` sends it with `X-Robots-Tag: noindex`, so search engines drop it, and visitors coming from other sites (search results, links) are redirected to `/`. Its old root addresses (`/index.php?stranka=…`) redirect to the matching new page.

## Countdown

The web launched on 2026-10-03. The countdown page (`public/launch.html`) stays in the repo for later bigger changes; it is off. To turn it on, uncomment the four `RewriteCond` / `RewriteRule` lines in the „Countdown“ block of `public/.htaccess` (and adjust the text of `launch.html`), build and upload. Then every path except `/old/`, `/el_prihlaska/` and `/skautis/` shows `launch.html` with status 503, so search engines keep the pages in their index (meant for days, not months). The web shows only in a browser with the preview cookie:

- `https://zare.skauting.cz/?nahled=1` — turns the preview on in this browser for 30 days,
- `https://zare.skauting.cz/?nahled=0` — off.

This hides the web, it does not protect it (anyone who knows the parameter sees it); the data is protected by the Firestore rules as always. Comment the lines out again to turn it off. `/launch.html` itself is sent with `noindex`.

## After launch

1. Add the site to Google Search Console and Seznam Webmaster (webmaster.seznam.cz) — verification files go into `public/` — and submit `https://zare.skauting.cz/sitemap.xml`.
2. Check the link preview (e.g. paste the URL into a WhatsApp chat or the Facebook Sharing Debugger).
3. Watch the old `/old/` addresses drop out of the index over the following weeks.
