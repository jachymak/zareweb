// Attendance (SPEC §4.2) on the meetings, attendance overview, trips and
// meeting-point pages: meetings recorded per child with autosave and the
// cancelled flag, links (also the old /vedouci/dochazka ones), live updates
// from another leader, trips with attendance / payments / amounts and the cash
// total, the troop switch, mobile widths. Accounts from
// `scripts/seed-users.js`, children from `scripts/seed-members.js` (vlc: Sojka
// 900102 thu, Liška 900103 mon, Žabka and Kulíšek without a day), activity from
// `scripts/seed-activity.js` (the latest meeting date of each day is unrecorded,
// the 2nd one cancelled, some absences excused). The camp requirement summary on
// the overview page. Excuses entered by a leader.

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
import { meetingDates, meetingSchedule } from '../functions/src/shared/meetingDays.js'
import { addDays, EVENTS } from '../scripts/seed-activity.js'
import {
  DEFAULT_CAMP_REQUIREMENTS,
  meetingDots,
  meetingStats,
  meetsCampRequirement,
} from '../functions/src/shared/attendance.js'

const PASSWORD = 'heslo1234'
const today = pragueToday()
const { from: yearStart } = schoolYearRange(today)
const thursdays = meetingDates('thu', yearStart, today).reverse() // newest first
const latestThu = thursdays[0]
// Recorded by the seed: up to yesterday, without the latest one (newest first).
const recordedThu = meetingDates('thu', yearStart, addDays(today, -1)).slice(0, -1).reverse()
const formatDay = (iso) => `${Number(iso.slice(8))}. ${Number(iso.slice(5, 7))}.`

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function openAttendance(browser, path = '/vedouci/schuzky', options, heading = 'Schůzky') {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill('vedouci@zare.test')
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.goto(opened.page.url().replace(/\/vedouci$/, path), { waitUntil: 'load' })
  await page.getByRole('heading', { name: heading, level: 1 }).waitFor()
  await page.getByText('načítám…').waitFor({ state: 'detached' })
  return opened
}

// Opens another leader page in the same tab and waits until it has loaded.
async function go(page, path, heading) {
  await page.goto(page.url().split('/vedouci')[0] + path, { waitUntil: 'load' })
  await page.getByRole('heading', { name: heading, level: 1 }).waitFor()
  await page.getByText('načítám…').waitFor({ state: 'detached' })
}

async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: { Authorization: 'Bearer owner' } })
  return res.ok ? (await res.json()).fields : null
}
const presentIds = (fields) => (fields?.presentIds?.arrayValue?.values ?? []).map(fieldValue)

const docs = async (collection) =>
  (await listDocs(collection)).map((d) => ({
    id: d.name.split('/').at(-1),
    ...Object.fromEntries(
      Object.entries(d.fields).map(([k, v]) => [
        k,
        'arrayValue' in v ? (v.arrayValue.values ?? []).map(fieldValue) : fieldValue(v),
      ]),
    ),
  }))

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

  // ---- camp requirement summary (before anything is recorded) ----
  {
    const members = (await docs('members')).filter((m) => m.active)
    const meetings = (await docs('meetings')).filter((m) => m.date >= yearStart)
    const excuses = await docs('excuses')
    await page.getByRole('link', { name: 'přehled docházky a podmínka na tábor →' }).click()
    await page.getByRole('heading', { name: 'Přehled docházky', level: 1 }).waitFor()
    const region = page.getByRole('region', { name: 'Podmínka na tábor' })
    const rows = region.getByRole('listitem')
    await rows.first().waitFor()
    check(
      'camp: the link from the meetings opens the overview of the troop',
      new URL(page.url()).searchParams.get('oddil') === 'vlc' &&
        (await region.getByRole('list').isVisible()),
      page.url(),
    )
    const vlc = members.filter((m) => m.troop === 'vlc')
    check(`camp: ${vlc.length} vlc children`, (await rows.count()) === vlc.length)
    const pastTrips = EVENTS.filter(
      (e) => !e.deleted && e.startDate <= today && e.registration && !e.cancelled,
    )
    const wrong = []
    for (const member of vlc) {
      const row = rows.filter({ has: page.getByText(`${member.firstName} ${member.lastName}`) })
      const { percent } = meetingStats(member, meetings)
      const trips = pastTrips.filter(
        (e) => e.posterStatus !== 'none' && e.participants?.[member.id]?.attended,
      ).length
      const want = [
        percent === null ? '—' : `${percent} %`,
        `${trips} výpr.`,
        meetsCampRequirement({ percent, trips }, DEFAULT_CAMP_REQUIREMENTS.vlc) ? 'ok' : 'short',
      ]
      const got = [
        await row.getByTestId('attendance').innerText(),
        await row.getByTestId('trips').innerText(),
        await row.getAttribute('data-camp'),
      ]
      if (want.join() !== got.join()) wrong.push(`${member.nickname}: ${got} ≠ ${want}`)
    }
    check('camp: meeting %, trips and camp flag per child', !wrong.length, wrong.join('; '))

    const rowOf = (member) =>
      rows.filter({ has: page.getByText(`${member.firstName} ${member.lastName}`) })
    const sojka = members.find((m) => m.id === '900102')
    await rowOf(sojka).getByRole('button').click()
    const states = await rowOf(sojka)
      .getByTestId('dots')
      .locator('[data-state]')
      .evaluateAll((els) => els.map((e) => e.dataset.state))
    const wantDots = meetingDots(sojka, meetings, meetingSchedule(null), yearStart, today, excuses)
    check(
      `camp: clicking a child shows a dot per meeting of their day (${wantDots.length})`,
      wantDots.length > 0 && states.join() === wantDots.map((d) => d.state).join(),
      states.join(),
    )
    const noDay = vlc.find((m) => !m.meetingDay)
    await rowOf(noDay).getByRole('button').click()
    check(
      'camp: a child without a meeting day explained',
      await rowOf(noDay).getByText('Nemá den schůzek').isVisible(),
    )
    await go(page, '/vedouci/schuzky?oddil=vlc', 'Schůzky')
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
    check(
      'meetings: „zapsal(a) Ondys“ shown in small print',
      await until(
        async () => (await page.getByTestId('recorded-by').innerText()) === 'zapsal(a) Ondys',
      ),
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

    // A child ticked by mistake on a meeting that should stay unrecorded.
    page.once('dialog', (dialog) => dialog.accept()) // more than one child ticked
    await page.getByTestId('unrecord').click()
    check(
      'meetings: „vrátit na nezapsáno“ deletes the meeting',
      (await until(async () => !(await getDoc(meetingPath)))) &&
        (await until(() => page.getByTestId('unrecorded').isVisible())) &&
        !(await pressed(page.getByRole('button', { name: 'Sojka' }))),
    )
    await page.getByRole('button', { name: 'Sojka' }).click()
    await until(async () => presentIds(await getDoc(meetingPath)).includes('900102'))
  }

  // ---- meetings: an older recorded meeting can be changed ----
  if (recordedThu.length > 2) {
    const older = recordedThu[0]
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

  // ---- meetings: excuse entered by a leader ----
  {
    await page
      .getByRole('group', { name: 'Termín schůzky' })
      .getByRole('button', { name: formatDay(latestThu), exact: true })
      .click()
    await page.getByRole('heading', { name: `Schůzka čtvrtek ${formatDay(latestThu)}` }).waitFor()
    const sojka = page.getByRole('button', { name: 'Sojka' })
    if (await pressed(sojka)) await sojka.click()
    await until(async () => !presentIds(await getDoc(meetingPath)).includes('900102'))
    const excusePath = `excuses/vlc_${latestThu}_900102`
    await page.getByRole('button', { name: '+ omluvit dítě' }).click()
    await page.getByLabel('Dítě').selectOption('900102')
    await page.getByLabel('Důvod').fill('SMS od mámy')
    await page.getByRole('button', { name: 'omluvit', exact: true }).click()
    const saved = await until(() => getDoc(excusePath))
    check(
      'excuse: „+ omluvit dítě“ saves it by the leader',
      fieldValue(saved?.by) === 'leader' &&
        fieldValue(saved?.reason) === 'SMS od mámy' &&
        fieldValue(saved?.troop) === 'vlc',
    )
    const row = page.getByRole('listitem', { name: 'omluvenka Sojka' })
    check(
      'excuse: yellow card, count and reason shown',
      (await until(() => sojka.getByText('omluveno').isVisible())) &&
        (await page.getByTestId('excused-count').innerText()) === 'omluveno 1' &&
        (await row.innerText()).includes('omluvili vedoucí: SMS od mámy'),
    )
    await sojka.click()
    check(
      'excuse: ticked anyway → present wins',
      (await until(() => pressed(sojka))) &&
        (await page.getByTestId('excused-count').count()) === 0 &&
        (await until(async () => (await row.innerText()).includes('ale přišel(a)'))),
    )
    await row.getByRole('button', { name: 'zrušit' }).click()
    check(
      'excuse: „zrušit“ deletes it',
      (await until(async () => !(await getDoc(excusePath)))) && (await row.count()) === 0,
    )
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

  // ---- link (old address, as in sent reminder e-mails) to an older meeting ----
  {
    const older = thursdays[thursdays.length > 1 ? 1 : 0]
    await page.goto(
      page.url().split('/vedouci')[0] + `/vedouci/dochazka?oddil=vlc&schuzka=${older}`,
    )
    await page.getByRole('heading', { name: `Schůzka čtvrtek ${formatDay(older)}` }).waitFor()
    check(
      'link: the old ?schuzka address opens that meeting on the meetings page',
      new URL(page.url()).pathname === '/vedouci/schuzky',
      page.url(),
    )
  }

  // ---- trips: overview (at home) ----
  {
    await page.goto(
      page.url().split('/vedouci')[0] + '/vedouci/dochazka?oddil=vlc&vyprava=seed-sarka',
    )
    const sheet = page.getByRole('region', { name: 'Přihlášky a platby' })
    await page.getByRole('article', { name: 'Hry v Šárce' }).waitFor()
    check(
      'trips: the old ?vyprava address opens the trips page',
      new URL(page.url()).pathname === '/vedouci/vypravy',
      page.url(),
    )
    const trips = page.getByRole('group', { name: 'Výprava' })
    check(
      'trips: vlc + all events with a poster only',
      (await trips.getByText('Hry v Šárce').count()) === 1 &&
        (await trips.getByText('Zahajovací výprava').count()) === 1 &&
        (await trips.getByText('Oddílová hra po Praze').count()) === 1 &&
        (await trips.getByText('Výprava do Brd').count()) === 0 &&
        (await trips.getByText('Zahajovací odpoledne v klubovně').count()) === 0,
    )
    check(
      'trips: the poster editor below',
      await page.getByRole('form', { name: 'Plakátek' }).isVisible(),
    )
    check(
      'trips: only children on the list are shown',
      (await sheet.getByRole('group', { name: 'Sojka' }).count()) === 1 &&
        (await sheet.getByRole('group', { name: 'Liška' }).count()) === 0,
    )
    const sojka = sheet.getByRole('group', { name: 'Sojka' })
    check(
      'trips: signed-up Sojka attended per seed',
      await pressed(sojka.getByRole('button', { name: '✓ přijel' })),
    )
    await sojka.getByRole('button', { name: 'zaplaceno', exact: true }).click()
    const path = 'events/seed-sarka/participants/900102'
    check(
      'trips: „zaplaceno“ saved',
      await until(async () => fieldValue((await getDoc(path))?.paid) === true),
    )
    check(
      'trips: recordedBy saved and „zapsal(a) Ondys“ shown',
      !!fieldValue((await getDoc(path))?.recordedBy) &&
        (await until(
          async () => (await page.getByTestId('recorded-by').innerText()) === 'zapsal(a) Ondys',
        )),
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

    // A late sign-up by the leader through the picker, and off again.
    const liskaPath = 'events/seed-sarka/participants/900103'
    await sheet.getByLabel('přihlásit dítě').selectOption('900103')
    const liska = sheet.getByRole('group', { name: 'Liška' })
    check(
      'trips: „přihlásit dítě“ signs a child up (by the leader)',
      (await until(async () => fieldValue((await getDoc(liskaPath))?.signedUp) === true)) &&
        !!fieldValue((await getDoc(liskaPath))?.signedUpBy) &&
        (await until(async () =>
          (await page.getByTestId('trip-summary').innerText()).startsWith('přihlášeno 2'),
        )),
    )
    await liska.getByRole('button', { name: 'odhlásit' }).click()
    check(
      'trips: „odhlásit“ signs the child off, the row goes',
      (await until(async () => fieldValue((await getDoc(liskaPath))?.signedUp) === false)) &&
        (await until(async () => (await liska.count()) === 0)),
    )
    await page.screenshot({ path: `${SCREENSHOTS}attendance-trips.png`, fullPage: true })

    // ---- trips: at the meeting point ----
    await page.getByRole('link', { name: 'na sraz →' }).click()
    await page.waitForURL(/\/vedouci\/na-srazu/)
    const gather = page.getByRole('region', { name: 'Hry v Šárce' })
    await gather.waitFor()
    check(
      'gather: only the trip is shown — no title, switches or trip list',
      (await page.getByRole('heading', { level: 1 }).count()) === 0 &&
        (await page.getByRole('group', { name: 'Oddíl' }).count()) === 0 &&
        (await trips.count()) === 0,
    )
    const count = () => gather.getByTestId('gather-count').innerText()
    check(
      'gather: count and cash',
      (await count()) === 'přijelo 1 z 1' &&
        (await gather.getByTestId('gather-cash').innerText()) === '250 Kč',
    )
    const card = gather.getByRole('group', { name: 'Sojka' })
    await card.getByRole('button', { name: 'Sojka zaplatil' }).click()
    await card.getByRole('button', { name: 'Sojka přijel' }).click()
    check(
      'gather: tapping the card unmarks „přijel“, the pay button unmarks paid',
      (await until(async () => {
        const f = await getDoc(path)
        return fieldValue(f?.paid) === false && fieldValue(f?.attended) === null
      })) && (await until(async () => (await count()) === 'přijelo 0 z 1')),
    )
    await card.getByRole('button', { name: 'Sojka zaplatil' }).click()
    check(
      'gather: paying marks „přijel“ too',
      await until(async () => {
        const f = await getDoc(path)
        return fieldValue(f?.paid) === true && fieldValue(f?.attended) === true
      }),
    )
    await gather.getByLabel('přišel někdo nepřihlášený').selectOption('900103')
    check(
      'gather: a child who was not signed up can be added as came',
      (await until(async () => fieldValue((await getDoc(liskaPath))?.attended) === true)) &&
        (await until(async () => (await count()) === 'přijelo 2 z 2')) &&
        (await gather.getByRole('group', { name: 'Liška' }).getByText('nepřihlášen').count()) === 1,
    )
    await page.screenshot({ path: `${SCREENSHOTS}attendance-gather.png`, fullPage: true })
    await gather.getByRole('button', { name: '← jiná výprava' }).click()
    check(
      'gather: „← jiná výprava“ offers the trips',
      (await trips.isVisible()) &&
        (await page.getByRole('heading', { name: 'Na srazu', level: 1 }).isVisible()),
    )
    await go(page, '/vedouci/vypravy?oddil=vlc&vyprava=seed-sarka', 'Výpravy')
  }

  // ---- a trip for everyone lists the children of both troops ----
  {
    await page.getByRole('group', { name: 'Výprava' }).getByText('Zahajovací výprava').click()
    await page.getByRole('article', { name: 'Zahajovací výprava' }).waitFor()
    const sheet = page.getByRole('region', { name: 'Přihlášky a platby' })
    const bobr = sheet.getByRole('group', { name: 'Bobr' })
    check(
      'all-trip: ss child Bobr listed from the vlc page, with his troop tag',
      (await bobr.count()) === 1 && (await bobr.getByTitle('skauti a skautky').count()) === 1,
    )
    check(
      'all-trip: Sojka and Bobr signed up',
      (await sheet.getByTestId('trip-summary').innerText()).startsWith('přihlášeno 2'),
    )
    await bobr.getByRole('button', { name: 'zaplaceno', exact: true }).click()
    check(
      "all-trip: payment of the other troop's child saved",
      await until(
        async () =>
          fieldValue((await getDoc('events/seed-zahajovaci/participants/900201'))?.paid) === true,
      ),
    )
  }

  // ---- troop switch ----
  {
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'skauti a skautky' })
      .click()
    check(
      'switch: ss chosen, kept in the URL, ss trips listed',
      (await until(() => new URL(page.url()).searchParams.get('oddil') === 'ss')) &&
        (await until(() =>
          page.getByRole('group', { name: 'Výprava' }).getByText('Výprava do Brd').isVisible(),
        )),
    )
    await page.getByRole('link', { name: '← zpět na vedoucovskou stránku' }).click()
    await page.getByRole('link', { name: 'Schůzky', exact: true }).click()
    await page.getByRole('heading', { name: 'Schůzky', level: 1 }).waitFor()
    await page.getByText('načítám…').waitFor({ state: 'detached' })
    check(
      'switch: the troop kept across pages — ss meeting days',
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
  const PAGES = [
    ['schuzky', '/vedouci/schuzky?oddil=vlc', 'Schůzky'],
    ['dochazka', '/vedouci/dochazka?oddil=vlc', 'Přehled docházky'],
    ['vypravy', '/vedouci/vypravy?oddil=vlc&vyprava=seed-sarka', 'Výpravy'],
  ]
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openAttendance(
      browser,
      PAGES[2][1],
      {
        width,
        height: 800,
        mobile: true,
      },
      'Výpravy',
    )
    await page.getByRole('article', { name: 'Hry v Šárce' }).waitFor()
    const chip = await page
      .getByRole('group', { name: 'Výprava' })
      .getByRole('button', { pressed: true })
      .boundingBox()
    check(
      `mobile ${width}: selected trip scrolled into view`,
      chip && chip.x >= 0 && chip.x + chip.width <= width,
      JSON.stringify(chip),
    )
    check(
      `mobile ${width}: no troop switch, the troop named by its tag`,
      !(await page.getByRole('group', { name: 'Oddíl' }).isVisible()) &&
        (await page
          .getByRole('heading', { name: /Výpravy/ })
          .getByTitle('vlčušky')
          .isVisible()),
    )
    const problems = []
    for (const [name, path, heading] of PAGES) {
      await go(page, path, heading)
      await page.waitForTimeout(300)
      const overflow = await horizontalOverflow(page)
      if (overflow > 0) problems.push(`${name}: overflow ${overflow}`)
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, input')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height < 24 && !el.closest('p')
          })
          .map((el) => el.textContent.trim() || el.name),
      )
      if (small.length) problems.push(`${name}: small ${small.join(', ')}`)
      await page.screenshot({
        path: `${SCREENSHOTS}attendance-${width}-${name}.png`,
        fullPage: true,
      })
    }
    await page.goto(
      page.url().split('/vedouci')[0] + '/vedouci/na-srazu?oddil=vlc&vyprava=seed-sarka',
    )
    await page.getByTestId('gather-count').waitFor()
    await page.waitForTimeout(300)
    const gatherOverflow = await horizontalOverflow(page)
    if (gatherOverflow > 0) problems.push(`na srazu: overflow ${gatherOverflow}`)
    const firstCard = await page.getByTestId('gather-count').boundingBox()
    if (!firstCard || firstCard.y > 400) problems.push(`na srazu: count at ${firstCard?.y}`)
    await page.screenshot({
      path: `${SCREENSHOTS}attendance-${width}-na-srazu.png`,
      fullPage: true,
    })
    check(`mobile ${width}: no overflow, tap targets ≥ 24px`, !problems.length, problems.join('; '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  runScript('seed-activity.js')
}
