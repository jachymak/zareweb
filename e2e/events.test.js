// Výpravník and trips (SPEC §4.3): list with status chips, creating an event
// and the camp, editing details, then on the trips page the poster from draft
// to published (and what a parent may read), unsaved-changes guard,
// registration and leaders' sign-ups (also after the deadline); back in the
// výpravník cancel / restore, soft delete; links, mobile widths. Accounts from `scripts/seed-users.js` (vedouci@ is Ondys 800001),
// children from `scripts/seed-members.js`, activity and packing templates from
// `scripts/seed-activity.js`.

import {
  SCREENSHOTS,
  APP_URL,
  clearAuthAccounts,
  clearCollection,
  FIRESTORE,
  fieldValue,
  horizontalOverflow,
  openPage,
  pragueToday,
  runScript,
  signInRest,
  fillDate,
} from './lib.js'
import { addDays, EVENTS, PACKING_TEMPLATES } from '../scripts/seed-activity.js'

const PASSWORD = 'heslo1234'
const today = pragueToday()
const dayLabel = (iso) => iso.split('-').map(Number).reverse().join('. ')
const formatDay = (iso) => `${Number(iso.slice(8))}. ${Number(iso.slice(5, 7))}.`

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function signIn(browser, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill('vedouci@zare.test')
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  return opened
}

async function openEvents(browser, query = '', options) {
  const opened = await signIn(browser, options)
  await opened.page.goto(`${APP_URL}/vedouci/vypravnik${query}`, { waitUntil: 'load' })
  await opened.page.getByRole('button', { name: '+ přidat akci' }).waitFor()
  return opened
}

async function openTrips(browser, query = '', options) {
  const opened = await signIn(browser, options)
  await opened.page.goto(`${APP_URL}/vedouci/vypravy${query}`, { waitUntil: 'load' })
  await opened.page.getByRole('heading', { name: 'Výpravy', level: 1 }).waitFor()
  await opened.page.getByText('načítám…').first().waitFor({ state: 'detached' })
  return opened
}

const owner = { Authorization: 'Bearer owner' }
async function getDoc(path, headers = owner) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers })
  return res.ok ? (await res.json()).fields : null
}
const values = (f) => (f?.arrayValue?.values ?? []).map(fieldValue)

// Clicks the date in the calendar, moving to the right month first.
async function pickDate(page, iso) {
  const day = page.getByRole('group', { name: 'Termín akce' }).getByRole('button', {
    name: dayLabel(iso),
    exact: true,
  })
  for (let i = 0; i < 3 && !(await day.count()); i++) {
    await page.getByRole('button', { name: 'další měsíc' }).click()
  }
  await day.click()
}

const eventButton = (page, title) =>
  page.getByRole('listitem').getByRole('button').filter({ hasText: title })
const tripButton = (page, title) =>
  page.getByRole('group', { name: 'Výprava' }).getByRole('button').filter({ hasText: title })

export default async function events({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')
  const leader = await signInRest('vedouci@zare.test', PASSWORD)
  const parent = await signInRest('rodic@zare.test', PASSWORD)

  const { ctx, page, errors } = await openEvents(browser)
  await page.screenshot({ path: `${SCREENSHOTS}events-list.png`, fullPage: true })

  // ---- list ----
  {
    const planned = EVENTS.filter((e) => !e.deleted && e.endDate >= today)
    check(
      `list: ${planned.length} planned events`,
      (await page.getByRole('listitem').count()) === planned.length,
      String(await page.getByRole('listitem').count()),
    )
    const stredohori = eventButton(page, 'Výprava do Středohoří')
    check(
      'list: poster and registration chips',
      (await stredohori.getByTestId('poster-chip').innerText()) === 'plakátek zveřejněný' &&
        (await stredohori.getByTestId('registration-chip').innerText()) ===
          `přihlašování do ${formatDay(EVENTS[0].registration)}`,
    )
    check(
      'list: cancelled event marked',
      (await eventButton(page, 'Jednodenní výprava na Okoř')
        .getByTestId('poster-chip')
        .innerText()) === 'akce zrušená',
    )
    check(
      'list: the camp has no registration chip',
      (await eventButton(page, 'Letní tábor').getByTestId('registration-chip').count()) === 0,
    )
    check('list: deleted event hidden', (await eventButton(page, 'Smazaná akce').count()) === 0)
    await page.getByRole('button', { name: /i proběhlé akce/ }).click()
    check('list: past events on request', await eventButton(page, 'Hry v Šárce').isVisible())
  }

  // ---- create ----
  const start = addDays(today, 20)
  const end = addDays(today, 21)
  let eventId
  {
    await page.getByRole('button', { name: '+ přidat akci' }).click()
    const form = page.getByRole('form', { name: 'Nová akce' })
    check(
      'create: the signed-in leader is the default organizer',
      (await form.getByRole('button', { name: 'Ondys' }).getAttribute('aria-pressed')) === 'true',
    )
    await form.getByRole('button', { name: 'Ondys' }).click()
    await form.getByRole('button', { name: 'přidat akci' }).click()
    check(
      'create: required fields reported',
      (await form.getByText('Napiš název akce.').isVisible()) &&
        (await form.getByText('Vyber aspoň jednoho organizátora.').isVisible()) &&
        (await form.getByText('Vyber termín v kalendáři.').isVisible()),
    )
    await form.getByLabel('Název akce').fill('Testovací výprava')
    await form.getByLabel('Pro koho').selectOption('vlc')
    await form.getByRole('button', { name: 'Nina' }).click()
    await form.getByRole('button', { name: 'Ondys' }).click()
    await pickDate(page, start)
    await pickDate(page, end)
    check(
      'create: term summary',
      (await form.getByTestId('term').innerText()).includes('(2 dny)'),
      await form.getByTestId('term').innerText(),
    )
    await form.getByRole('button', { name: 'přidat akci' }).click()
    await page.waitForURL(/akce=/)
    eventId = new URL(page.url()).searchParams.get('akce')
    const doc = await getDoc(`events/${eventId}`)
    check(
      'create: event saved with its fields',
      fieldValue(doc.title) === 'Testovací výprava' &&
        fieldValue(doc.audience) === 'vlc' &&
        values(doc.organizerIds).join() === '800002,800001' &&
        fieldValue(doc.startDate) === start &&
        fieldValue(doc.endDate) === end &&
        fieldValue(doc.posterStatus) === 'missing' &&
        fieldValue(doc.deleted) === false &&
        fieldValue(doc.registrationOpen) === false &&
        fieldValue(doc.createdBy) === leader.uid,
    )
    check(
      'create: detail opens, listed with „plakátek chybí“',
      (await page.getByRole('article', { name: 'Testovací výprava' }).isVisible()) &&
        (await eventButton(page, 'Testovací výprava').getByTestId('poster-chip').innerText()) ===
          'plakátek chybí',
    )
    check(
      'create: no poster editor in the výpravník',
      (await page.getByRole('form', { name: 'Plakátek' }).count()) === 0 &&
        (await page.getByRole('region', { name: 'Přihlašování' }).count()) === 0,
    )
  }

  // ---- edit details ----
  {
    await page.getByRole('button', { name: 'upravit údaje akce' }).click()
    const form = page.getByRole('form', { name: 'Upravit akci' })
    await form.getByLabel('Název akce').fill('Testovací výprava na Sněžku')
    await form.getByRole('button', { name: 'uložit změny' }).click()
    check(
      'edit: title saved',
      await until(
        async () =>
          fieldValue((await getDoc(`events/${eventId}`)).title) === 'Testovací výprava na Sněžku',
      ),
    )
  }

  // ---- poster: draft, then published (on the trips page) ----
  {
    await page.getByRole('link', { name: 'plakátek a přihlášky →' }).click()
    await page.waitForURL(/\/vedouci\/vypravy/)
    await page.getByRole('article', { name: 'Testovací výprava na Sněžku' }).waitFor()
    check(
      'trips: the výpravník link opens the event on the trips page',
      new URL(page.url()).searchParams.get('vyprava') === eventId &&
        (await page.getByRole('article', { name: 'Testovací výprava na Sněžku' }).isVisible()),
      page.url(),
    )
    const poster = page.getByRole('form', { name: 'Plakátek' })
    await poster.waitFor()
    await poster.getByLabel('Obecné informace o výpravě').fill('Vylezeme na <b>Sněžku</b>.')
    await poster.getByLabel('Kam se jede?').fill('Pec pod Sněžkou')
    await poster.getByLabel('Čas u Památníku').fill('07:30')
    await poster.getByLabel('Peněz (Kč)').fill('450')
    await poster
      .getByLabel('S sebou — začni hotovým seznamem')
      .selectOption({ label: PACKING_TEMPLATES.jednodenni.name })
    await poster.getByRole('button', { name: 'odebrat pláštěnka' }).click()
    await poster.getByLabel('Přidat věc').fill('píšťalka')
    await poster.getByLabel('Přidat věc').press('Enter')
    check(
      'poster: unsaved changes shown',
      (await poster.getByTestId('poster-state').innerText()) === 'neuložené změny',
    )

    // Switching trips asks first; dismissing keeps the edits.
    page.once('dialog', (d) => d.dismiss())
    await tripButton(page, 'Výprava do Středohoří').click()
    await page.waitForTimeout(300)
    check(
      'guard: dismissing the question stays on the trip',
      new URL(page.url()).searchParams.get('vyprava') === eventId &&
        (await poster.getByLabel('Kam se jede?').inputValue()) === 'Pec pod Sněžkou',
    )

    await poster.getByRole('button', { name: 'uložit' }).click()
    const path = `events/${eventId}`
    await until(async () => fieldValue((await getDoc(path)).posterStatus) === 'draft')
    const content = await getDoc(`${path}/poster/content`)
    const wantItems = PACKING_TEMPLATES.jednodenni.items
      .filter((i) => i !== 'pláštěnka')
      .concat('píšťalka')
    check(
      'poster: draft saved with content, price and items',
      fieldValue((await getDoc(path)).price) === '450' &&
        fieldValue(content.intro) === 'Vylezeme na <b>Sněžku</b>.' &&
        fieldValue(content.meetAtPamatnik) === '07:30' &&
        fieldValue(content.packingTemplateId) === 'seed-jednodenni' &&
        values(content.packingItems).join() === wantItems.join(),
    )
    const asParent = { Authorization: `Bearer ${parent.idToken}` }
    check(
      'poster: a parent cannot read the draft',
      (await getDoc(`${path}/poster/content`, asParent)) === null,
    )
    await poster.getByLabel('zveřejnit plakátek rodičům').check()
    check(
      'poster: says publishing e-mails the parents',
      (await poster.getByTestId('poster-note').textContent()).includes('odejde e-mail'),
    )
    await poster.getByRole('button', { name: 'uložit' }).click()
    check(
      'poster: published',
      await until(async () => fieldValue((await getDoc(path)).posterStatus) === 'published'),
    )
    check(
      'poster: a parent can read the published poster',
      (await getDoc(`${path}/poster/content`, asParent)) !== null,
    )
    await page.screenshot({ path: `${SCREENSHOTS}events-detail.png`, fullPage: true })
  }

  // ---- registration and leaders' sign-ups ----
  {
    const registration = page.getByRole('region', { name: 'Přihlašování' })
    await registration.getByLabel('spustit přihlašování').check()
    check(
      'registration: says saving e-mails the parents',
      (await registration.getByTestId('registration-email').textContent()).includes(
        'Po uložení odejde rodičům',
      ),
    )
    await fillDate(registration, 'přihlášky do', addDays(start, 1))
    await registration.getByRole('button', { name: 'uložit přihlašování' }).click()
    check(
      'registration: deadline after the start refused',
      await registration.getByText('Uzávěrka musí být nejpozději v den začátku akce.').isVisible(),
    )
    await fillDate(registration, 'přihlášky do', addDays(today, 10))
    await registration.getByRole('button', { name: 'uložit přihlašování' }).click()
    const path = `events/${eventId}`
    check(
      'registration: started in Firestore',
      await until(async () => {
        const doc = await getDoc(path)
        return (
          fieldValue(doc.registrationOpen) === true &&
          fieldValue(doc.registrationDeadline) === addDays(today, 10)
        )
      }),
    )
    const signups = page.getByRole('region', { name: 'Přihlášky a platby' })
    await signups.waitFor()
    const picker = signups.getByLabel('přihlásit dítě')
    check(
      'sign-up: vlc event offers only vlc children',
      (await picker.locator('option[value="900201"]').count()) === 0,
    )
    await picker.selectOption('900102')
    check(
      'sign-up: leader signs a child up',
      await until(async () => {
        const p = await getDoc(`${path}/participants/900102`)
        return fieldValue(p?.signedUp) === true && fieldValue(p?.signedUpBy) === leader.uid
      }),
    )
    check(
      'sign-up: listed with the summary',
      (await until(() => signups.getByRole('group', { name: 'Sojka' }).isVisible())) &&
        (await signups.getByTestId('trip-summary').innerText()).startsWith('přihlášeno 1'),
    )

    // After the deadline leaders still can — an ss trip, so the troop switches.
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'skauti a skautky' })
      .click()
    await tripButton(page, 'Uzlovací závody').click()
    await page
      .getByRole('region', { name: 'Přihlášky a platby' })
      .getByLabel('přihlásit dítě')
      .selectOption('900201')
    check(
      'sign-up: after the deadline too',
      await until(
        async () =>
          fieldValue((await getDoc('events/seed-uzly/participants/900201'))?.signedUp) === true,
      ),
    )
  }

  // ---- cancel, restore, delete (back in the výpravník) ----
  {
    await page.getByRole('link', { name: '← zpět na vedoucovskou stránku' }).click()
    await page.getByRole('link', { name: 'Výpravník', exact: true }).click()
    await page.getByRole('button', { name: '+ přidat akci' }).waitFor()
    await eventButton(page, 'Testovací výprava na Sněžku').click()
    const path = `events/${eventId}`
    await page.getByRole('button', { name: 'zrušit akci' }).click()
    check(
      'cancel: saved and marked',
      (await until(async () => fieldValue((await getDoc(path)).cancelled) === true)) &&
        (await until(
          async () =>
            (await eventButton(page, 'Testovací výprava na Sněžku')
              .getByTestId('poster-chip')
              .innerText()) === 'akce zrušená',
        )),
    )
    await page.getByRole('button', { name: 'obnovit akci' }).click()
    check(
      'restore: saved',
      await until(async () => fieldValue((await getDoc(path)).cancelled) === false),
    )
    await page.getByRole('button', { name: 'smazat akci' }).click()
    await page.getByRole('button', { name: 'opravdu smazat' }).click()
    check(
      'delete: soft delete, gone from the list',
      (await until(async () => fieldValue((await getDoc(path)).deleted) === true)) &&
        (await until(async () => !(await eventButton(page, 'Sněžku').count()))) &&
        !new URL(page.url()).searchParams.get('akce'),
    )
    check(
      'delete: sign-ups kept',
      fieldValue((await getDoc(`${path}/participants/900102`))?.signedUp) === true,
    )
  }

  // ---- the camp ----
  {
    await page.getByRole('button', { name: '+ přidat akci' }).click()
    const form = page.getByRole('form', { name: 'Nová akce' })
    await form.getByLabel('Název akce').fill('Testovací tábor')
    await form.getByRole('button', { name: 'Ondys' }).click() // no organizer needed
    await form.getByLabel('akce bez plakátku (např. tábor)').check()
    await pickDate(page, addDays(today, 40))
    await pickDate(page, addDays(today, 50))
    await form.getByRole('button', { name: 'přidat akci' }).click()
    await page.waitForURL(/akce=/)
    const id = new URL(page.url()).searchParams.get('akce')
    check(
      'camp: saved without poster and organizers',
      fieldValue((await getDoc(`events/${id}`)).posterStatus) === 'none' &&
        values((await getDoc(`events/${id}`)).organizerIds).length === 0,
    )
    check(
      'camp: no link to the trips page',
      (await page.getByRole('link', { name: 'plakátek a přihlášky →' }).count()) === 0,
    )
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- links: from the leader home („vyplnit plakátek“), the old address ----
  {
    const { ctx, page } = await openTrips(browser, '?vyprava=seed-kokorin')
    check(
      'link: ?vyprava opens the poster editor',
      await page
        .getByRole('article', { name: 'Podzimní výprava na Kokořín' })
        .getByRole('form', { name: 'Plakátek' })
        .isVisible(),
    )
    await page.goto(`${APP_URL}/vedouci/vypravy?vyprava=seed-blanik`, { waitUntil: 'load' })
    await page.getByRole('article', { name: 'Výprava na Blaník' }).waitFor()
    check(
      'link: a trip of the other troop switches the troop',
      new URL(page.url()).searchParams.get('oddil') === 'ss',
      page.url(),
    )
    await page.goto(`${APP_URL}/vedouci/akce?akce=seed-kokorin`, { waitUntil: 'load' })
    await page.getByRole('article', { name: 'Podzimní výprava na Kokořín' }).waitFor()
    check(
      'link: the old /vedouci/akce goes to the výpravník',
      new URL(page.url()).pathname === '/vedouci/vypravnik',
      page.url(),
    )
    await ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const problems = []
    for (const query of ['?akce=seed-stredohori', '?nova', 'vypravy?vyprava=seed-stredohori']) {
      const options = { width, height: 800, mobile: true }
      const { ctx, page, errors } = query.startsWith('vypravy')
        ? await openTrips(browser, query.slice(7), options)
        : await openEvents(browser, query, options)
      await page.waitForTimeout(500)
      const overflow = await horizontalOverflow(page)
      if (overflow > 0) problems.push(`${query}: overflow ${overflow}`)
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, input, select')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height < 24 && !el.closest('p')
          })
          .map((el) => el.textContent.trim() || el.name || el.type),
      )
      if (small.length) problems.push(`${query}: small ${small.join(', ')}`)
      if (errors.length) problems.push(`${query}: ${errors.join(' | ')}`)
      await page.screenshot({
        path: `${SCREENSHOTS}events-${width}${query.replace(/\W/g, '-')}.png`,
        fullPage: true,
      })
      await ctx.close()
    }
    check(
      `mobile ${width}: no overflow, tap targets, console errors`,
      !problems.length,
      problems.join('; '),
    )
  }

  runScript('seed-activity.js')
}
