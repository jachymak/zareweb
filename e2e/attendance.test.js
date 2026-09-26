// Attendance (SPEC §4.2): meetings recorded per child with autosave and the
// cancelled flag, links from the leader home, live updates from another
// leader, trips with attendance / payments / amounts and the cash total, the
// overview with meeting dots, troop switch, mobile widths. Accounts from
// `scripts/seed-users.js`, children from `scripts/seed-members.js` (vlc: Sojka
// 900102 thu, Liška 900103 mon, Žabka and Kulíšek without a day), activity from
// `scripts/seed-activity.js` (the latest meeting date of each day is unrecorded,
// the 2nd one cancelled).

import {
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  FIRESTORE,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  patchDoc,
  pragueToday,
  runScript,
} from './lib.js'
import { schoolYearRange } from '../functions/src/shared/schoolYear.js'
import { meetingDates } from '../functions/src/shared/meetingDays.js'

const PASSWORD = 'heslo1234'
const today = pragueToday()
const { from: yearStart } = schoolYearRange(today)
const thursdays = meetingDates('thu', yearStart, today).reverse() // newest first
const latestThu = thursdays[0]
const formatDay = (iso) => `${Number(iso.slice(8))}. ${Number(iso.slice(5, 7))}.`

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function openAttendance(browser, path = '/vedouci/dochazka', options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill('vedouci@zare.test')
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.goto(opened.page.url().replace(/\/vedouci$/, path), { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'Docházka', level: 1 }).waitFor()
  await page.getByText('načítám…').waitFor({ state: 'detached' })
  return opened
}

async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: { Authorization: 'Bearer owner' } })
  return res.ok ? (await res.json()).fields : null
}
const presentIds = (fields) => (fields?.presentIds?.arrayValue?.values ?? []).map(fieldValue)

const pressed = async (locator) => (await locator.getAttribute('aria-pressed')) === 'true'

export default async function attendance({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  const { ctx, page, errors } = await openAttendance(browser)
  const meetingPath = `meetings/vlc_${latestThu}`

  // ---- meetings: defaults ----
  {
    const dates = page.getByRole('group', { name: 'Termín schůzky' })
    check(
      'meetings: home troop vlc, latest meeting date selected',
      new URL(page.url()).searchParams.get('oddil') === 'vlc' &&
        (await pressed(dates.getByRole('button', { name: formatDay(latestThu) }))),
      page.url(),
    )
    check(
      'meetings: the latest date is flagged unrecorded',
      (await page.getByTestId('unrecorded').isVisible()) && !(await getDoc(meetingPath)),
    )
    if (thursdays.length > 2) {
      const cancelled = thursdays.at(-2) // the 2nd meeting of the year
      check(
        'meetings: cancelled date marked ×',
        (await dates.getByRole('button', { name: `${formatDay(cancelled)} ×` }).count()) === 1,
      )
    }
    check(
      'meetings: only children of the day in the grid',
      (await page.getByRole('button', { name: 'Sojka' }).count()) === 1 &&
        (await page.getByRole('button', { name: 'Liška' }).count()) === 0,
    )
    check(
      'meetings: children without a meeting day mentioned',
      await page.getByText(/2 děti nemají den schůzek \(Kulíšek, Žabka\)/).isVisible(),
    )
  }

  // ---- meetings: autosave round trip ----
  {
    const sojka = page.getByRole('button', { name: 'Sojka' })
    await sojka.click()
    const saved = await until(async () => presentIds(await getDoc(meetingPath)).includes('900102'))
    check('meetings: ticking Sojka records the meeting in Firestore', saved)
    check(
      'meetings: count and unrecorded note update',
      (await page.getByTestId('present-count').innerText()) === 'přišlo 1 z 1' &&
        (await page.getByTestId('unrecorded').count()) === 0,
    )
    const doc = await getDoc(meetingPath)
    check(
      'meetings: doc has troop, date, weekday, updatedBy',
      fieldValue(doc.troop) === 'vlc' &&
        fieldValue(doc.date) === latestThu &&
        fieldValue(doc.weekday) === 'thu' &&
        !!fieldValue(doc.updatedBy) &&
        fieldValue(doc.cancelled) === false,
    )
    await sojka.click()
    check(
      'meetings: unticking removes the child',
      await until(async () => !presentIds(await getDoc(meetingPath)).includes('900102')),
    )

    // Another leader ticks Sojka — the page follows live.
    await patchDoc(meetingPath, {
      presentIds: { arrayValue: { values: [{ stringValue: '900102' }] } },
    })
    check('meetings: change by another leader shows live', await until(() => pressed(sojka)))
    await page.getByRole('button', { name: 'zrušit výběr' }).click()
    check(
      'meetings: „zrušit výběr“ clears presence',
      await until(async () => presentIds(await getDoc(meetingPath)).length === 0),
    )
    await page.getByRole('button', { name: 'přišli všichni' }).click()
    check(
      'meetings: „přišli všichni“ ticks every child of the day',
      await until(async () => presentIds(await getDoc(meetingPath)).join() === '900102'),
    )

    await page.getByRole('button', { name: 'schůzka nebyla' }).click()
    check(
      'meetings: „schůzka nebyla“ sets cancelled',
      await until(async () => fieldValue((await getDoc(meetingPath)).cancelled) === true),
    )
    check(
      'meetings: cancelled meeting explained, grid hidden',
      (await page.getByText('Tenhle termín schůzka nebyla').isVisible()) &&
        (await page.getByRole('button', { name: 'Sojka' }).count()) === 0,
    )
    await page.getByRole('button', { name: 'schůzka přece byla' }).click()
    check(
      'meetings: „schůzka přece byla“ restores it with its presence',
      (await until(async () => fieldValue((await getDoc(meetingPath)).cancelled) === false)) &&
        (await until(() => pressed(page.getByRole('button', { name: 'Sojka' })))),
    )
    check(
      'meetings: selection kept in the URL',
      new URL(page.url()).searchParams.get('schuzka') === latestThu,
    )
  }

  // ---- meetings: an older recorded meeting can be changed ----
  if (thursdays.length > 2) {
    const older = thursdays[1] // recorded by the seed
    const olderPath = `meetings/vlc_${older}`
    const before = presentIds(await getDoc(olderPath)).includes('900102')
    await page
      .getByRole('group', { name: 'Termín schůzky' })
      .getByRole('button', { name: formatDay(older), exact: true })
      .click()
    await page.getByRole('heading', { name: `Schůzka čtvrtek ${formatDay(older)}` }).waitFor()
    const sojka = page.getByRole('button', { name: 'Sojka' })
    check('older meeting: opens by clicking its date', (await pressed(sojka)) === before)
    await sojka.click()
    check(
      'older meeting: presence changed in Firestore',
      await until(async () => presentIds(await getDoc(olderPath)).includes('900102') === !before),
    )
    await sojka.click()
    await until(async () => presentIds(await getDoc(olderPath)).includes('900102') === before)
  }

  // ---- meetings: other weekday ----
  {
    await page
      .getByRole('group', { name: 'Den schůzek' })
      .getByRole('button', { name: 'pondělí' })
      .click()
    check(
      'weekday: Monday shows Liška',
      (await page.getByRole('heading', { name: /^Schůzka pondělí/ }).isVisible()) &&
        (await page.getByRole('button', { name: 'Liška' }).count()) === 1,
    )
  }
  await page.screenshot({ path: `${SCREENSHOTS}attendance-meetings.png`, fullPage: true })

  // ---- link from the leader home to an older meeting ----
  {
    const older = thursdays[thursdays.length > 1 ? 1 : 0]
    await page.goto(
      page.url().split('/vedouci')[0] + `/vedouci/dochazka?oddil=vlc&schuzka=${older}`,
    )
    await page.getByRole('heading', { name: `Schůzka čtvrtek ${formatDay(older)}` }).waitFor()
    check('link: ?schuzka opens that meeting', true)
  }

  // ---- trips ----
  {
    await page.goto(
      page.url().split('/vedouci')[0] + '/vedouci/dochazka?oddil=vlc&vyprava=seed-sarka',
    )
    const sheet = page.getByRole('region', { name: 'Hry v Šárce' })
    await sheet.waitFor()
    const trips = page.getByRole('group', { name: 'Výprava' })
    check(
      'trips: vlc + all trips only',
      (await trips.getByText('Hry v Šárce').count()) === 1 &&
        (await trips.getByText('Zahajovací výprava').count()) === 1 &&
        (await trips.getByText('Výprava do Brd').count()) === 0 &&
        (await trips.getByText('Zahajovací odpoledne v klubovně').count()) === 0,
    )
    const sojka = sheet.getByRole('group', { name: 'Sojka' })
    check(
      'trips: signed-up Sojka attended per seed',
      await pressed(sojka.getByRole('button', { name: 'přijel', exact: true })),
    )
    await sojka.getByRole('button', { name: 'nezaplaceno' }).click()
    const path = 'events/seed-sarka/participants/900102'
    check(
      'trips: „zaplaceno“ saved',
      await until(async () => fieldValue((await getDoc(path))?.paid) === true),
    )
    await sojka.getByLabel('Částka — Sojka').fill('250')
    await sojka.getByLabel('Částka — Sojka').press('Enter')
    check(
      'trips: amount saved',
      await until(async () => fieldValue((await getDoc(path))?.amountPaid) === '250'),
    )
    check(
      'trips: cash in hand sums the paid amounts',
      await until(async () => (await page.getByTestId('trip-cash').innerText()) === '250 Kč'),
    )

    const liska = sheet.getByRole('group', { name: 'Liška' })
    await liska.getByRole('button', { name: 'přijel', exact: true }).click()
    const liskaPath = 'events/seed-sarka/participants/900103'
    check(
      'trips: a child who was not signed up can be marked as came',
      await until(async () => fieldValue((await getDoc(liskaPath))?.attended) === true),
    )
    check(
      'trips: summary counts',
      await until(async () =>
        (await page.getByTestId('trip-summary').innerText()).startsWith(
          'přijelo 2 · zaplaceno 1 z přihlášených 1',
        ),
      ),
      await page.getByTestId('trip-summary').innerText(),
    )
    await page.screenshot({ path: `${SCREENSHOTS}attendance-trips.png`, fullPage: true })
  }

  // ---- a trip for everyone lists the children of both troops ----
  {
    await page.getByRole('group', { name: 'Výprava' }).getByText('Zahajovací výprava').click()
    const sheet = page.getByRole('region', { name: 'Zahajovací výprava' })
    await sheet.waitFor()
    const bobr = sheet.getByRole('group', { name: 'Bobr' })
    check(
      'all-trip: ss child Bobr listed from the vlc page, with his troop tag',
      (await bobr.count()) === 1 && (await bobr.getByTitle('skauti a skautky').count()) === 1,
    )
    check(
      'all-trip: Sojka and Bobr signed up',
      (await sheet.getByTestId('trip-summary').innerText()).includes('z přihlášených 2'),
    )
    await bobr.getByRole('button', { name: 'nezaplaceno' }).click()
    check(
      "all-trip: payment of the other troop's child saved",
      await until(
        async () =>
          fieldValue((await getDoc('events/seed-zahajovaci/participants/900201'))?.paid) === true,
      ),
    )
  }

  // ---- overview ----
  {
    await page
      .getByRole('group', { name: 'Část docházky' })
      .getByRole('button', { name: 'přehled dětí' })
      .click()
    const card = page.getByRole('article', { name: 'Sojka' })
    await card.waitFor()
    const meetings = (await listDocs('meetings'))
      .map((d) => d.fields)
      .filter((f) => fieldValue(f.troop) === 'vlc' && fieldValue(f.weekday) === 'thu')
    const recorded = meetings.filter((f) => !fieldValue(f.cancelled))
    const present = recorded.filter((f) => presentIds(f).includes('900102')).length
    const percent = `${Math.round((present * 100) / recorded.length)} %`
    check(
      `overview: Sojka meeting % ${percent}`,
      (await card.getByTestId('attendance').innerText()) === percent,
    )
    check(
      'overview: Sojka trips include Šárka and the opening trip',
      (await card.getByTestId('trips').innerText()) === '2',
    )
    const dots = card.getByRole('listitem')
    const states = await dots.evaluateAll((els) => els.map((e) => e.dataset.state))
    check(
      `overview: one dot per Thursday (${thursdays.length})`,
      states.length === thursdays.length,
      String(states.length),
    )
    check(
      'overview: dot states from the meetings',
      states.includes('cancelled') === thursdays.length > 2 &&
        states.filter((s) => s === 'present').length === present,
      states.join(),
    )
    check(
      'overview: child without a meeting day explained',
      await page.getByRole('article', { name: 'Žabka' }).getByText('Nemá den schůzek').isVisible(),
    )
    await page.screenshot({ path: `${SCREENSHOTS}attendance-overview.png`, fullPage: true })
  }

  // ---- troop switch ----
  {
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'skauti a skautky' })
      .click()
    check(
      'switch: ss children in the overview',
      (await until(() => page.getByRole('article', { name: 'Bobr' }).isVisible())) &&
        new URL(page.url()).searchParams.get('oddil') === 'ss',
    )
    await page
      .getByRole('group', { name: 'Část docházky' })
      .getByRole('button', { name: 'schůzky' })
      .click()
    check(
      'switch: ss meeting days',
      (await page.getByRole('group', { name: 'Den schůzek' }).innerText()).includes('úterý'),
    )
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'vlčušky' })
      .click()
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openAttendance(
      browser,
      '/vedouci/dochazka?oddil=vlc&vyprava=seed-sarka',
      {
        width,
        height: 800,
        mobile: true,
      },
    )
    await page.getByRole('region', { name: 'Hry v Šárce' }).waitFor()
    const chip = await page
      .getByRole('group', { name: 'Výprava' })
      .getByRole('button', { pressed: true })
      .boundingBox()
    check(
      `mobile ${width}: selected trip scrolled into view`,
      chip && chip.x >= 0 && chip.x + chip.width <= width,
      JSON.stringify(chip),
    )
    const problems = []
    for (const tab of ['výpravy', 'schůzky', 'přehled dětí']) {
      await page
        .getByRole('group', { name: 'Část docházky' })
        .getByRole('button', { name: tab })
        .click()
      await page.waitForTimeout(300)
      const overflow = await horizontalOverflow(page)
      if (overflow > 0) problems.push(`${tab}: overflow ${overflow}`)
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, input')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height < 24 && !el.closest('p')
          })
          .map((el) => el.textContent.trim() || el.name),
      )
      if (small.length) problems.push(`${tab}: small ${small.join(', ')}`)
      await page.screenshot({
        path: `${SCREENSHOTS}attendance-${width}-${tab}.png`,
        fullPage: true,
      })
    }
    check(`mobile ${width}: no overflow, tap targets ≥ 24px`, !problems.length, problems.join('; '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  runScript('seed-activity.js')
}
