# zareweb — Functional Specification

> Status: **draft**, derived from `design-reference/web_skautskeho_oddilu/*.dc.html`, the design handoff notes `design-reference/README.md`, `design-reference/README-cekaci-listina.md`, and decisions of the project owner.
> Items marked **[?]** are guesses or gaps and need confirmation — see [Open questions](#open-questions).

## 1. Overview

Website of the scout group **Záře** (Dejvice, Prague), part of Junák – český skaut, středisko Šipka Praha. The group consists of two troops:

| Code  | Troop                           | Age   | Meeting days (17:00–19:00) |
| ----- | ------------------------------- | ----- | -------------------------- |
| `vlc` | 220. oddíl **Vlčušky**          | 7–11  | Monday, Thursday           |
| `ss`  | 222. oddíl **Skauti a skautky** | 12–15 | Tuesday, Wednesday         |

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

Not in scope: `Zare - cesta responzivne` — design study of the hand-drawn trail on mobile; visual reference for page 1 only.
Password reset uses Firebase's default hosted page.

---

## 2. Public pages

### 2.1 Public home (`/`)

Mostly static content. Sections (anchor nav in header): Kdo jsme, Oddíly, Co děláme, (Proč skauting), Jak to chodí, Klubovna, Tábor, Pro rodiče (FAQ), link „pro členy“ → login.

Decorative: a hand-drawn trail connecting drawings along the page, opening and closing verse. Recommended mobile variant is **M2** from the design study (trail winds across the full width, drawings alternate left/right).

**Dynamic content**

- „Chcete se přidat?“ block: *„Nováčky na školní rok {doneYear} už máme nabrané. Nové zápisy zařadíme do výběru na rok {nextYear}.“* — see §6.1.
- Buttons: „Zapsat na čekací listinu“ → page 2; „…nebo najít jiný oddíl“ → `https://skautskyoddil.cz`.
- FAQ: accordion, one item open at a time. Content static (6 Q&A in the design).

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
4. **Waiting for approval** — shown to any logged-in `pending` user. Status steps: account created ✓, note written ✓ / …, approval by the admin … . Shows the saved note with „upravit poznámku“; a Google user who has no note yet fills it in here (required). No contacts — the user is not expected to write to anyone; the admin gets in touch if needed. The page follows the profile live and moves on as soon as the account is approved. Button „odhlásit se“.
5. **No access** — a logged-in user with role `none`: short message with `zare@skaut.cz` in case of a mistake, „odhlásit se“.

**After login, redirect by role:** admin/leader → `/vedouci`, parent → `/clenove`, pending → waiting screen, none → no-access screen. Protected pages send signed-out users to `/prihlaseni?next=…` and back after login; a user whose role doesn't fit is sent to their home (or the status screen). A role change takes effect live on open pages.

**Approval flow:** a new pending account triggers an e-mail to the admins (Cloud Function `onUserCreated`). In Administration (§4.8, „účty a párování“) the admin sees the note and suggested children (parent e-mail matches skautIS) and either approves (pairs children → role `parent`, or sets a leader role), sends a query to an unknown account („nevíme, komu účet patří, ozvěte se“), or rejects it (role `none`). A `none` account can later be reactivated or deleted. When the admin approves, a Cloud Function e-mails the user.

**Reads:** own `users/{uid}`. **Writes:** Auth account; `users/{uid}` (create on registration / first Google login).

---

## 3. Parent area

Common header: „Skautský oddíl Záře — pro členy“, the user's e-mail, „odhlásit“. Footer with link to the public site (not on the poster page).

### 3.1 Parent home (`/clenove`)

1. **Greeting** — „Ahoj!“, today's date, nearest upcoming relevant event (name + date).
2. **Children cards** — one per paired child: nickname, troop tag, full name, meeting day, attendance % at meetings, number of trips attended (current school year). Below: camp requirement *„na tábor je potřeba {campMinTrips} výpravy a {campMinMeetingPct} % schůzek“*.
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
   - „proběhlo“ lists past events of the current school year, newest first; each child who could join shows ✓/✗ attendance, only for trips (events with registration, not the camp).
6. **Photos (Fotky)** — 4 latest albums (cover, title, detail like „únor · 31 fotek“), each linking to the group's Zonerama; link „všechna alba →“. **[?] Data source still open** — Zonerama most likely has no API; solution to be decided. Until then the section shows four empty album frames linking to the gallery.
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

---

## 4. Leader area

Common header: „Skautský oddíl Záře · pro vedoucí“, nav (Domů, Docházka, Akce, Aktuality, Klubovna), „náhled pro rodiče“, user's e-mail, logout. Each subpage has „← zpět na vedoucovskou stránku“.

### 4.1 Leader home (`/vedouci`)

1. **Greeting** — „Ahoj, {nickname}!“, role title + troop, today's date.
2. **Tools** — links to Docházka, Akce a plakátky, Aktuality, Klubovna, Čekací listina; **Administrace** only for admin.
3. **Today card** (based on the leader's troop and today's date):
   - today is a meeting day of the leader's troop → „schůzka v klubovně, 17–19 h“ + „zapsat docházku →“ (opens that meeting);
   - today is the first day of a trip for the troop (or `all`) → „první den výpravy — {name}“ + „zapsat účast a platby →“;
   - the other troop meets today → „dneska má schůzku druhý oddíl…“;
   - otherwise → „dneska není schůzka ani výprava — klidný den“, link „zapsat jiný termín →“.
4. **Nearest events** — upcoming events with registration: date, tag, title, organizer, **signed up / eligible** count with a progress bar, poster link („plakátek“ or „vyplnit plakátek“ → editor), link „jmenný seznam a platby →“ (attendance → trips tab). Link „přidat akci nebo plakátek →“.
5. **Troop attendance summary** — for the leader's troop: each child with meeting % and trips count; children not meeting the camp requirement highlighted red.

**Reads:** own `users/{uid}`, `members`, `meetings`, `events` + `participants`, `settings/app`.

### 4.2 Attendance (`/vedouci/dochazka`)

Troop switch: „vlčušky“ / „skauti a skautky“. Three tabs:

**Meetings (schůzky)**

- Choose weekday (the troop's two meeting days), then a date from the list of past meeting dates (newest first, horizontally scrollable; cancelled dates marked „×“).
- Header: „Schůzka {den} {datum}“, troop tag, „přišlo X z Y“.
- Grid of children **whose meeting day is the selected weekday** (nickname + name) — click toggles present. Buttons „přišli všichni“, „zrušit výběr“, „schůzka nebyla“.
- „Schůzka nebyla“ marks the meeting cancelled: it does not count towards anyone's attendance nor the number of meetings. Can be undone („schůzka přece byla“).
- **Autosave** („ukládá se samo“). A meeting is **recorded** once its attendance is saved (or it is marked „schůzka nebyla“).
- Past meeting dates that have not been recorded are flagged („nezapsáno“) so the leader can catch up; they don't count towards attendance until recorded.

**Trips (výpravy)**

- List of the troop's trips (troop + `all`), horizontally scrollable, newest first.
- Header: title, tag, date, price; summary „přijelo X · zaplaceno Y z přihlášených Z“ and **cash the leader should have in hand** = sum of amounts of children marked paid.
- **Signed up** children: „přijel“ / „nepřijel“, „zaplaceno“ / „nezaplaceno“ toggle, amount (pre-filled with the event price, editable per child when someone pays a different amount, e.g. at the meeting point).
- **Not signed up** („kdyby někdo přišel“): „přijel“, payment toggle, amount.
- Autosave.

**Overview (přehled dětí)**

- For each child: meeting %, trips count (each red if below the camp requirement), and a row of dots per held meeting of the child's day — filled = present, empty = absent, hatched = meeting cancelled; tooltip with date and state.

**Reads:** `members`, `meetings`, `events` + `participants`, `settings/app`.
**Writes:** `meetings` (presence, cancelled flag), `events/{id}/participants` (attended, paid, amount).

### 4.3 Events & posters (`/vedouci/akce`)

Left: button „+ přidat akci“, list of planned events (date, tag, title, organizer, status chips). Poster status:

| Status      | Label               |
| ----------- | ------------------- |
| `published` | plakátek zveřejněný |
| `draft`     | plakátek rozepsaný  |
| `missing`   | plakátek chybí      |
| `none`      | bez plakátku        |
| (cancelled) | akce zrušená        |

Plus a registration chip (proposed labels): „přihlašování nespuštěné“ / „přihlašování do 12. 3.“ / „přihlašování skončilo“.

**Add / edit event** form:

- Title, audience (vlčušky / skauti a skautky / všichni), organizers (one or more leaders picked from `skautisPeople`; the first is the main organizer — optional for events without poster), checkbox „akce bez plakátku (např. tábor)“.
- **Event without poster = the camp**: shown only in the calendar (výpravník); no registration, attendance or payments on the web — information goes to parents by e-mail, no single organizer.
- Date: month calendar; click first day, then last day for multi-day events.
- „přidat akci“ / „uložit změny“, „zrušit“.
- New event gets poster status `missing` (or `none` if without poster).

**Selected event — detail:**

- Actions: „upravit údaje akce“, „zrušit akci“ / „obnovit akci“ (cancelled events are shown struck through to parents), „smazat akci“ (soft delete — sign-ups and payments are kept, the event disappears everywhere).
- **Registration** (analogous to publishing the poster): checkbox „spustit přihlašování“ + deadline date. When registration is started, a Cloud Function e-mails the parents of eligible children that sign-up is open — **all known parent e-mails**: parent accounts paired to the child **and** parent contacts from skautIS, deduplicated. After the deadline parents can't sign up (§3.1); leaders can still sign children up or off at any time **in the event detail**: list of eligible children with signed-up / not-signed-up toggles (no design).
- **Poster editor:** intro text; destination; map URL; meeting time at Památník, at Hlavní nádraží (Hlavák), meeting elsewhere (text); return time at Hlavák, at Památník, return elsewhere (text); **price** (number in CZK — entered when the poster is created, which may be after registration opened; shown as „Peněz“ on the poster and used as the default amount on Attendance → trips); food.
- Packing list: choose a template („Věci na výpravu do chaty“, „…jednodenní výpravu“, „…pod celtou“, „bez hotového seznamu“) → items copied into the event, then remove (×) or add (Enter). Templates are managed in Administration.
- „uložit“ + checkbox „zveřejnit plakátek rodičům“: `draft` (parents don't see) or `published` (parents see immediately). Link „náhled plakátku“.

**Reads:** `events`, `packingTemplates`, `members` (eligible count). **Writes:** `events`, `events/{id}/participants`.

### 4.4 News (`/vedouci/aktuality`)

- Form „Napsat rodičům“: title, text, audience (všem rodičům / jen vlčuškám / jen skautům a skautkám), optional link (label + URL), checkbox „označit jako důležité“. Button „zveřejnit“ → published immediately, author = current leader, date = now.
- List of published news (date, tag, author, title; important ones highlighted) with „upravit“ (loads into the form) and „stáhnout“ (withdraw — sets `withdrawn`, parents no longer see it).

**Reads:** `news`. **Writes:** `news` (create, update).

### 4.5 Clubhouse (`/vedouci/klubovna`)

**First version: UI only with mock data**, no hardware integration. The data layer goes through a service in `src/services/` so it can later be connected to real devices.

- Readings: temperature, humidity (highlighted when > 60 %).
- Mode: **automat** (devices follow a schedule derived from meetings and the event calendar; controls read-only) or **manuál** for 2 / 4 / 8 / 12 / 24 h (controls enabled; remaining time shown; „vrátit na automat“). After manual mode expires, the schedule takes over.
- Devices: air-conditioning/heating (on/off, target 8–26 °C, state „topí“ / „drží teplotu“ / „vypnutá“), fans, dehumidifier, boiler (on/off, state „běží“ / „stojí“).
- „Podle rozvrhu“ — upcoming scheduled actions (schedule edited in Administration — later).
- „Log“ — history of automatic and manual changes. Contact to the technician (Quido).

### 4.6 Waiting list management (`/vedouci/cekaci-listina`)

Shows only `active` entries (archived ones are hidden, see reset below).

**Stats row:** number of waiting children (+ how many are new since last reset), girls / boys (+ other) with a ratio bar, average age, youngest (age + name), longest waiting (duration + name + date).

**Filters:** gender chips (všichni / holky / kluci / jiné), age bucket (≤ 6, 7–9, 10–11, 12+), grade in the upcoming school year, „jen s poznámkou (N)“. Counter „zobrazeno X z Y“, „zrušit filtry“.

**Table** (sortable by signed-up date, age, grade — repeated click reverses direction, secondary sort by sign-up date; default oldest first). Text does not wrap. Columns: signed-up date (`M/YYYY`, full date in tooltip), waiting time (+ bar relative to the longest-waiting entry, + badge „N×“ = number of confirmed renewals, explained in tooltip), child name (dot coloured by gender, note icon), age („X let Y měs.“) + birth date, grade (`5.` / `✕` / `SŠ`, full text + school year in tooltip), „zná někoho“ (truncated, full in tooltip), parent name. Rows with a note have a gold inset border.

**Row detail** (click to expand): whom they know, parent e-mail (mailto) and phone (tel), **leaders' note** (visible only to the team; add / edit), „Smazat zápis“ with inline confirmation (irreversible).

**Export:** „Stáhnout CSV“ of the currently filtered rows. Columns: Zapsáno, Jméno dítěte, Pohlaví, Datum narození, Věk, Třída, Zná někoho, Rodič, E-mail, Telefon, Obnoveno, Poznámka. `;` separator, UTF-8 with BOM, file name `cekaci-listina-YYYY-MM-DD.csv`.

**Annual reset wizard** („Resetovat listinu na další rok“, shows date of last reset). Done once a year after new members are chosen:

1. *How it works* — explanation.
2. *Admitted children* — list sorted by sign-up date, search by name ignoring diacritics; leader ticks the children admitted this year. Admitted children get no e-mail.
3. *E-mail to parents* — preview (From: „Skautský oddíl Záře <zare@skaut.cz>“, Subject: „Máte stále zájem o náš oddíl?“, child's name filled in, renewal link). Text editable only in Administration. Counts: e-mails / admitted. „Odeslat N e-mailů“ → confirmation „Opravdu…? Tohle nejde vzít zpět.“
4. *Sending* — progress bar „odesláno X z N“, then „Hotovo“.

Effect (entries are **archived, not deleted**, to keep the original sign-up date and the previous answers for the renewal questionnaire):

- Ticked children → status `admitted` (leave the list).
- All other active children → status `awaitingRenewal` (leave the list); each gets a renewal token and their parents get the e-mail. Confirming via §2.3 returns the entry to `active` at its original position.
- `settings/public.lastWaitlistReset` = today → public site shows the new recruitment years.
- A record is added to `waitlistResets` (reset log).
- Banner with the reset date and number of e-mails sent.

**Retention (GDPR):** entries still `awaitingRenewal` at the next reset are deleted (the parent did not respond for a whole year); `admitted` entries are deleted **manually** by a leader once the child is registered in skautIS (filter „nabraní“ on this page with a delete action — no design).

**Reads:** `waitlist`, `waitlistResets`, `settings/public`. **Writes:** `waitlist` (note, delete), reset via Cloud Function (statuses, tokens, e-mails, `settings/public`, `waitlistResets`).

### 4.7 Parent preview (`/vedouci/nahled`)

„Náhled pro rodiče“: the leader picks any child and sees the parent home (§3.1) exactly as that child's parent would, **read-only** (sign-up toggles disabled).

### 4.8 Administration („Administrace“, `/vedouci/administrace`, admin only)

Tabs:

1. **skautIS** — „Synchronizovat ze skautISu“: the admin logs in to skautIS; a Cloud Function loads via the skautIS API: **children** of both troops (first name, last name, nickname, troop, date of birth), **their parents' contacts** (name, e-mail, phone) and **leaders** (name, nickname, phone, e-mail). People from the středisko are not imported. Shows a diff (new / changed / left) to confirm before applying. Shows date of last sync. Run once a year and after changes. The skautIS login is used only for this sync — logging in to the web itself is always Google or e-mail + password.
2. **Children (děti)** — list of imported children by troop; the admin **clicks the meeting day** for each child (one of the troop's two days). Children without a meeting day are highlighted (they don't appear in any meeting's attendance). No design **[?]**.
3. **Accounts & pairing (účty a párování)** — accounts: e-mail, status („potvrzený“ / „čeká na potvrzení“ / „bez přístupu“), the note from registration, **suggested children** (active children whose parent e-mail in skautIS matches the account e-mail, or whom the note names — first + last name or nickname, ignoring case and diacritics), assigned children as chips (nickname + troop, × to unassign), „+ přiřadit dítě“ (pick from imported `members`). **A parent can have several children, and a child can belong to several parent accounts** (e.g. mother and father separately); any of them can sign the child up. Unassigned children are not visible to parents. Pending accounts: „schválit“, „poslat dotaz“ (e-mail asking an unknown account to get in touch) and „zamítnout“ (role `none`); `none` accounts: „znovu aktivovat“ (back to pending) or „smazat“ (Auth account + profile). Accounts are filtered by status (čekající / rodiče / vedoucí / bez přístupu, with counts; opens on čekající) and update live. Pairing a child with a pending account approves it as a parent in the same write; unpairing a parent's last child returns the account to pending; „odebrat přístup“ / „zamítnout“ sets `none` and unpairs all children. Leader accounts can be switched between „vedoucí“ and „správce“ here too. The admin can't change their own account. „Pozvat nový rodičovský účet“ **(not implemented yet)** — e-mail (can be picked from parent contacts in skautIS) → invitation e-mail.
4. **Leader roles (role vedoucích)** — each leader (from `skautisPeople`): nickname, name, e-mail; role „vedoucí“ / „správce“ / „bez přístupu“; **home troop** and **role title** (used on the leader home page and in contacts); linked web account (matched by e-mail, or pending accounts can be linked manually).
5. **Contacts (kontakty)** — the list shown to parents in „Vedoucí“, stored as its own collection. Each contact is **linked to a person from skautIS**: name, phone and e-mail come from skautIS and are read-only here; the admin edits only group (vlčušky / skauti a skautky / ostatní), photo and order. Contacts in the „ostatní“ group who are not in the import (e.g. středisko people) **[?]** — manual entry, or not shown. If the phone/e-mail is missing in skautIS, the contact shows a warning „doplň telefon ve skautISu“ and the phone isn't shown to parents until the leader updates skautIS and the next sync runs. „+ přidat kontakt“ (pick a skautIS person), „uložit kontakty“.
6. **Packing list templates** — CRUD of templates („s sebou“). No design.
7. **E-mail texts** — text of the waiting-list renewal e-mail (and other automated e-mails **[?]**). No design.
8. **Settings** — camp requirement, waiting-list age limits. No design **[?]**.
9. **Clubhouse schedule** — later (clubhouse is mock-only in v1).

**Reads/Writes:** `users`, `members`, `contacts`, `packingTemplates`, `settings/*`; skautIS sync via Cloud Function.

---

## 5. Firestore data model

Conventions: collection names in camelCase plural; points in time as `Timestamp`, calendar dates as `YYYY-MM-DD` strings — **all dates and „today“ are evaluated in the `Europe/Prague` time zone** (deadlines, meeting dates, school year); `troop` ∈ `"vlc" | "ss"`; `audience` ∈ `"vlc" | "ss" | "all"`; `weekday` ∈ `"mon" | "tue" | "wed" | "thu"`.

### `users/{uid}`

| Field            | Type                                                     | Notes                                 |
| ---------------- | -------------------------------------------------------- | ------------------------------------- |
| `email`          | string                                                   |                                       |
| `displayName`    | string                                                   |                                       |
| `role`           | `"pending" \| "parent" \| "leader" \| "admin" \| "none"` | set by admin                          |
| `note`           | string \| null                                           | for the admin — who they are, which children; null after a first Google login until filled in |
| `personId`       | string?                                                  | leaders — `skautisPeople` id          |
| `createdAt`      | Timestamp                                                |                                       |

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
| `syncedAt`        | Timestamp  |                                        |

#### `members/{memberId}/private/contacts` (leaders only)

`parents: { name, email, phone }[]` — parents' contacts from skautIS. Separate doc because Firestore can't hide individual fields from paired parents.

### `skautisPeople/{personId}` — leaders (one record per person)

Document id = skautIS person id. **The single identity of a leader**: the account (`users.personId`), the contact card (`contacts.personId`) and event organizers (`events.organizerIds`) all point here.

| Field       | Type       | Source                                   |
| ----------- | ---------- | ---------------------------------------- |
| `name`      | string     | skautIS                                  |
| `nickname`  | string     | skautIS                                  |
| `phone`     | string?    | skautIS                                  |
| `email`     | string?    | skautIS                                  |
| `troop`     | `troop`?   | admin — home troop (leader home page)    |
| `roleTitle` | string?    | admin — e.g. „rádce Bobrů“               |
| `active`    | boolean    | false when no longer in skautIS          |
| `syncedAt`  | Timestamp  |                                          |

Sync overwrites only the skautIS fields.

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
| `registrationNotifiedAt` | Timestamp?                                      | set by Cloud Function after e-mails sent  |
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

### `contacts/{contactId}`

| Field             | Type                          | Source                     |
| ----------------- | ----------------------------- | -------------------------- |
| `personId`        | string                        | `skautisPeople` id — name, nickname, phone, e-mail, role title come from there |
| `group`           | `"vlc" \| "ss" \| "other"`    | admin                      |
| `photoUrl`        | string?                       | admin                      |
| `order`           | number                        | admin                      |

### `packingTemplates/{templateId}`

`name`, `items: string[]`.

### `albums/{albumId}` **[?] depends on the chosen photo solution**

`title`, `detail` (e.g. photo count), `url`, `coverUrl`, `date`.

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

`at`, `byUid`, `admittedCount`, `emailedCount`, `recruitmentYear`.

### `settings/public` (publicly readable)

`lastWaitlistReset: string YYYY-MM-DD`, `waitlistWarnAge` (12), `waitlistMaxAge` (15).

### `settings/app` (readable by logged-in users)

`campMinTrips` (4), `campMinMeetingPct` (60).

### `settings/emails` (leaders only)

`waitlistRenewal: { subject, body }`, other templates **[?]**.

### `settings/skautis` (admin only)

`lastSyncAt`.

### Clubhouse

Mock only in v1 — no collections yet.

### 5.1 Access rules (summary)

| Collection                  | Anonymous                  | Pending          | Parent                                                   | Leader            | Admin |
| --------------------------- | -------------------------- | ---------------- | -------------------------------------------------------- | ----------------- | ----- |
| `settings/public`           | read                       | read             | read                                                     | read              | rw    |
| `settings/app`              | —                          | read             | read                                                     | read              | rw    |
| `settings/emails`           | —                          | —                | —                                                        | read              | rw    |
| `settings/skautis`          | —                          | —                | —                                                        | read              | rw    |
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
| `news`, `contacts`, `albums`, `packingTemplates` | — | —            | read                                                     | read (news: rw)   | rw    |

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
- Camp requirement met when trips ≥ `campMinTrips` **and** meeting % ≥ `campMinMeetingPct`.

### 6.4 Relevance of events and news for a parent

Relevant if `audience == "all"` or `audience` is one of the troops of the parent's children. A child can be signed up only if `audience == "all"` or equals the child's troop.

### 6.5 Event registration

- Parents can sign up / off while `registrationOpen` and today ≤ `registrationDeadline`.
- After the deadline only leaders can change sign-ups.
- Starting registration triggers one e-mail to parents of all eligible children (parent accounts + skautIS parent contacts, deduplicated).

---

## 7. Backend (Cloud Functions)

Firebase Blaze plan with Cloud Functions (region `europe-west3`, code in `functions/`). Validation rules are shared with the web form (`functions/src/shared/`). Functions:

| Function                    | Trigger                         | Purpose                                                  |
| --------------------------- | ------------------------------- | -------------------------------------------------------- |
| `submitWaitlist`            | callable (public, App Check)    | validate, dedupe, create entry, confirmation e-mail      |
| `resetWaitlist`             | callable (leader)               | archive entries, create tokens, send renewal e-mails, log |
| `getRenewal` / `confirmRenewal` / `withdrawRenewal` | callable (public) | load entry by token (null if unknown/used), save questionnaire and reactivate, delete entry |
| `onUserCreated`             | Firestore create `users`        | e-mail to admins: a new account awaits approval          |
| `onParentApproved`          | Firestore update `users`        | e-mail when the account is approved / a child is paired  |
| `queryAccount`              | callable (admin)                | e-mail to an unknown pending account asking who they are |
| `deleteAccount`             | callable (admin)                | delete an account with role `none`: Auth account, profile, pairings |
| `inviteParent`              | callable (admin)                | invitation e-mail                                        |
| `onRegistrationOpened`      | Firestore update `events`       | e-mail parents that sign-up is open                      |
| `syncSkautis`               | callable (admin)                | load members/leaders from skautIS API, return diff, apply |
| photos **[?]**              | —                               | depends on the chosen photo solution                     |

E-mails are sent from `zare@skaut.cz` via **SMTP of the skaut.cz Google Workspace** (e.g. Nodemailer in Cloud Functions; credentials in Functions secrets, never in the repo). Gmail limit (~2000 recipients/day) is sufficient.

---

## 8. Non-functional requirements

- **Prerendering:** public pages (`/`, `/cekaci-listina`) are prerendered to static HTML at build time for search engines (e.g. `vite-ssg`); the rest of the app is a client-side SPA. Affects project structure — set up from the start.
- **Language:** UI in Czech; code, data and docs in English.
- **Responsiveness:** usable from 360 px width (see `CLAUDE.md`).

---

## Open questions

1. **skautIS API** — the app needs to be registered with skautIS (application ID); verify the API exposes the needed fields (nickname, parents' contacts).
2. **Photos** — Zonerama most likely has no API; solution still open.
3. **Administration extras** — children & meeting days, packing templates, e-mail texts and settings have no design; left open.
4. **Registration texts** — proposed labels in §3.1 and §4.3 need review.
5. **Photo storage** — where to store leaders' photos for contacts (Firebase Storage?).
6. **Contacts outside skautIS import** — how to show středisko people in the „ostatní“ group?
7. **Parent contacts from skautIS** — may leaders (not only admins) see them, e.g. in attendance?
