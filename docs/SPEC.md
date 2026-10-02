# zareweb — Functional Specification

> Status: **draft**, derived from `design-reference/web_skautskeho_oddilu/*.dc.html`, the design handoff notes `design-reference/README.md`, `design-reference/README-cekaci-listina.md`, and decisions of the project owner.
> Items marked **[?]** are guesses or gaps and need confirmation — see [Open questions](#open-questions).

## 1. Overview

Website of the scout group **Záře** (Dejvice, Prague), part of Junák – český skaut, středisko Šipka Praha. The group consists of two troops:

| Code  | Troop                           | Age   | Meeting days (17:00–19:00) |
| ----- | ------------------------------- | ----- | -------------------------- |
| `vlc` | 220. oddíl **Vlčušky**          | 7–11  | Monday, Thursday           |
| `ss`  | 222. oddíl **Skauti a skautky** | 12–15 | Tuesday, Wednesday         |

Meeting days and times are set in Administration (§4.8 Meetings) — the table shows the defaults (`DEFAULT_MEETING_SCHEDULE` in `functions/src/shared/meetingDays.js`), used until the admin saves the schedule.

Each child has a **fixed meeting day** — one of the two days of their troop, assigned manually in Administration — and attends one meeting per week.
Events and news are targeted at an **audience**: `vlc`, `ss` or `all` (UI tags: „vlč“, „s&s“, „vši“).

The site has three parts:

1. **Public** — presentation of the group, waiting-list sign-up, login.
2. **Parents** („pro členy“) — logged-in parents see their children's attendance, news, events, sign-ups, photos and leader contacts.
3. **Leaders** („pro vedoucí“) — attendance, events and posters, news, waiting list, clubhouse, administration.

**Source of member data is skautIS.** Children, leaders and their contact details are imported into the web through the skautIS API in Administration (once a year and whenever something changes). The web does not edit this data itself; it only adds web-specific data (accounts, attendance, events, …).

### 1.1 Roles

| Role            | How obtained                                      | Access                                          |
| --------------- | ------------------------------------------------- | ----------------------------------------------- |
| Anonymous       | —                                                 | Public pages, waiting-list sign-up and renewal  |
| Pending         | Self-registration (anyone)                        | Only the "waiting for approval" screen          |
| Parent          | Admin pairs at least one child to the account    | Parent area, only data of **their** children    |
| Leader          | Admin assigns role „vedoucí“                      | Leader area (everything except Administration)  |
| Admin           | Admin assigns role „správce“                      | Leader area + Administration                    |
| No access       | Admin rejects or deactivates the account (`none`) | Only the "no access" screen                     |

A leader who is also a parent of a member is not handled (does not occur in practice).

### 1.2 Pages

Routes are in Czech (they are user-visible).

| #  | Page                        | Route                               | Access  | Design file                       |
| -- | --------------------------- | ----------------------------------- | ------- | --------------------------------- |
| 1  | Public home                 | `/`                                 | public  | `_Zare - verejna stranka`         |
| 2  | Waiting-list sign-up        | `/cekaci-listina`                   | public  | `Zare - cekaci listina`           |
| 3  | Waiting-list renewal        | `/cekaci-listina/obnovit/:token`    | public  | — (derived from page 2)           |
| 4  | Login / registration        | `/prihlaseni`                       | public  | `Zare - prihlaseni`               |
| 5  | Parent home                 | `/clenove`                          | parent  | `_Zare - pro cleny`               |
| 6  | Event poster                | `/clenove/akce/:eventId`            | parent, leader | `Zare - plakatek`                 |
| 7  | Leader home                 | `/vedouci`                          | leader  | `_Zare - pro vedouci`             |
| 8  | Attendance                  | `/vedouci/dochazka`                 | leader  | `Zare - vedouci dochazka`         |
| 9  | Events & posters            | `/vedouci/akce`                     | leader  | `Zare - vedouci akce`             |
| 10 | News                        | `/vedouci/aktuality`                | leader  | `Zare - vedouci aktuality`        |
| 11 | Clubhouse                   | `/vedouci/klubovna`                 | leader  | `Zare - vedouci klubovna`         |
| 12 | Waiting list (management)   | `/vedouci/cekaci-listina`           | leader  | `Zare - vedouci cekaci listina`   |
| 13 | Parent preview              | `/vedouci/nahled`                   | leader  | reuses page 5                     |
| 14 | Administration („Administrace“) | `/vedouci/administrace`         | admin   | `Zare - sprava`                   |
| 15 | All albums                  | `/clenove/fotky`                    | parent, leader | — (cards from page 5)      |
| 16 | Album                       | `/clenove/fotky/:albumId`           | parent, leader | — (Google Photos–like)     |
| 17 | Photos (management)         | `/vedouci/fotky`                    | leader  | — (cards from page 5)             |
| 18 | Album (management)          | `/vedouci/fotky/:albumId`           | leader  | — (as page 16 + tools)            |
| 19 | Troop history               | `/historie`                         | public  | — (header as page 2)              |

Not in scope: `Zare - cesta responzivne` — design study of the hand-drawn trail on mobile; visual reference for page 1 only.
Password reset uses Firebase's default hosted page.

---

## 2. Public pages

### 2.1 Public home (`/`)

Mostly static content. Sections (anchor nav in header): Kdo jsme, Oddíly, Co děláme, (Proč skauting), Jak to chodí, Klubovna, Tábor, Pro rodiče (FAQ), link „pro členy“ → login.

**Intro:** every fresh load of `/` (also a reload) first shows a full-screen painting (a forest camp with teepees, `background-size: cover`, contrast raised to 1.35) with the logo, „Skautský oddíl Záře“, a gold hand-drawn line and the button „hurá na web →“ in the bottom left corner. Only the button leaves it (clicking the painting does nothing): the painting fades out while zooming in and moving up and the text fades out (0.7 s), revealing the page, which is already rendered underneath and doesn't scroll until then. No intro when coming back to `/` within the site or for a link to a section (`/#tabor`). Design: `design-reference/design_handoff_intro/`, painting `design-reference/final.png`; it is served as WebP in three widths (1280 / 1920 / 2560 px).

Decorative: a hand-drawn trail connecting drawings along the page, opening and closing verse. Recommended mobile variant is **M2** from the design study (trail winds across the full width, drawings alternate left/right).

**Dynamic content**

- „Chcete se přidat?“ block: *„Nováčky na školní rok {doneYear} už máme nabrané. Nové zápisy zařadíme do výběru na rok {nextYear}.“* — see §6.1.
- Buttons: „Zapsat na čekací listinu“ → page 2; „…nebo najít jiný oddíl“ → `https://skautskyoddil.cz`.
- FAQ: accordion, one item open at a time. Content static (6 Q&A in the design).

A link under the Tábor section („historie oddílu a všechny naše tábory od roku 1976“) leads to page 19; the history has no stop of its own on the trail.

**Footer:** group name + troops, středisko Šipka (logo + link), contact `zare@skaut.cz` with a note not to use it for sign-up interest (link to waiting list), supporter logos.

**Reads:** `settings/public`. **Writes:** nothing.

### 2.2 Waiting-list sign-up (`/cekaci-listina`)

Public form, no login. Header text shows the current recruitment years (§6.1).

**Form**

1. **About the child**
   - First name, last name — required.
   - Gender: „dívka“ / „chlapec“ / „jiné“ (clickable cards) — required.
   - Date of birth: three fields DD / MM / RRRR, digits only, auto-advance after 2 digits. Must be a valid, non-future date, age ≤ 25.
   - Computed age shown once the date is valid („je jí / je mu / věk: X let a Y měsíců“, Czech plural forms).
   - Age ≥ `waitlistWarnAge` (12): info *„Děti od 12 let standardně už nenabíráme, ale zapíšeme ji/ho i tak…“* — submission allowed.
   - Age ≥ `waitlistMaxAge` (15): rest of the form hidden, message inviting them to join as a leader/rover (mail `zare@skaut.cz`). Submission blocked.
   - School grade in school year {nextYear}: buttons 1.–9., „ještě nechodí do školy“ (0), „střední škola“ (10). Pre-filled from date of birth (§6.2) with hint *„předvyplněno podle data narození — upravte, pokud nesedí“*; manual click overrides. Required.
2. **Parent contact**
   - Parent full name — required, at least two words.
   - E-mail — required, regex `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`.
   - Phone — required; 9 digits, or `+` country code + 9 digits. Auto-formatted into groups of 3.
3. **Do you know someone from the group?** Ano / Ne — required. If „Ano“: text „Koho?“ required.

Validation errors appear only after the first submit attempt: red borders per field + summary line.

**On submit**

- The form calls the Cloud Function `submitWaitlist` (no direct Firestore write), protected by **Firebase App Check** (invisible reCAPTCHA). The function validates the data with the same rules as the form.
- **Duplicate check:** if an entry with the same first name, last name and date of birth (ignoring case, diacritics and extra spaces) already exists (any status), no new entry is created and the form shows *„{Jméno} už na čekací listině je.“* **[?] wording**; the leaders are not notified.
- Otherwise creates a `waitlist` entry (status `active`, `firstSignedUpAt = now`) and sends a confirmation e-mail to the parent.
- Success screen: „{Jméno} je na čekací listině“, info about the annual renewal e-mail, honest note (~150 children, 5–7 admitted per year) with link to find another group, buttons „Zpět na stránku oddílu“ and „Zapsat další dítě“ (clears child fields, **keeps parent contact**).

**Reads:** `settings/public` (incl. age limits). **Writes:** via `submitWaitlist` only.

### 2.3 Waiting-list renewal (`/cekaci-listina/obnovit/:token`)

Target of the link in the annual renewal e-mail (§4.6). No design — built from the sign-up form's components.

- The token identifies one archived entry awaiting renewal. Invalid/used token → friendly message.
- Shows a questionnaire **pre-filled with the previous values**. Editable: grade, „znáte někoho z oddílu“ (+ whom), parent name, e-mail, phone. Child's name, gender and date of birth are read-only.
- Same validation rules as the sign-up form.
- „Potvrdit zájem“ → the entry becomes `active` again **keeping its original `firstSignedUpAt`** (so it returns to its original place in the order); the renewal date is appended to `renewalDates`.
- „O místo už nemáme zájem“ → the entry is deleted (with confirmation).

- The grade is pre-filled from the previous answer, moved forward by the number of school years since then (clamped to 0–10).
- A child who has reached `waitlistMaxAge` in the meantime cannot be renewed (same rule as sign-up); only „O místo už nemáme zájem“ is offered.
- Reading and updating by token goes through Cloud Functions `getRenewal` / `confirmRenewal` / `withdrawRenewal` (the client has no direct access to `waitlist`). The token is single-use: confirming clears it, withdrawing deletes the entry.

### 2.4 Login / registration (`/prihlaseni`)

One entry point for parents and leaders. Four states:

1. **Login** — „Přihlásit se Googlem“, or e-mail + password. Links: forgotten password, registration.
2. **Forgotten password** — e-mail field → Firebase password-reset e-mail (link valid 60 min). Confirmation „mrkni do e-mailu (i do spamu)“. Note that Google users don't need a password.
3. **Registration** („Založení účtu“) — anyone can create an account (parents and leaders alike); the admin decides who gets access. Explains how approval works (create account → the admin verifies you belong to the group, e.g. by the parent e-mail in skautIS, and pairs your children → e-mail, then access). Fields: name, e-mail, password (min. 8 chars), **note for the admin** („Koho u nás máš?“ — children's names/nicknames and troop, or the leader's nickname; required, max. 1000 chars). Or „Založit účet přes Google“. Creates a Firebase Auth account and a pending user profile with the note.
4. **Waiting for approval** — shown to any logged-in `pending` user. Status steps: account created ✓, note written ✓ / …, approval by the admin … . Shows the saved note with „upravit poznámku“; a Google user who has no note yet fills it in here (required), with the hint that until then the admin doesn't learn about the account and can't approve it („Ještě jeden krok: …“). No contacts — the user is not expected to write to anyone; the admin gets in touch if needed. The page follows the profile live and moves on as soon as the account is approved. Button „odhlásit se“.
5. **No access** — a logged-in user with role `none`: short message with `zare@skaut.cz` in case of a mistake, „odhlásit se“.

**After login, redirect by role:** admin/leader → `/vedouci`, parent → `/clenove`, pending → waiting screen, none → no-access screen. Protected pages send signed-out users to `/prihlaseni?next=…` and back after login; a user whose role doesn't fit is sent to their home (or the status screen). A role change takes effect live on open pages.

**Approval flow:** a pending account with its note triggers an e-mail to the admins (Cloud Function `onUserWritten`; right at registration, after a first Google login once the note is filled in; once per account, fixed text with the note and a link to „účty a párování“). In Administration (§4.8, „účty a párování“) the admin sees the note and suggested children (parent e-mail matches skautIS) and either approves (pairs children → role `parent`, or sets a leader role), or rejects it; to ask an unknown account who they are, the admin writes to its e-mail directly (role `none`). A `none` account can later be reactivated or deleted. When the admin approves the account for the first time (pending → parent / leader / admin), `onUserWritten` e-mails the user (`accountApproved`, with the paired children for parents); pairing more children later or approving again after unpairing sends nothing.

**Reads:** own `users/{uid}`. **Writes:** Auth account; `users/{uid}` (create on registration / first Google login).

---

### 2.5 Troop history (`/historie`)

Static content in `src/content/history.js` (from the old web): the history of the troop in periods (hand-written years as headings), then „Tábory oddílu Záře“ — every camp year from 1976, grouped by decade (cards, two columns from `sm`). A year's row appears from July of that year (the camp starts in early July); a theme is a name or one name per troop (vlčušky / skauti); years without a theme show „doplníme“. New camps are added to `CAMPS` in the content file.

**Reads / writes:** nothing.

---

## 3. Parent area

Common header: „Skautský oddíl Záře — pro členy“, the user's e-mail, „odhlásit“. Footer with link to the public site (not on the poster page).

### 3.1 Parent home (`/clenove`)

1. **Greeting** — „Ahoj!“, today's date, nearest upcoming relevant event (name + date).
2. **Children cards** — one per paired child: nickname, troop tag, full name, meeting day, attendance % at meetings, number of trips attended (current school year). Below: the camp requirement of the children's troop(s) (§6.3), only its required parts — *„na tábor je potřeba 4 výpravy a 60 % schůzek“*; one line when all children's troops have the same one, else one line per troop prefixed with the troop name; nothing when not required.
3. **News (Aktuality)** — non-withdrawn news whose audience is `all` or one of the children's troops. The first item — **important** news pinned on top, otherwise the newest — is shown expanded and highlighted as a card (date, tag, author, title, text, optional link); the rest as an accordion (one open at a time).
4. **Open for sign-up (Nejbližší akce)** — relevant events with registration enabled. Each row: date, tag, title, organizer, poster link („plakátek“ if published, otherwise disabled „plakátek se chystá“), sign-up toggles — one per child **whose troop matches the event audience** — and the deadline („přihlášky do 12. 3.“).
   - Before the deadline: toggling signs the child up / off immediately.
   - The poster link leads to page 6.
   - After the deadline (event stays listed until it starts): toggles are locked; deadline text changes to „přihlašování skončilo“ and clicking a child shows *„Přihlašování už skončilo, takže tady {přezdívka} přihlásit ani odhlásit nejde. Napište prosím organizátorovi akce — {přezdívka organizátora} ({telefon}, {e-mail}). Pokud to ještě půjde, změnu zařídí.“* Signing off after the deadline also goes through the organizer.
5. **Výpravník (calendar)** — events grouped by month.
   - Toggle „co nás čeká“ (upcoming) / „proběhlo“ (past).
   - Toggle „i akce druhého oddílu“ / „jen naše akce“ — by default only events for the children's troops + `all`. Hidden when the children are in both troops.
   - Shows first 2 months, button „zobrazit celý rok“ expands.
   - Row: date, tag, title, organizer; cancelled events struck through with „zrušeno“.
   - An event with a published album shows „fotky →“ (→ the album, §3.3).
   - „proběhlo“ lists past events of the current school year, newest first; each child who could join shows ✓/✗ attendance, only for trips (events with registration, not the camp).
6. **Photos (Fotky)** — the 4 latest published albums of the children's troops (+ `all`), as tilted polaroids: cover, troop tag, title, detail like „únor · 31 fotek“ (month with the year when not this year); each opens the album (§3.3); „všechna alba →“ opens all albums. No albums → „Zatím tu nejsou žádná alba…“.
7. **Leaders (Vedoucí)** — contact cards (photo, nickname, name · role, phone, e-mail) filtered by tabs „vlčušky“ / „skauti a skautky“ / „ostatní“.

**Reads:** own `users/{uid}`, `members` (own children), `meetings` (attendance), `events` + own children's `participants`, `news`, `albums`, `contacts`, `settings/app`.
**Writes:** `events/{id}/participants/{memberId}` — only sign-up fields, only own children, only while registration is open and before the deadline.

### 3.2 Event poster (`/clenove/akce/:eventId`)

Read-only page generated from the event's poster data. Parents see it only when published (otherwise „plakátek se ještě chystá“; the camp: „k téhle akci plakátek není“; deleted/unknown event: not found). Leaders see every poster; an unpublished one is marked as a preview („rodiče tenhle plakátek zatím nevidí“) — this is the „náhled plakátku“ of §4.3. A cancelled event shows „Akce je zrušená.“ above the poster. Lines without a value are left out.

- Tag, title, date.
- Intro text.
- **Kam** (destination) + map link.
- **Sraz**, **Návrat** — composed from the Památník / Hlavní nádraží times or the „jinde“ free text.
- **Peněz** (cost, from the event's `price`), **S sebou** (the packing items joined into a sentence), **Jídlo** (food).
- Signature: „Těší se na vás {organizers' nicknames}“ (derived from the event's organizers).
- **„sbaleno?“ checklist** of packing items — ticking is local only (not sent anywhere; remembered in `localStorage` per event).
- Footer: „Něco není jasné? Ozvěte se organizátorovi — {nickname} ({phone}, {e-mail})“ (main organizer), back to the calendar (`/clenove#vypravnik`; leaders: back to `/vedouci`).

**Reads:** `events/{id}`, `events/{id}/poster/content`, `skautisPeople` (organizers).

### 3.3 Photo albums (`/clenove/fotky`, `/clenove/fotky/:albumId`)

Photos of events are stored in Firebase Storage (§5 Storage): originals in full quality, a preview (long edge 2048 px) for viewing and a thumbnail (640 px) for the grid, both made by the `processPhoto` Cloud Function. Only published albums are shown; leaders open these pages from the parent preview like the poster (`?nahled=`, same header and preview bar), otherwise with the leader header and „spravovat album →“.

**All albums** — „Fotky“, published albums by school year („školní rok 2026/27“, newest first) as the polaroid cards of §3.1. With children in one troop only the albums of that troop and `all` are shown; „i alba druhého oddílu“ / „jen naše alba“ switches (text below: „Vidíte alba vlčušek a z akcí pro všechny.“), as in the Výpravník. „← zpět na stránku pro členy“.

**Album** — kicker with the dates („14.–16. 3. 2026“), title, troop tag, photo count, „← všechna alba“.

- **Grid** like Google Photos: justified rows (every row fills the width, photos keep their aspect ratio, rows close to 132 / 190 / 230 px high by screen width; a row ends where its height is closest to that; the last row isn't stretched). Sizes come from the stored width/height, so nothing shifts while loading; each tile shows the photo's dominant colour until its lazy-loaded thumbnail fades in.
- **Order** (`sortPhotos`): by the time taken (EXIF `DateTimeOriginal`); photos without a date last; ties and undated photos by file name with numbers compared as numbers („IMG_9“ before „IMG_10“), so naming files 01, 02, … sets their order. Photos can't be reordered by hand (yet — see Open questions).
- Albums of several days are **grouped by day** („sobota 14. března · 23 fotek“), photos without a date last („bez data pořízení“), unless the leader turned it off (`groupByDay`); one-day albums and albums without dates are one grid.
- **Lightbox** (PhotoSwipe): the preview zooms in from the clicked thumbnail; arrows / keys / swiping move between photos, pinch or wheel zooms, swipe down or Esc closes. Counter „3 / 88“, caption with the date and time taken, button **„Stáhnout originál“** downloads the untouched original under its file name (one photo at a time). The open photo is in the URL (`?photo={photoId}`): the link opens it directly, the back button closes it.
- Parents see only processed (`ready`) photos. An unpublished or deleted album: „Tohle album jsme nenašli“.

**Reads:** `albums` (published), `albums/{id}/photos`, `members` (own children, for the troop filter); originals via Storage (download).

---

## 4. Leader area

Common header (as in the design, no menu): „Skautský oddíl Záře“ (→ leader home) with the badge „pro vedoucí“, then „náhled pro rodiče“, user's e-mail (hidden on narrow screens), „odhlásit“. Pages are reached from the tools on the leader home; each subpage has „← zpět na vedoucovskou stránku“. Footer: „vedoucovská část — vidí ji jen tým“, „náhled rodičovské stránky →“ (subpages: „zpět na vedoucovskou stránku →“).

**Troop switch** (leader home, attendance): top right of the page, „Oddíl“ above a two-way switch „vlčušky“ / „skauti a skautky“, each with its troop tag. It starts with the leader's home troop (`skautisPeople.troop` of the linked person), or vlčušky for a leader without one (not linked yet, or „ostatní“); the leader's choice is remembered in the browser and shared by the pages.

### 4.1 Leader home (`/vedouci`)

1. **Greeting** — „Ahoj, {nickname}!“, role title + troop, today's date.
2. **Tools** — links to Docházka, Akce a plakátky, Aktuality, Fotky, Klubovna, Čekací listina; **Administrace** only for admin.
The troop-dependent parts (today card, attendance summary) follow the troop switch. The greeting uses the linked person's nickname and role title, otherwise the account's first name and „vedoucí“ / „správce“.

3. **Today card** (based on the chosen troop and today's date):
   - today is a meeting day of the troop → „schůzka v klubovně, 17–19 h“ + „zapsat docházku →“ (opens that meeting: `/vedouci/dochazka?oddil={troop}&schuzka={date}`);
   - today is the first day of a trip (§6.3) for the troop (or `all`) → „první den výpravy — {name}“ + „zapsat účast a platby →“ (`/vedouci/dochazka?oddil={troop}&vyprava={eventId}`);
   - the other troop meets today → „dneska má schůzku druhý oddíl…“;
   - today is a meeting day of the troop but falls into a range without meetings (§4.8 Meetings) → „dneska schůzka není — {reason}“;
   - otherwise → „dneska není schůzka ani výprava — klidný den“, link „zapsat jiný termín →“.
   The meeting time („17–19 h“) comes from the schedule.
4. **Nearest events** — upcoming events of both troops with registration started (as in §3.1, incl. those past the deadline): date, tag, title, organizer, **signed up / eligible** count (active children who can join, §6.4) with a progress bar, poster link („plakátek“ → poster page, or „vyplnit plakátek“ → editor `/vedouci/akce?akce={eventId}`), link „jmenný seznam a platby →“ (attendance → trips tab). Link „přidat akci nebo plakátek →“.
5. **Troop attendance summary** — for the chosen troop: each child with meeting % and trips count; children not meeting the camp requirement highlighted red.

**Reads:** own `users/{uid}`, `members`, `meetings`, `events` + `participants`, `settings/app`.

### 4.2 Attendance (`/vedouci/dochazka`)

Troop switch (top right, §4 intro). Three tabs. The selection is kept in the URL: `?oddil={troop}&schuzka={date}` (meetings), `&vyprava={eventId}` (trips), `&prehled` (overview) — links from the leader home use it. Without a selection the page opens today's meeting if today is a meeting day, else the troop's most recent meeting date.

**Meetings (schůzky)**

- Choose weekday (the troop's two meeting days from §4.8 Meetings; the time is shown next to it), then a date from the list of meeting dates of this school year up to today — dates in ranges without meetings are left out unless a meeting was recorded on them anyway (newest first, horizontally scrollable, the selected one scrolled into view; cancelled dates marked „×“).
- Header: „Schůzka {den} {datum}“, troop tag, „přišlo X z Y“.
- Grid of children **whose meeting day is the selected weekday** (nickname + name) — click toggles present. Buttons „přišli všichni“, „zrušit výběr“, „schůzka nebyla“. Children of the troop without a meeting day are named below the grid (they are not in any meeting; the admin sets the day).
- „Schůzka nebyla“ marks the meeting cancelled: it does not count towards anyone's attendance nor the number of meetings. Can be undone („schůzka přece byla“) — the recorded presence is kept.
- **Autosave** („ukládá se samo“). A meeting is **recorded** once its attendance is saved (or it is marked „schůzka nebyla“). Clicking a child changes only that child (`arrayUnion` / `arrayRemove`), and the page follows the meetings live, so two leaders can record the same meeting at once.
- Past meeting dates that have not been recorded are flagged („nezapsáno“) so the leader can catch up; they don't count towards attendance until recorded.

**Trips (výpravy)**

- List of the troop's trips (§6.3: registration enabled, not the camp, not cancelled; audience troop + `all`) of this school year incl. upcoming ones, horizontally scrollable, newest first. Opens on the trip that started last.
- Children who can join are listed: the troop's children, and for `all` trips the children of **both** troops (with their troop tag) — usually one leader records such a trip for everybody.
- Header: title, tag, date, price (or „cena zatím není“); summary „přijelo X · zaplaceno Y z přihlášených Z · máš mít u sebe N Kč“ — the cash is the sum of amounts of children marked paid (the entered amount, else the event price).
- **Signed up** children: „přijel“ / „nepřijel“ (clicking the active one clears it), „zaplaceno“ / „nezaplaceno“ toggle, amount (placeholder = the event price; saved when the field is left; empty = the price).
- **Not signed up** („kdyby někdo přišel“): „přijel“, payment toggle, amount.
- Autosave, followed live.

**Overview (přehled dětí)**

- For each child: meeting %, trips count (each red if below the camp requirement), and a row of dots per meeting date of the child's day this school year — filled = present, empty = absent, hatched = meeting cancelled, dashed = not recorded yet; tooltip with date and state. A child without a meeting day shows a note instead.

**Reads:** `members`, `meetings`, `events` + `participants`, `settings/app`.
**Writes:** `meetings` (presence, cancelled flag), `events/{id}/participants` (attended, paid, amountPaid).

### 4.3 Events & posters (`/vedouci/akce`)

Two columns (stacked on narrow screens; selecting an event scrolls to its detail). What the right column shows is kept in the URL: `?akce={id}` (detail), `?akce={id}&upravit` (edit details), `?nova` (new event) — the home page's „vyplnit plakátek“ links there. Events are followed live.

Left: button „+ přidat akci“, list of planned events (not ended yet; „i proběhlé akce“ shows this school year's past ones too): date, tag, title, organizers, status chips. Poster status:

| Status      | Label               |
| ----------- | ------------------- |
| `published` | plakátek zveřejněný |
| `draft`     | plakátek rozepsaný  |
| `missing`   | plakátek chybí      |
| `none`      | bez plakátku        |
| (cancelled) | akce zrušená        |

Plus a registration chip (not for the camp): „přihlašování nespuštěné“ / „přihlašování do 12. 3.“ / „přihlašování skončilo“.

**Add / edit event** form:

- Title, audience (vlčušky / skauti a skautky / všichni), organizers (active leaders from `skautisPeople` as toggles, in the order clicked; the first is the main organizer, whose contact is on the poster; a new event starts with the signed-in leader; required except for events without poster), checkbox „akce bez plakátku (např. tábor)“.
- **Event without poster = the camp**: shown only in the calendar (výpravník); no registration, attendance or payments on the web — information goes to parents by e-mail, no single organizer.
- Date: month calendar; click first day, then last day for multi-day events (one click = one-day event).
- „přidat akci“ / „uložit změny“, „zrušit“.
- New event gets poster status `missing` (or `none` if without poster). Unticking „bez plakátku“ later gives `missing`; ticking it keeps no poster editor.

**Selected event — detail:**

- Actions: „upravit údaje akce“, „zrušit akci“ / „obnovit akci“ (cancelled events are shown struck through to parents), „smazat akci“ with inline confirmation (soft delete — sign-ups and payments are kept, the event disappears everywhere; the page closes it, also when another leader deletes it).
- The camp shows only the actions and a note.
- **Registration** („Přihlašování“, analogous to publishing the poster): checkbox „spustit přihlašování“ + deadline date (at the latest the event's first day), „uložit přihlašování“. When registration is started, a Cloud Function e-mails the parents of eligible children that sign-up is open — **all known parent e-mails**: parent accounts paired to the child **and** parent contacts from skautIS, deduplicated **(not implemented yet)**. After the deadline parents can't sign up (§3.1); leaders can still sign children up or off at any time **in the event detail** („Kdo je přihlášený“, shown once registration was started): every active child who can join (§6.4; for `all` with a troop tag) as a toggle, „X z Y“.
- **Poster editor** („Plakátek“): intro text; destination; map URL (must start with http(s)://); meeting time at Památník, at Hlavní nádraží (Hlavák), meeting elsewhere (text); return time at Hlavák, at Památník, return elsewhere (text); times stored as `HH:mm`, shown on the poster without a leading zero; **price** (whole CZK — entered when the poster is created, which may be after registration opened; shown as „Peněz“ on the poster and used as the default amount on Attendance → trips); food.
- Packing list: choose a template („Věci na výpravu do chaty“, „…jednodenní výpravu“, „…pod celtou“, „bez hotového seznamu“) → items copied into the event (replacing a non-empty list asks first), then remove (×) or add (Enter). Templates are managed in Administration.
- „uložit“ + checkbox „zveřejnit plakátek rodičům“: `draft` (parents don't see) or `published` (parents see immediately). Not autosaved; unsaved changes are shown („neuložené změny“) and switching to another event or leaving the page asks first. Link „náhled plakátku“ opens the poster page (§3.2) in a new tab, showing the saved version.

**Reads:** `events`, `events/{id}/poster/content`, `events/{id}/participants`, `packingTemplates`, `members` (eligible children), `skautisPeople`. **Writes:** `events`, `events/{id}/poster/content`, `events/{id}/participants` (sign-up fields).

### 4.4 News (`/vedouci/aktuality`)

- Form „Napsat rodičům“: title, text, audience (všem rodičům / jen vlčuškám / jen skautům a skautkám), optional link (label + URL), checkbox „označit jako důležité“. Button „zveřejnit“ → published immediately, author = current leader, date = now.
  Link: label + URL; a URL without a scheme gets `https://`, only http(s) URLs are accepted. Author = the leader's nickname from skautIS (else the account name).
- List of published news (date, tag, author, title; important ones highlighted), newest first, updated live, with „upravit“ (loads into the form; saving keeps author and date) and „stáhnout“ (asks first; withdraw — sets `withdrawn`, parents no longer see it).
- Withdrawn news stay below the list, greyed out („Stažené · rodiče je nevidí“), with „upravit“ and „vrátit“ (publish again). They are not deleted; clean-up of old news comes later.

**Reads:** `news`. **Writes:** `news` (create, update).

### 4.5 Clubhouse (`/vedouci/klubovna`)

**First version: UI only with mock data**, no hardware integration. The data layer goes through `src/services/clubhouse.js` (in-memory mock: readings, mode, devices, schedule, log) so it can later be connected to real devices. Until then the page below the title is **greyed out** (inert) with the note „Tohle ještě nefunguje, ale bude“.

- Readings: temperature, humidity (highlighted when > 60 %).
- Mode: **automat** (devices follow a schedule derived from the meeting days, times and dates without meetings set in Administration (§4.8 Meetings) and from the event calendar; controls read-only) or **manuál** for 2 / 4 / 8 / 12 / 24 h (controls enabled; remaining time shown; „vrátit na automat“). After manual mode expires, the schedule takes over.
- Devices: air-conditioning/heating (on/off, target 8–26 °C, state „topí“ / „drží teplotu“ / „vypnutá“), fans, dehumidifier, boiler (on/off, state „běží“ / „stojí“).
- „Podle rozvrhu“ — upcoming scheduled actions (computed from the meetings and events; the clubhouse rules are edited in Administration — later).
- „Log“ — only the **newest 5 entries** of automatic and manual changes; the full log is in Administration (§4.8 Clubhouse). Manual changes are logged in **batches**: changes made within a minute of the previous one join one entry describing the difference against the state before the batch („Ručně: manuál na 4 h, klimatizace 23 °C, ventilátory zapnuté.“); a change undone within the batch drops out, a batch with no difference leaves no entry. A change more than a minute later starts a new entry. Manual mode expiring is its own entry. Contact to the technician (Quido).

### 4.6 Waiting list management (`/vedouci/cekaci-listina`)

Shows only `active` entries (archived ones are hidden, see reset below).

**Stats row:** number of waiting children (+ how many are new since last reset), girls / boys (+ other) with a ratio bar, average age, youngest (age + name), longest waiting (duration + name + date).

**Filters:** gender chips (všichni / holky / kluci / jiné), age bucket (≤ 6, 7–9, 10–11, 12+), grade in the upcoming school year, „jen s poznámkou (N)“. Counter „zobrazeno X z Y“, „zrušit filtry“.

**Table** (sortable by signed-up date, age, grade — repeated click reverses direction, secondary sort by sign-up date; default oldest first). Text does not wrap. Columns: signed-up date (`M/YYYY`, full date in tooltip), waiting time (+ bar relative to the longest-waiting entry, + badge „N×“ = number of confirmed renewals, explained in tooltip), child name (dot coloured by gender, note icon), age („X let Y měs.“) + birth date, grade (`5.` / `✕` / `SŠ`, full text + school year in tooltip), „zná někoho“ (truncated, full in tooltip), parent name. Rows with a note have a gold inset border.

**Row detail** (click to expand): whom they know, parent e-mail (mailto) and phone (tel), **leaders' note** (visible only to the team; add / edit), „Smazat zápis“ with inline confirmation (irreversible).

**Export:** „Stáhnout CSV“ of the currently filtered rows. Columns: Zapsáno, Jméno dítěte, Pohlaví, Datum narození, Věk, Třída, Zná někoho, Rodič, E-mail, Telefon, Obnoveno, Poznámka. `;` separator, UTF-8 with BOM, file name `cekaci-listina-YYYY-MM-DD.csv`.

**Last reset:** the page looks the same for leaders and admins: „jednou za rok · listina naposledy resetována {date}“ with an **„i“** button that expands how the reset works (the same explanation as in Administration, incl. that it is done only when the group takes no more children this year, and that the admin does it). Admins additionally get the link „resetovat v Administraci →“ (`/vedouci/administrace?zalozka=cekaci-listina`).

**Annual reset** (Administration → čekací listina, §4.8, **admins only**). Done once a year, when the new members are chosen and the group **doesn't plan to take any more children that year**. The tab explains it (the explanation used to be the wizard's first step); „Resetovat listinu na další rok“ opens the wizard:

1. *Admitted children* — list sorted by sign-up date, search by name ignoring diacritics; the admin ticks the children admitted this year. Admitted children get no e-mail.
2. *E-mail and sending* — preview (From: „Skautský oddíl Záře <zare@skaut.cz>“, the saved subject and text, child's name filled in, renewal link; the text is edited in the same tab). Counts: e-mails / admitted. „Odeslat N e-mailů“ → confirmation „Opravdu…? Tohle nejde vzít zpět.“
3. *Sending* — progress bar „odesláno X z N“, then „Hotovo“.

Effect (entries are **archived, not deleted**, to keep the original sign-up date and the previous answers for the renewal questionnaire):

- Ticked children → status `admitted` (leave the list).
- All other active children → status `awaitingRenewal` (leave the list); each gets a renewal token and their parents get the e-mail. Confirming via §2.3 returns the entry to `active` at its original position.
- `settings/public.lastWaitlistReset` = today → public site shows the new recruitment years.
- A record is added to `waitlistResets` (reset log).
- Banner (in the Administration tab) with the reset date and number of e-mails sent.

**Retention (GDPR):** the next reset deletes what the previous one archived: entries still `awaitingRenewal` (the parent did not respond for a whole year) and `admitted` ones (the child is in skautIS by then). Admitted children are chosen only in the reset wizard.

**Renewal e-mail text:** `settings/emails.waitlistRenewal` `{ subject, body }` — paragraphs separated by a blank line, `{dite}` = child's name, `{odkaz}` = renewal link; edited in Administration (§4.8 Čekací listina); default in `functions/src/shared/emails.js` while none is saved. Until SMTP exists, `resetWaitlist` only logs the e-mails in the emulator.

**Narrow screens:** below `lg` the table becomes compact cards (name, age, grade, waiting time; the rest in the expanded detail) with a sort bar above them.

**Reads:** `waitlist`, `waitlistResets`, `settings/public`. **Writes:** `waitlist` (note, delete), reset via Cloud Function (statuses, tokens, e-mails, `settings/public`, `waitlistResets`).

### 4.7 Parent preview (`/vedouci/nahled`)

„Náhled pro rodiče“: the leader picks any active child (select grouped by troop; kept in the URL as `?dite=<memberId>`) and sees the parent home (§3.1) exactly as that child's parent would — parent header, the child **and its siblings** (all children paired with any of its parents; just the child when it has no parent account), real sign-ups and attendance. A green bar on top says it is the preview, holds the child picker and „← zpět do sekce pro vedoucí“.

- Sign-up toggles look and behave like for the parent but **save nothing**: a click shows „Tohle je jen náhled, tady se nic neuloží. Rodič tímhle tlačítkem {přezdívka} rovnou přihlásí / odhlásí…“ (hover: „v náhledu se nic neuloží“); after the deadline the parent's notice is shown.
- The poster link keeps the preview (`/clenove/akce/:eventId?nahled=<memberId>`): the poster is shown as to the parent (unpublished → „plakátek se ještě chystá“), with the preview bar, and „zpět do výpravníku“ returns to the preview.

**Reads:** `members` (+ everything of §3.1). **Writes:** nothing.

### 4.8 Administration („Administrace“, `/vedouci/administrace`, admin only)

Settings blocks (per-troop meeting days, ranges without meetings, the waiting-list reset, each e-mail text, waiting-list ages, camp requirement per troop, packing templates) start collapsed to a narrow full-width bar — title and a short summary (e.g. „pondělí a čtvrtek · 17:00–19:00“, the e-mail subject or „neposílá se“) — that opens into the block; a block with validation errors opens by itself.

Tabs (only implemented ones are shown, in the order skautIS · děti · účty a párování · kontakty · schůzky · čekací listina · e-maily · šablony s sebou · nastavení; the open one is kept in the URL, `?zalozka=skautis|deti|ucty|kontakty|schuzky|cekaci-listina|emaily|sablony|nastaveni`, default účty):

1. **skautIS** — sync of children and leaders from skautIS. Run once a year and after changes. The skautIS login is used only for this sync — logging in to the web itself is always Google or e-mail + password.
   - **Who is imported** (shown on the tab as a note): each troop is one oddíl in skautIS (vlčušky 116.22.220, skauti a skautky 116.22.222), a person's troop is their oddíl. Members are split by **membership category**: vlče, světluška, skaut, skautka → **children** (`members`: first name, last name, nickname, troop, date of birth, **parents' contacts** — name, e-mail, phone); rover, ranger → **leaders** (`skautisPeople`: name, nickname, phone, e-mail; whatever their age, no child record). Other categories (dospělý, benjamínek, ostatní — former or inactive people) are left out as if they weren't there, only counted in the preview. Functions in skautIS are not used: the meeting day, a leader's home troop and role title are set by hand in Administration (děti, kontakty) and the sync never overwrites them. People of the středisko are not imported.
   - **Flow:** the tab shows the date of the last sync and „Synchronizovat ze skautISu“ (a link to the skautIS login with the app id). skautIS posts the login token to the app's registered URL `https://zare.skauting.cz/skautis/prihlaseni.php` (`public/skautis/prihlaseni.php` — the web is static on the skauting.cz hosting, so this PHP relay stores nothing and redirects to `/vedouci/administrace#skautis=<token>&role=…&unit=…`; the URL fragment never reaches a server; for development, `prihlaseni.php?vyvoj=1` sets a cookie in that browser so its logins go to `http://localhost:5173` instead, `?vyvoj=0` turns it off). Administration takes the token from the hash, drops it from the URL, opens this tab and calls `previewSkautisSync`: for each oddíl the login switches (`LoginUpdate`) to a role of the admin that can see it (a role on the oddíl, vedoucí/admin first, else on a unit above it, e.g. the středisko), loads the members, their details, children's parents and leaders' contacts, then logs the token out. The tab shows „Co se změní“: the oddíly used, then children and leaders, each with **noví**, **změnění** (with the changed fields, „přezdívka: Vydra → Vydrák“; a returning person „znovu v oddíle“), **odešlí** and the number unchanged, and the left-out categories. „použít změny“ writes it (`applySkautisSync`) and shows „Hotovo. Děti: 1 nový, 3 změnění, 1 odešlý. Vedoucí: …“; „zrušit“ goes back. Errors are explained: no role that can see an oddíl, oddíl not found, login expired, a skautIS error, loaded data too old (1 hour) or already used. **Without parents' contacts:** when skautIS refuses `PersonParentAll` (not in the basic package of functions an app gets — the production app starts with it), the sync still runs: children are loaded without parents, the preview says „Kontakty na rodiče skautIS nepovolil, zůstávají ty dřív uložené.“, stored parents' contacts are neither compared nor overwritten and new children get none. Parent accounts then work as usual; only the e-mail-based suggestions in „účty a párování“ and the parent e-mails (and „pozvat“) in „děti bez účtu“ are missing.
   - **Writes:** new children get `meetingDay: null`, `parentUids: []`; changed ones get only the skautIS fields (+ `private/contacts` when the parents changed) and `active: true`; gone ones `active: false` (history, pairings and the meeting day stay). New leaders get `troop` = their oddíl as a first guess and `roleTitle: null`; changed ones only name, nickname, phone, e-mail and `active: true`; gone ones `active: false`. `settings/skautis.lastSyncAt` / `lastSyncBy`.
2. **Children (děti)** — active children of the troop chosen in the troop switch (top right, shared with the leader pages; §4 intro) (nickname, name), with the number of children per meeting day and a link to the other troop when it has children without a day; the admin **clicks the meeting day** for each child (one of the troop's two days), saved at once and followed live; clicking the chosen day again clears it. Children without a valid meeting day (none, or a day the troop no longer meets on) are highlighted in red with a count on top and a filter „jen bez dne“ (they don't appear in any meeting's attendance).
3. **Accounts & pairing (účty a párování)** — accounts: e-mail, status („potvrzený“ / „čeká na potvrzení“ / „bez přístupu“), the note from registration, **suggested children** (active children whose parent e-mail in skautIS matches the account e-mail, or whom the note names — first + last name or nickname, ignoring case and diacritics), assigned children as chips (nickname + troop, × to unassign), „+ přiřadit dítě“ (pick from imported `members`). **A parent can have several children, and a child can belong to several parent accounts** (e.g. mother and father separately); any of them can sign the child up. Unassigned children are not visible to parents. Pending accounts: „schválit“ and „zamítnout“ (role `none`); `none` accounts: „znovu aktivovat“ (back to pending) or „smazat“ (Auth account + profile). Accounts are filtered by status (čekající / rodiče / vedoucí / bez přístupu, with counts; opens on čekající) and update live. One more filter, **„děti bez účtu“** (with count), lists active children no parent account is paired with, with their parents' contacts from skautIS (name, e-mail as mailto, phone as tel) — whom to ask to create an account. Each parent e-mail has **„pozvat“**, confirmed in a second step („Poslat pozvánku na {e-mail} ({name})?“ — „Ano, poslat“ / „zrušit“) (`inviteParent`: the informative `parentInvitation` e-mail naming that parent's active children and asking them to create an account, with a plain link to `/prihlaseni` — not personalised, they may register with another address, e.g. Google; the account then starts as pending and is approved as usual); a sent invitation shows „pozváno {date}“ with „poslat znovu“; a parent e-mail that already has an account shows „má už účet“ instead. For a pending account, picked children (suggestion or „+ přiřadit dítě“) are only chosen — chips with ×, nothing saved — until „schválit jako rodiče“ pairs them all and approves the account as a parent in one write, so the approval e-mail lists them all; for a parent account, pairing is saved at once; unpairing a parent's last child returns the account to pending; „odebrat přístup“ / „zamítnout“ sets `none` and unpairs all children. **Leaders are paired the same way with their person from skautIS** (`skautisPeople`, `users.personId` — nickname, home troop and role title on the leader pages, the default organizer / author): suggested leaders (labelled „vedoucí“; e-mail in skautIS equals the account e-mail, or the account name or note names them — full name or nickname) and „+ přiřadit vedoucího“ (search among active leaders not linked to another account; one account per leader). For a pending account a picked leader is only chosen (choosing a leader drops chosen children and vice versa) until „schválit jako vedoucího“ sets role `leader` and links the person in one write; without a chosen leader „schválit jako vedoucího“ approves the account unlinked (e.g. a leader not imported from skautIS). On a leader / admin account the link is saved at once and can be removed (×) or changed; an unlinked one shows „Účet není propojený s vedoucím ze skautISu…“. „odebrat přístup“ also unlinks. Leader accounts can be switched between „vedoucí“ and „správce“ here too. The admin can't change their own role or access, but can link their own account to skautIS.
4. **Contacts (kontakty)** — the list shown to parents in „Vedoucí“, stored as its own collection. Intro text as in the design; a group switch (vlčušky / skauti a skautky / ostatní, with counts) shows one group at a time in its order. A contact **linked to a person from skautIS** shows nickname, name, phone and e-mail read-only; a missing phone/e-mail shows „doplň telefon / e-mail ve skautISu“ in red (parents then just don't see it until skautIS is updated and synced); a leader no longer active in skautIS is flagged („rodiče ho nevidí“). The admin edits the **role** (pre-filled with the leader's `roleTitle` from skautIS, can be overwritten — „ve skautISu: … · vrátit“; the same text or an emptied field means no override), the **group** (moving a contact puts it at the end of the other group), the **photo** and the **order** (↑ výš / ↓ níž within the group); „odebrat kontakt“. „+ přidat kontakt“ picks an active skautIS leader not yet in the shown group (one person can be in several groups). In „ostatní“ also **„+ ruční kontakt“** — someone outside the import (e.g. people of the středisko): nickname, name, phone, e-mail (a name or nickname and a phone or e-mail required, `manualContactErrors`) and role, all editable. **Photo**: „nahrát / změnit fotku“ (JPEG / PNG / WebP, HEIC rejected as in §4.9) is cut from the middle to 3:4 and resized to 480×640 JPEG in the browser, shown at once; „odebrat fotku“. Everything, photos included, is saved with one „uložit kontakty“ („neuložené změny“ until then): new photos are uploaded to Storage `contacts/`, then all contacts are written in one batch (order = position in the list), then photos no contact uses any more are deleted.
5. **Packing list templates („šablony s sebou“)** — templates collapsed to name + items; open to edit the name and items (one per line, blank lines dropped; both required), „+ nová šablona“, „smazat šablonu“ with inline confirmation. Posters copy the items, so edits and deletes don't change existing posters.
6. **Waiting list (čekací listina)** — the annual reset (§4.6: explanation, last reset date, „Resetovat listinu na další rok“ → wizard, banner after it); the texts of the **renewal e-mail** (sent by the reset, must contain `{odkaz}`) and the **confirmation e-mail** (sent by `submitWaitlist` to everyone who signs up; `{dite}`); **waiting-list ages** (`settings/public`: warning age < limit, both whole years 1–25).
7. **E-mails (e-maily)** — two groups. **K akcím**: texts of the automated e-mails to parents (§6.5, `onEventUpdated`), each can be switched off („posílat tenhle e-mail“): **registration started** (`{dite}`, `{akce}`, `{termin}`, `{uzaverka}`, `{odkaz}` = the parent page) and **poster published** (`{dite}`, `{akce}`, `{termin}`, `{prihlasovani}` = a sentence with the deadline and link while registration is open, else the paragraph is left out, `{odkaz}` = the poster). Both must contain `{odkaz}`. **K účtům**: **account approved** (`accountApproved`, not switchable; `{deti}` = a sentence with the paired children, left out for leaders, `{odkaz}` = the parent or leader home, required); **parent invitation** (`parentInvitation`, not switchable; `{dite}` = the parent's children, `{odkaz}` = the login page, required); the admins' e-mail about a new account has a fixed text and is only mentioned.
   E-mail texts (tabs 6 and 7) share one form: subject, text (paragraphs separated by a blank line), the list of placeholders, live preview with sample values, „vrátit původní text“; stored in `settings/emails.{key}`.
8. **Settings (nastavení)** — the **camp requirement per troop** (`settings/app.campRequirements`): trips (0–30) and meeting % (0–100), each with a checkbox — an unticked part is not required (stored as `null`); the resulting text is shown per troop; one „uložit“.
9. **Meetings (schůzky)** — per troop: exactly two meeting weekdays (Mon–Fri) and the time from–to (default 17:00–19:00); **ranges without meetings** (holidays, school breaks; from–to, one day = from only; vlčušky / skauti a skautky / všichni) with an optional reason. Ranges that are over disappear from the list (ones added in this visit stay until saved) but stay in the data until the school year ends, because attendance still leaves their dates out; ranges of earlier school years are deleted when the tab opens. Single cancelled meetings are not entered here; leaders mark them in Attendance („schůzka nebyla“). Everything is saved with one „uložit“ („neuložené změny“ until then) into `settings/meetings`. Used by the public home (troop days and times), Attendance (weekdays, time, meeting dates — dates without meetings are left out), the leader home today card and the clubhouse automat (later). Changing a troop's weekdays must be followed by re-assigning children's `meetingDay`: the tab warns how many children have a day the troop no longer has and links to Children. Old attendance records stay on their weekday and still count for those children.
10. **Clubhouse (klubovna)** — later (clubhouse is mock-only in v1): the automat rules (how long before a meeting to heat, target and setback temperatures, drying between meetings, …) applied to the meetings and events, and the **full log** of automatic and manual changes (filterable by date).

**Reads/Writes:** `users`, `members`, `contacts` (+ Storage `contacts/`), `skautisPeople` (read), `packingTemplates`, `settings/*`; skautIS sync via Cloud Function.

### 4.9 Photos (`/vedouci/fotky`, `/vedouci/fotky/:albumId`)

Every leader manages all albums (like events).

**All albums** — „Fotky“, all albums by school year incl. hidden ones, as the cards of §3.1 with a status chip „zveřejněné“ / „skryté před rodiči“, followed live. „+ nové album“ (`?nove`) opens the form: **„Z které akce“** (optional — started, not cancelled events of this and the last school year, newest first; picking one fills in the title, troop and dates, still editable, and parents then find „fotky →“ at the event), **name**, **for whom** (vlčušky / skauti a skautky / všichni), **dates** (the calendar of §4.3), for several days also **„fotky rozdělit po dnech“** (on by default; off = one grid, same order). A new album starts **hidden**; after „založit album“ its page opens.

**Album** — header as in §3.3 plus the status; buttons **„+ nahrát fotky“**, **„zveřejnit album“ / „skrýt před rodiči“**, **„upravit“** (the form above). A hidden album with photos shows „Rodiče album zatím nevidí. Až bude kompletní, zveřejni ho.“

- **Upload** — pick files (multi-select, the whole album at once) or drop them anywhere on the page (overlay „pusť fotky sem“); an empty album shows a large drop area. Before uploading each file is checked (`photoFileProblem` in `functions/src/shared/photos.js`): JPEG / PNG / WebP up to 30 MB; **HEIC/HEIF is rejected** by type and by extension („Fotky ve formátu HEIC (iPhone) nejsou podporované. Exportujte je prosím jako JPEG.“; the picker accepts only JPEG/PNG/WebP, so iPhones convert on their own). Rejected files are listed with the reason. Below, collapsed „Jak se fotky v albu řadí?“ explains the order (§3.3): by the time taken, so photos of several people mix correctly; undated ones (edited, from WhatsApp / Messenger) last by file name — name them 01.jpg, 02.jpg… for an own order; a camera with a wrong clock needs the date fixed in the files before uploading; reordering an uploaded album isn't possible yet. Originals go straight to Storage (`uploadBytesResumable`), at most 3 at once, each retried up to 3× on failure; one progress bar for the batch („Nahrávám 12 / 88 · 40 % · nezavírej stránku“, „zastavit“), failed files listed with „zkusit znovu“. Leaving the page while uploading asks first. The client sets custom metadata `albumId`, `uploadedBy`, `originalFilename` and `contentDisposition: attachment` (the original downloads under its name).
- **Processing** — uploaded photos not yet processed: „Zpracovávám 5 fotek — objeví se tu samy.“ (the page follows the photos live). Failed photos (`status: error`) are listed with „smazat“ and advice to re-upload / save as JPEG.
- **Grid and lightbox** as §3.3. **Selection**: a circle on each tile (on hover, always in selection mode — „vybrat fotky“ / „hotovo“), shift-click selects a range, „vybrat celý den“ per day. A floating bar: „vybráno N“, **„nastavit jako titulní“** (one photo), **„smazat“** → „smazat N fotek i s originály? ano, smazat / ne“, × clears. The cover photo is marked „titulní“; without a chosen one the first processed photo is the cover.
- **„smazat celé album“** (bottom) → „Smazat album včetně všech fotek? Nejde to vrátit.“ → deletes it with all files; „jak album vidí rodiče →“.

**Reads:** `albums`, `albums/{id}/photos`, `events`. **Writes:** `albums` (not the count), Storage `originals/`; deleting via `deletePhotos` / `deleteAlbum`.

---

## 5. Firestore data model

Conventions: collection names in camelCase plural; points in time as `Timestamp`, calendar dates as `YYYY-MM-DD` strings — **all dates and „today“ are evaluated in the `Europe/Prague` time zone** (deadlines, meeting dates, school year); `troop` ∈ `"vlc" | "ss"`; `audience` ∈ `"vlc" | "ss" | "all"`; `weekday` ∈ `"mon" | "tue" | "wed" | "thu" | "fri"`.

### `users/{uid}`

| Field            | Type                                                     | Notes                                 |
| ---------------- | -------------------------------------------------------- | ------------------------------------- |
| `email`          | string                                                   |                                       |
| `displayName`    | string                                                   |                                       |
| `role`           | `"pending" \| "parent" \| "leader" \| "admin" \| "none"` | set by admin                          |
| `note`           | string \| null                                           | for the admin — who they are, which children; null after a first Google login until filled in |
| `personId`       | string?                                                  | leaders — `skautisPeople` id          |
| `createdAt`      | Timestamp                                                |                                       |
| `adminNotifiedAt` | Timestamp?                                              | set by `onUserWritten` after e-mailing the admins about the pending account |
| `approvalNotifiedAt` | Timestamp?                                           | set by `onUserWritten` after the approval e-mail |

Parent ↔ child pairing is stored **only** in `members.parentUids` (single source of truth); a parent's children are queried with `array-contains`.

### `members/{memberId}` — children, imported from skautIS

Document id = skautIS person id, so re-imports keep all references (attendance, pairing, sign-ups).

| Field             | Type       | Notes                                  |
| ----------------- | ---------- | -------------------------------------- |
| `skautisPersonId` | number     | source key                             |
| `firstName`       | string     |                                        |
| `lastName`        | string     |                                        |
| `nickname`        | string     |                                        |
| `troop`           | `troop`    |                                        |
| `birthDate`       | string `YYYY-MM-DD` |                                 |
| `meetingDay`      | `weekday` \| null | set manually in Administration  |
| `parentUids`      | string[]   | paired parent accounts (set by admin)  |
| `active`          | boolean    | false when no longer in skautIS        |
| `syncedAt`        | Timestamp  | last sync that wrote the record        |

#### `members/{memberId}/private/contacts` (leaders only)

`parents: { name, email, phone }[]` — parents' contacts from skautIS. Separate doc because Firestore can't hide individual fields from paired parents.

### `invitations/{email}` — parent invitations (§4.8 „děti bez účtu“)

Document id = the lower-case e-mail. `email`, `sentAt` (Timestamp, last sending), `sentBy` (admin uid). Written by `inviteParent` only; admins read.

### `skautisPeople/{personId}` — leaders (one record per person)

Document id = skautIS person id. **The single identity of a leader**: the account (`users.personId`), the contact card (`contacts.personId`) and event organizers (`events.organizerIds`) all point here.

| Field       | Type       | Source                                   |
| ----------- | ---------- | ---------------------------------------- |
| `name`      | string     | skautIS                                  |
| `nickname`  | string     | skautIS                                  |
| `phone`     | string?    | skautIS                                  |
| `email`     | string?    | skautIS                                  |
| `troop`     | `troop`?   | home troop (leader pages) — the sync sets the oddíl for a new leader and keeps it |
| `roleTitle` | string?    | e.g. „rádce Bobrů“ — not edited on the web (skautIS functions are not imported), so null for synced leaders; the contact's role title is set per contact |
| `active`    | boolean    | false when no longer in skautIS          |
| `syncedAt`  | Timestamp  |                                          |

Sync overwrites only the skautIS fields (name, nickname, phone, e-mail, `active`, `syncedAt`).

### `meetings/{troop_date}` (e.g. `vlc_2026-03-19`)

| Field        | Type      | Notes                                  |
| ------------ | --------- | -------------------------------------- |
| `troop`      | `troop`   |                                        |
| `date`       | string    | `YYYY-MM-DD`                           |
| `weekday`    | `weekday` |                                        |
| `cancelled`  | boolean   | „schůzka nebyla“ — excluded from stats |
| `presentIds` | string[]  | `members` ids present                  |
| `updatedBy`  | string    | uid                                    |
| `updatedAt`  | Timestamp |                                        |

### `events/{eventId}`

| Field                    | Type                                            | Notes                                     |
| ------------------------ | ----------------------------------------------- | ----------------------------------------- |
| `title`                  | string                                          |                                           |
| `audience`               | `audience`                                      |                                           |
| `organizerIds`           | string[]                                        | `skautisPeople` ids, first = main organizer |
| `startDate`, `endDate`   | string `YYYY-MM-DD`                             | same for one-day events                   |
| `price`                  | number?                                         | CZK, set in the poster editor             |
| `cancelled`              | boolean                                         | shown struck through                      |
| `deleted`                | boolean                                         | soft delete — hidden everywhere           |
| `registrationOpen`       | boolean                                         | „spustit přihlašování“                    |
| `registrationDeadline`   | string `YYYY-MM-DD`?                            | last day parents can sign up              |
| `registrationNotifiedAt` | Timestamp?                                      | set by `onEventUpdated` after the registration was announced (registration or poster e-mail) |
| `posterNotifiedAt`       | Timestamp?                                      | set by `onEventUpdated` after the poster e-mail |
| `posterStatus`           | `"none" \| "missing" \| "draft" \| "published"` | `none` = the camp                         |
| `createdBy`, `updatedAt` | string, Timestamp                               |                                           |

#### `events/{eventId}/poster/content`

Poster content in a separate doc so parents can read it **only when `posterStatus == "published"`** (rules check the parent event): `intro`, `destination`, `mapUrl`, `meetAtPamatnik` (`HH:mm`), `meetAtMainStation`, `meetElsewhere`, `returnAtMainStation`, `returnAtPamatnik`, `returnElsewhere`, `food`, `packingTemplateId`, `packingItems: string[]`.

#### `events/{eventId}/participants/{memberId}`

| Field        | Type            | Written by                          |
| ------------ | --------------- | ----------------------------------- |
| `signedUp`   | boolean         | parent (before deadline) or leader  |
| `signedUpBy` | string uid      | parent or leader                    |
| `signedUpAt` | Timestamp       | parent or leader                    |
| `attended`   | boolean \| null | leader                              |
| `paid`       | boolean         | leader                              |
| `amountPaid` | number?         | leader                              |

### `news/{newsId}`

`title`, `body`, `audience`, `linkLabel?`, `linkUrl?`, `important` (bool), `authorUid`, `authorName`, `publishedAt`, `withdrawn` (bool).

`authorUid` (= the writer), `authorName` and `publishedAt` (= server time) are set on create and never change.

### `contacts/{contactId}`

| Field             | Type                          | Source                     |
| ----------------- | ----------------------------- | -------------------------- |
| `personId`        | string?                       | `skautisPeople` id — nickname, name, phone, e-mail come from there; null = manual contact (group `other` only) |
| `group`           | `"vlc" \| "ss" \| "other"`    | admin                      |
| `roleTitle`       | string?                       | admin — overrides the person's `roleTitle`; null = from skautIS |
| `nickname`, `name`, `phone`, `email` | string?    | admin — manual contacts only |
| `photoUrl`        | string?                       | token download URL of the photo |
| `photoPath`       | string?                       | Storage `contacts/{contactId}/{fileId}.jpg` |
| `order`           | number                        | admin — position in the whole list |

What parents see is `contactCard` (`functions/src/shared/contacts.js`); contacts of inactive leaders are left out.

### `packingTemplates/{templateId}`

`name`, `items: string[]`.

### `albums/{albumId}` — §3.3, §4.9

| Field             | Type                          | Notes                                    |
| ----------------- | ----------------------------- | ---------------------------------------- |
| `title`           | string                        | ≤ 120 chars                              |
| `audience`        | `"vlc" \| "ss" \| "all"`      |                                          |
| `eventId`         | string?                       | the event the photos are from            |
| `startDate`, `endDate` | string `YYYY-MM-DD`      | one day: both the same                   |
| `published`       | boolean                       | parents see published albums only        |
| `groupByDay`      | boolean                       | group photos by day (missing = true)     |
| `photoCount`      | number                        | processed photos; kept by Cloud Functions |
| `coverPhotoId`, `coverUrl`, `coverColor` | string? | cover (thumbnail URL + dominant colour, for cards); first processed photo unless a leader picks one |
| `createdBy`, `createdAt` |                        | set once                                 |

#### `albums/{albumId}/photos/{photoId}` — written by `processPhoto` only

`status` (`"ready" | "error"`), `originalPath`, `previewPath`, `thumbPath`, `previewUrl`, `thumbUrl` (token download URLs — shown without signing in to Storage, protected by these documents' rules), `width`, `height` (after EXIF rotation), `dominantColor` (`#rrggbb`), `takenAt` (EXIF `DateTimeOriginal` as Prague time unless the photo has an offset; null when missing or implausible), `sortAt` (= `takenAt` ?? `uploadedAt`, the query order; the display order is `sortPhotos`, §3.3), `uploadedAt`, `uploadedBy`, `originalFilename`, `sizeBytes`, `error` (message when failed). The id is generated by the client before the upload.

### Storage (Firebase Storage, bucket in `europe-west3`)

```
originals/{albumId}/{photoId}.{jpg|png|webp}   uploaded by leaders, untouched (EXIF incl. GPS kept)
previews/{albumId}/{photoId}.jpg               long edge 2048 px, JPEG q82, metadata stripped
thumbs/{albumId}/{photoId}.jpg                 long edge 640 px, JPEG q75, metadata stripped
contacts/{contactId}/{fileId}.jpg              leader contact photos, 480×640 JPEG made in the browser
```

Rules in `storage.rules`: leaders may create originals in an existing album (JPEG/PNG/WebP, ≤ 30 MB, metadata `albumId` and `uploadedBy` matching); admins create (JPEG ≤ 2 MB) and delete contact photos; nothing else is writable by clients. Reading: leaders everything, parents files of published albums. Expected size ~13 GB per year (~2,300 photos).

### `waitlist/{entryId}`

Document id = first 24 hex chars of SHA-256 of `firstname|lastname|birthDate` (lower-cased, without diacritics) — `submitWaitlist` detects duplicates atomically by `create()` failing.

| Field             | Type                                                 | Notes                                  |
| ----------------- | ---------------------------------------------------- | -------------------------------------- |
| `firstName`       | string                                               |                                        |
| `lastName`        | string                                               |                                        |
| `gender`          | `"girl" \| "boy" \| "other"`                         |                                        |
| `birthDate`       | string `YYYY-MM-DD`                                  |                                        |
| `grade`           | number 0–10                                          | 0 = not in school, 10 = secondary      |
| `gradeSchoolYear` | number                                               | start year of the school year of `grade` |
| `parentName`      | string                                               |                                        |
| `email`           | string                                               |                                        |
| `phone`           | string                                               | normalised                             |
| `knowsSomeone`    | boolean                                              |                                        |
| `knowsWhom`       | string                                               |                                        |
| `firstSignedUpAt` | Timestamp                                            | never changes — determines order       |
| `status`          | `"active" \| "awaitingRenewal" \| "admitted"` |                                |
| `statusChangedAt` | Timestamp                                            |                                        |
| `renewalDates`    | Timestamp[]                                          | confirmed renewals („N×“)              |
| `renewalTokenHash`| string?                                              | SHA-256 (hex) of the random token in the renewal link; set on reset, cleared after use |
| `leaderNote`      | string                                               | team only                              |

### `waitlistResets/{resetId}`

`at`, `byUid`, `admittedCount`, `emailedCount`, `deletedCount` (unanswered entries from the previous reset), `recruitmentYear` (school year whose newcomers were chosen).

### `settings/public` (publicly readable)

`lastWaitlistReset: string YYYY-MM-DD`, `waitlistWarnAge` (12), `waitlistMaxAge` (15).

### `settings/app` (readable by logged-in users)

`campRequirements: { vlc: { trips, meetingPct }, ss: { trips, meetingPct } }` — number, or `null` = not required. Missing → `DEFAULT_CAMP_REQUIREMENTS` (4 trips, 60 %) in `functions/src/shared/attendance.js`.

### `settings/emails` (leaders only)

`waitlistRenewal`, `waitlistConfirmation`: `{ subject, body }`; `accountApproved`, `parentInvitation`: `{ subject, body }`; `registrationOpened`, `posterPublished`: `{ subject, body, enabled }`. Defaults and placeholders in `functions/src/shared/emails.js` (`EMAILS`).

### `settings/skautis` (admin only)

`lastSyncAt`, `lastSyncBy` (uid), set by `applySkautisSync`.

### `skautisSync/pending` (functions only)

The skautIS data loaded by `previewSkautisSync` (`loaded: { units, children, leaders, skipped }`, `createdBy`, `createdAt`), applied and deleted by `applySkautisSync` (refused after 1 hour). No client access.

### `settings/meetings` (publicly readable) — §4.8 Meetings

`vlc` / `ss`: `{ days: weekday[2], start: 'HH:mm', end: 'HH:mm' }`; `noMeetings: [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', troop: 'vlc' | 'ss' | 'all', reason: string }]` (inclusive ranges, `reason` may be empty). Missing → `DEFAULT_MEETING_SCHEDULE`. Public because the public home shows the days and times.

### Clubhouse

Mock only in v1 — no collections yet. Later: clubhouse rules (settings) and the log (a collection, one document per entry / batch).

### 5.1 Access rules (summary)

| Collection                  | Anonymous                  | Pending          | Parent                                                   | Leader            | Admin |
| --------------------------- | -------------------------- | ---------------- | -------------------------------------------------------- | ----------------- | ----- |
| `settings/public`           | read                       | read             | read                                                     | read              | rw    |
| `settings/app`              | —                          | read             | read                                                     | read              | rw    |
| `settings/meetings`         | read                       | read             | read                                                     | read              | rw    |
| `settings/emails`           | —                          | —                | —                                                        | read              | rw    |
| `settings/skautis`          | —                          | —                | —                                                        | read              | rw    |
| `invitations`               | —                          | —                | —                                                        | —                 | read (writes: `inviteParent`) |
| `skautisSync`               | —                          | —                | —                                                        | —                 | — (functions only) |
| `skautisPeople`             | —                          | —                | read **[?]**                                             | read              | rw    |
| `members/*/private/*`       | —                          | —                | —                                                        | read              | rw    |
| `waitlist`                  | — (via `submitWaitlist`)   | —                | —                                                        | rw                | rw    |
| `waitlistResets`            | —                          | —                | —                                                        | read              | read  |
| `users/{uid}`               | —                          | own: create/read, update `note`/`displayName` | own: read                   | read all          | rw    |
| `members`                   | —                          | —                | read own children (`uid in parentUids`)                  | read              | rw    |
| `meetings`                  | —                          | —                | read                                                     | rw                | rw    |
| `events`                    | —                          | —                | read (not deleted)                                       | rw                | rw    |
| `events/*/poster/content`   | —                          | —                | read if published                                        | rw                | rw    |
| `…/participants`            | —                          | —                | read own; write sign-up fields for own children before deadline | rw         | rw    |
| `news`, `contacts`, `packingTemplates` | — | —                      | read                                                     | read (news: rw)   | rw    |
| `albums`                    | —                          | —                | read published                                           | rw (not `photoCount`; no delete) | same |
| `albums/*/photos`           | —                          | —                | read (album published)                                   | read              | read  |
| Storage `originals/`        | —                          | —                | read (album published)                                   | read, create      | same  |
| Storage `previews/`, `thumbs/` | —                       | —                | read (album published)                                   | read              | read  |
| Storage `contacts/`         | —                          | —                | read                                                     | read              | read, create, delete |

- Parents must not change their own `role`; pairing (`members.parentUids`) is written only by admins.
- `skautisPeople` is readable by parents because contacts and organizers show leaders' names and phones. **[?]** Acceptable, given it contains only leaders of the two troops?
- Renewal by token, reset, skautIS sync and all e-mails run in Cloud Functions with admin privileges.
- Parents may read `meetings` (needed for their children's attendance). This technically exposes `presentIds` of other children (ids only, no names) — accepted. The UI never shows parents anything about other children.

---

## 6. Business rules

### 6.1 School and recruitment years

- A school year „2026/27“ starts in September 2026.
- `doneYear` = if `lastWaitlistReset` is in July or later → its year, else year − 1.
- `nextYear` = max(`doneYear` + 1, current school year where Sept+ counts as the next year).
- Displayed as `YYYY/YY` (e.g. „2026/27“).

### 6.2 Suggested grade

`grade = schoolYearStart − (birthYear + (birthMonth ≥ 9 ? 1 : 0)) − 5`, clamped to 0–10.

### 6.3 Attendance

- Meeting %: present / **recorded** meetings (cancelled and unrecorded excluded) **on the child's meeting day**, within the current school year. A meeting counts only if a `meetings` doc exists and is not cancelled.
- Trips: count of events **that had registration enabled**, except the camp (event without poster), with `attended = true`, in the current school year. The Attendance → trips tab lists the same events.
- Camp requirement (per troop, §4.8 Settings) met when every required part holds: trips ≥ `trips`, meeting % ≥ `meetingPct`. A part that isn't required is never red and is left out of the text; with nothing required the pages say the troop has no camp requirement.

### 6.4 Relevance of events and news for a parent

Relevant if `audience == "all"` or `audience` is one of the troops of the parent's children. A child can be signed up only if `audience == "all"` or equals the child's troop.

### 6.5 Event registration

- Parents can sign up / off while `registrationOpen` and today ≤ `registrationDeadline`.
- After the deadline only leaders can change sign-ups.
- Starting registration triggers one e-mail to parents of all eligible children (parent accounts + skautIS parent contacts, deduplicated; one e-mail per address naming their children). Publishing the poster for the first time triggers the poster e-mail, which reminds of a running registration; when both happen in one change only the poster e-mail goes out. Each is sent at most once per event, not for cancelled, deleted or past events, and not when switched off in Administration.

---

## 7. Backend (Cloud Functions)

Firebase Blaze plan with Cloud Functions (region `europe-west3`, code in `functions/`). Validation rules are shared with the web form (`functions/src/shared/`). Functions:

| Function                    | Trigger                         | Purpose                                                  |
| --------------------------- | ------------------------------- | -------------------------------------------------------- |
| `submitWaitlist`            | callable (public, App Check)    | validate, dedupe, create entry, confirmation e-mail      |
| `resetWaitlist`             | callable (admin)                | archive entries, create tokens, send renewal e-mails, log |
| `getRenewal` / `confirmRenewal` / `withdrawRenewal` | callable (public) | load entry by token (null if unknown/used), save questionnaire and reactivate, delete entry |
| `onUserWritten`             | Firestore write `users`         | e-mail to admins: a pending account with its note awaits approval; e-mail to the user on the first approval |
| `deleteAccount`             | callable (admin)                | delete an account with role `none`: Auth account, profile, pairings |
| `inviteParent`              | callable (admin)                | informative invitation e-mail to a parent e-mail from skautIS (link to the login page), remembered in `invitations` |
| `onEventUpdated`            | Firestore update `events`       | e-mail parents that sign-up is open / the poster is out (§6.5) |
| `previewSkautisSync`        | callable (admin)                | with the skautIS login token: load both troops from the skautIS API (SOAP, `functions/src/skautis/`), keep them in `skautisSync/pending`, return what would change (§4.8 skautIS). In the emulator the token `fixture` reads test data instead |
| `applySkautisSync`          | callable (admin)                | write the previewed sync to `members` (+ `private/contacts`) and `skautisPeople`, set `settings/skautis.lastSyncAt` |
| `processPhoto`              | Storage object finalized (`originals/` only) | EXIF rotation, preview + thumbnail (sharp), size, dominant colour, `takenAt`; writes the photo doc, raises `photoCount`, first cover; failures → `status: error`. 1 GiB, 120 s, ≤ 10 instances |
| `deletePhotos`              | callable (leader)               | delete photo docs + files, lower the count, move the cover |
| `deleteAlbum`               | callable (leader)               | delete the album, its photos and all its files           |

E-mails are sent from `zare@skaut.cz` via **SMTP of the skaut.cz Google Workspace** (e.g. Nodemailer in Cloud Functions; credentials in Functions secrets, never in the repo). Gmail limit (~2000 recipients/day) is sufficient.

---

## 8. Non-functional requirements

- **Prerendering:** public pages (`/`, `/cekaci-listina`) are prerendered to static HTML at build time for search engines (e.g. `vite-ssg`); the rest of the app is a client-side SPA. **Deferred to just before production** (decided 2026-09-27, the public pages are still changing); until then public-page code should touch `window` / `document` only after mounting, so it can later render at build time.
- **Language:** UI in Czech; code, data and docs in English.
- **Responsiveness:** usable from 360 px width (see `CLAUDE.md`).

---

## Open questions

1. **skautIS API** — solved (§4.8 skautIS): the sync was built against the test app; the production app for `https://zare.skauting.cz/` with the login URL `/skautis/prihlaseni.php` was approved on 2026-10-02 and replaced the test app (its id is in `functions/src/shared/skautis.js`; development uses the emulator fixture tokens). Before production: upload the relay with the web and check the admin has a role that sees both oddíly. skautIS support (2026-09-30) allows the **basic package** of functions, which has everything the sync calls except `PersonParentAll`; the web goes live with it. **Later:** ask for `PersonParentAll` (approval of the app by skautIS support, a queue) to get parents' contacts back — the sync picks them up with no change.
2. **Photos** — solved: albums in Firebase Storage (§3.3, §4.9). Before production: create the default bucket in `europe-west3` (same region as the functions; the Blaze plan is needed) and set a budget alert in Google Cloud Billing (e.g. 100 CZK). Later: HEIC conversion, downloading a whole album (ZIP), reordering photos of an uploaded album by hand (drag & drop; an own order would override the date / file name order).
3. **Administration extras** — children & meeting days, meetings, packing templates, e-mail texts and settings have no design; built in the visual language of `Zare - sprava`, to be reviewed.
4. **Registration texts** — proposed labels in §3.1 and §4.3 need review.
5. **Parent contacts from skautIS** — may leaders (not only admins) see them, e.g. in attendance?
6. **Contacts less tied to skautIS (TODO)** — now a contact is linked to a skautIS leader (name, phone, e-mail read-only; only the role title can be overwritten) and manual contacts are allowed only in „ostatní“ (§4.8 Contacts). Possibly loosen this later, e.g. overriding phone / e-mail / name per contact, or manual contacts in every group.
