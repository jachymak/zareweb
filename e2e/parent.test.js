// Parent home (SPEC §3.1): children's attendance, news, sign-up round trip,
// locked sign-up after the deadline, security rules, calendar, relevance by
// troop, leader contacts, mobile widths. Accounts from `scripts/seed-users.js`,
// children from `scripts/seed-members.js`, activity from `scripts/seed-activity.js`
// (rodic@ has Sojka 900102 in vlc and Bobr 900201 in ss).

import {
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  commitAs,
  fieldValue,
  FIRESTORE,
  horizontalOverflow,
  listDocs,
  openPage,
  patchDoc,
  pragueToday,
  runScript,
  signInRest,
} from './lib.js'
import { addDays, EVENTS } from '../scripts/seed-activity.js'
import { schoolYearRange } from '../functions/src/shared/schoolYear.js'

const PASSWORD = 'heslo1234'
const EMAIL = 'rodic@zare.test'
const today = pragueToday()
const { from: yearStart } = schoolYearRange(today)

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function openAsParent(browser, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/clenove$/, { timeout: 10000 })
  await page.getByRole('heading', { name: 'Výpravník' }).waitFor({ timeout: 10000 })
  return opened
}

const participant = async (eventId, memberId) => {
  const res = await fetch(`${FIRESTORE}/events/${eventId}/participants/${memberId}`, {
    headers: { Authorization: 'Bearer owner' },
  })
  return res.ok ? (await res.json()).fields : null
}

// Expected meeting % from the recorded meetings in Firestore (SPEC §6.3).
async function expectedPercent(memberId, troop, weekday) {
  const recorded = (await listDocs('meetings'))
    .map((d) => d.fields)
    .filter(
      (f) =>
        fieldValue(f.troop) === troop &&
        fieldValue(f.weekday) === weekday &&
        !fieldValue(f.cancelled) &&
        fieldValue(f.date) >= yearStart,
    )
  if (!recorded.length) return '—'
  const present = recorded.filter((f) =>
    (f.presentIds.arrayValue.values ?? []).some((v) => v.stringValue === memberId),
  ).length
  return `${Math.round((present * 100) / recorded.length)} %`
}

// Past trips of this school year the child attended, per the seed.
const expectedTrips = (memberId) =>
  EVENTS.filter(
    (e) =>
      e.registration &&
      e.startDate <= today &&
      e.startDate >= yearStart &&
      e.participants?.[memberId]?.attended === true,
  ).length

const eventCard = (page, title) => page.getByRole('article', { name: title })

export default async function parent({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  const { ctx, page, errors } = await openAsParent(browser)
  await page.screenshot({ path: `${SCREENSHOTS}parent-desktop.png`, fullPage: true })

  // ---- greeting and children ----
  {
    check(
      'greeting: nearest event is the first upcoming relevant one',
      (await page.getByTestId('nearest-event').innerText()).startsWith('Uzlovací závody'),
    )
    for (const [nick, id, troop, day] of [
      ['Sojka', '900102', 'vlc', 'thu'],
      ['Bobr', '900201', 'ss', 'tue'],
    ]) {
      const card = page.getByRole('article', { name: nick, exact: true })
      const percent = await card.getByTestId('attendance').innerText()
      const trips = await card.getByTestId('trips').innerText()
      const want = await expectedPercent(id, troop, day)
      check(`children: ${nick} attendance ${want}`, percent === want, percent)
      check(
        `children: ${nick} trips ${expectedTrips(id)}`,
        trips === String(expectedTrips(id)),
        trips,
      )
    }
    check(
      'children: camp requirement from settings/app',
      await page.getByText('na tábor je potřeba 4 výpravy a 60 % schůzek').isVisible(),
    )
  }

  // ---- news ----
  {
    const featured = await page.getByTestId('news-featured').innerText()
    check('news: important item pinned on top', featured.includes('Členské příspěvky'))
    check('news: withdrawn item hidden', (await page.getByText('Stažená zpráva').count()) === 0)
    const item = page.getByRole('button', { name: /Piknik s rodiči/ })
    await item.click()
    check(
      'news: accordion opens an item',
      (await item.getAttribute('aria-expanded')) === 'true' &&
        (await page.getByText('grilujeme a hrajeme').isVisible()),
    )
  }

  // ---- sign-up round trip ----
  {
    const kokorin = eventCard(page, 'Podzimní výprava na Kokořín')
    check(
      'sign-up: event for all shows both children',
      (await kokorin.getByRole('button', { name: 'Sojka' }).count()) === 1 &&
        (await kokorin.getByRole('button', { name: 'Bobr' }).count()) === 1,
    )
    const stredohori = eventCard(page, 'Výprava do Středohoří')
    check(
      'sign-up: vlc event shows only Sojka, already signed up',
      (await stredohori.getByRole('button').count()) === 1 &&
        (await stredohori.getByRole('button', { name: 'Sojka' }).getAttribute('aria-pressed')) ===
          'true',
    )
    check(
      'sign-up: poster link only for published poster',
      (await stredohori.getByRole('link', { name: 'plakátek' }).count()) === 1 &&
        (await kokorin.getByText('plakátek se chystá').count()) === 1,
    )

    const bobr = kokorin.getByRole('button', { name: 'Bobr' })
    await bobr.click()
    const uid = (await signInRest(EMAIL, PASSWORD)).uid
    const saved = await until(async () => {
      const f = await participant('seed-kokorin', '900201')
      return fieldValue(f?.signedUp) === true && fieldValue(f.signedUpBy) === uid
    })
    check('sign-up: Bobr signed up in Firestore by the parent', saved)
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Výpravník' }).waitFor()
    check(
      'sign-up: survives a reload',
      (await eventCard(page, 'Podzimní výprava na Kokořín')
        .getByRole('button', { name: 'Bobr' })
        .getAttribute('aria-pressed')) === 'true',
    )
    await eventCard(page, 'Podzimní výprava na Kokořín')
      .getByRole('button', { name: 'Bobr' })
      .click()
    check(
      'sign-up: signing off saves signedUp false',
      await until(
        async () => fieldValue((await participant('seed-kokorin', '900201'))?.signedUp) === false,
      ),
    )
  }

  // ---- after the deadline ----
  {
    const uzly = eventCard(page, 'Uzlovací závody')
    check(
      'deadline: shows „přihlašování skončilo“',
      (await uzly.getByTestId('deadline').innerText()) === 'přihlašování skončilo',
    )
    await uzly.getByRole('button', { name: 'Bobr' }).click()
    const notice = await uzly.getByText('Přihlašování už skončilo').innerText()
    check(
      'deadline: click explains whom to write to',
      notice.includes('Kuba') && notice.includes('+420 776 330 128'),
      notice,
    )
    await new Promise((r) => setTimeout(r, 500))
    check('deadline: nothing written', !(await participant('seed-uzly', '900201')))
  }

  // ---- security rules ----
  {
    const { idToken, uid } = await signInRest(EMAIL, PASSWORD)
    const signUp = (eventId, memberId) =>
      commitAs(idToken, [
        {
          update: {
            name: `${FIRESTORE.split('/v1/')[1]}/events/${eventId}/participants/${memberId}`,
            fields: { signedUp: { booleanValue: true }, signedUpBy: { stringValue: uid } },
          },
          updateTransforms: [{ fieldPath: 'signedUpAt', setToServerValue: 'REQUEST_TIME' }],
        },
      ])
    check(
      'rules: own child, open event → allowed',
      (await signUp('seed-kokorin', '900102')) === 200,
    )
    check('rules: other child → denied', (await signUp('seed-kokorin', '900103')) === 403)
    check('rules: after the deadline → denied', (await signUp('seed-uzly', '900201')) === 403)
    check('rules: wrong troop → denied', (await signUp('seed-stredohori', '900201')) === 403)
    const paid = await commitAs(idToken, [
      {
        update: {
          name: `${FIRESTORE.split('/v1/')[1]}/events/seed-kokorin/participants/900102`,
          fields: { paid: { booleanValue: true } },
        },
        updateMask: { fieldPaths: ['paid'] },
      },
    ])
    check('rules: parent cannot mark paid → denied', paid === 403)
  }

  // ---- calendar ----
  {
    const events = () => page.getByTestId('calendar-event').allInnerTexts()
    let rows = await events()
    check('calendar: deleted event hidden', !rows.some((r) => r.includes('Smazaná akce')))
    check(
      'calendar: cancelled event marked',
      rows.some((r) => r.includes('Jednodenní výprava na Okoř') && r.includes('zrušeno')),
    )
    check(
      'calendar: both troops → no „i akce druhého oddílu“ switch',
      (await page.getByRole('button', { name: 'i akce druhého oddílu' }).count()) === 0,
    )
    const months = await page.getByTestId('calendar-month').count()
    await page.getByRole('button', { name: 'zobrazit celý rok' }).click()
    rows = await events()
    check(
      'calendar: first two months, whole year expands to the camp',
      months === 2 && rows.some((r) => r.includes('Letní tábor')),
    )
    await page.getByRole('button', { name: 'proběhlo', exact: true }).click()
    rows = await events()
    const sarkaInYear = addDays(today, -5) >= yearStart
    check(
      'calendar: past trip shows ✓ for the child who came',
      !sarkaInYear || rows.some((r) => r.includes('Hry v Šárce') && r.includes('✓ Sojka')),
      rows.join(' | '),
    )
    const zahajovaciInYear = addDays(today, -12) >= yearStart
    check(
      'calendar: past trip shows ✗ for the child who did not come',
      !zahajovaciInYear ||
        rows.some((r) => r.includes('Zahajovací výprava') && r.includes('✗ Bobr')),
    )
    check(
      'calendar: past event without registration has no ✓/✗',
      rows.filter((r) => r.includes('Zahajovací odpoledne')).every((r) => !/[✓✗]/.test(r)),
    )
  }

  // ---- leaders ----
  {
    const text = await page.locator('section[aria-labelledby="leaders-title"]').innerText()
    check(
      'leaders: opens on the first child’s troop, missing phone not shown',
      text.includes('Ondys') && text.includes('Oskar') && !text.includes('Hobit'),
    )
    await page.getByRole('button', { name: 'skauti a skautky' }).click()
    check(
      'leaders: switching group',
      (await page.locator('section[aria-labelledby="leaders-title"]').innerText()).includes(
        'Hobit',
      ),
    )
  }

  // ---- poster link ----
  {
    await eventCard(page, 'Výprava do Středohoří').getByRole('link', { name: 'plakátek' }).click()
    await page.waitForURL(/\/clenove\/akce\/seed-stredohori$/)
    check('poster: link opens the poster route', true)
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- relevance: only a vlc child ----
  {
    await patchDoc('members/900201', { parentUids: { arrayValue: { values: [] } } })
    const { ctx, page } = await openAsParent(browser)
    check(
      'relevance: ss news hidden',
      (await page.getByText('Skautské zkoušky na podzim').count()) === 0,
    )
    const rows = () => page.getByTestId('calendar-event').allInnerTexts()
    const before = await rows()
    await page.getByRole('button', { name: 'i akce druhého oddílu' }).click()
    const after = await rows()
    check(
      'relevance: ss events only with „i akce druhého oddílu“',
      !before.some((r) => r.includes('Uzlovací závody')) &&
        after.some((r) => r.includes('Uzlovací závody')),
    )
    check(
      'relevance: ss event not open for sign-up',
      (await page.getByRole('article', { name: 'Uzlovací závody' }).count()) === 0,
    )
    await ctx.close()
    runScript('seed-members.js')
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openAsParent(browser, { width, height: 800, mobile: true })
    const overflow = await horizontalOverflow(page)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim() || el.name),
    )
    await page.screenshot({ path: `${SCREENSHOTS}parent-${width}.png`, fullPage: true })
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, String(overflow))
    check(`mobile ${width}: tap targets ≥ 24px`, small.length === 0, small.join(', '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  runScript('seed-activity.js')
}
