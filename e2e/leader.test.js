// Leader home (SPEC §4.1): greeting from the linked skautIS person, tools by
// role, today card, upcoming events with sign-up counts, troop attendance with
// the camp requirement, troop switch remembered in the browser, header
// navigation, mobile widths. Accounts from `scripts/seed-users.js` (vedouci@ is
// Ondys, vlc; spravce@ is Hobit, ss), children from `scripts/seed-members.js`,
// activity from `scripts/seed-activity.js`.

import {
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  pragueToday,
  runScript,
} from './lib.js'
import { addDays, EVENTS } from '../scripts/seed-activity.js'
import { schoolYearRange } from '../functions/src/shared/schoolYear.js'
import { troopDay, weekdayOf } from '../functions/src/shared/meetingDays.js'
import { canJoin, isOpenForSignUp } from '../functions/src/shared/events.js'
import { meetingStats, meetsCampRequirement } from '../functions/src/shared/attendance.js'

const PASSWORD = 'heslo1234'
const today = pragueToday()
const { from: yearStart } = schoolYearRange(today)
const SETTINGS = { campMinTrips: 4, campMinMeetingPct: 60 }

// Seeded events as Firestore holds them.
const events = EVENTS.filter((e) => !e.deleted).map(({ registration, ...e }) => ({
  cancelled: false,
  ...e,
  registrationOpen: !!registration,
  registrationDeadline: registration ?? null,
}))

async function openAs(browser, email, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.getByRole('heading', { name: 'Nejbližší akce' }).waitFor({ timeout: 10000 })
  return opened
}

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

const TODAY_TEXT = {
  meeting: 'schůzka v klubovně, 17–19 h',
  otherTroop: 'dneska má schůzku druhý oddíl — tvůj oddíl se neschází',
  free: 'dneska není schůzka ani výprava — klidný den',
}
const expectedToday = (troop, date = today) => {
  const plan = troopDay(troop, date, events)
  return plan.kind === 'trip' ? `první den výpravy — ${plan.event.title}` : TODAY_TEXT[plan.kind]
}

export default async function leader({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  const members = (await docs('members')).filter((m) => m.active)
  const meetings = (await docs('meetings')).filter((m) => m.date >= yearStart)

  const { ctx, page, errors } = await openAs(browser, 'vedouci@zare.test')
  await page.screenshot({ path: `${SCREENSHOTS}leader-desktop.png`, fullPage: true })

  // ---- greeting and tools ----
  {
    check(
      'greeting: nickname of the linked person',
      await page.getByRole('heading', { name: 'Ahoj, Ondys!' }).isVisible(),
    )
    const role = await page.getByTestId('leader-role').innerText()
    check('greeting: role title and troop', role.startsWith('rádce Bobrů · vlčušky'), role)
    const tools = page.getByRole('navigation', { name: 'Nástroje' })
    check(
      'tools: five tools, no Administrace for a leader',
      (await tools.getByRole('link').count()) === 5 &&
        (await tools.getByRole('link', { name: 'Administrace' }).count()) === 0,
    )
  }

  // ---- today card ----
  {
    const text = await page.getByTestId('today-text').innerText()
    check('today: vlc card matches the day', text === expectedToday('vlc'), text)
  }

  // ---- upcoming events ----
  {
    const upcoming = events.filter((e) => isOpenForSignUp(e, today))
    const articles = page.getByRole('region', { name: 'Nejbližší akce' }).getByRole('article')
    check(
      `events: ${upcoming.length} events with registration`,
      (await articles.count()) === upcoming.length,
      String(await articles.count()),
    )
    for (const event of upcoming) {
      const eligible = members.filter((m) => canJoin(event, m))
      const signedUp = eligible.filter((m) => event.participants?.[m.id]?.signedUp).length
      const card = page.getByRole('article', { name: event.title })
      const count = await card.getByTestId('signed-up').innerText()
      check(
        `events: ${event.title} ${signedUp} / ${eligible.length}`,
        count === `${signedUp} / ${eligible.length}`,
        count,
      )
      const poster = event.posterStatus === 'published' ? 'plakátek' : 'vyplnit plakátek'
      check(
        `events: ${event.title} poster link „${poster}“`,
        (await card.getByRole('link', { name: poster, exact: true }).count()) === 1,
      )
    }
    const cancelled = events.find((e) => e.cancelled)
    check(
      'events: cancelled and deleted events are not listed',
      (await page.getByRole('article', { name: cancelled.title }).count()) === 0 &&
        (await page.getByRole('article', { name: 'Smazaná akce' }).count()) === 0,
    )
  }

  // ---- troop attendance ----
  {
    check(
      'attendance: heading of the home troop',
      await page.getByRole('heading', { name: 'Docházka vlčušek' }).isVisible(),
    )
    const vlc = members.filter((m) => m.troop === 'vlc')
    const rows = page.getByRole('region', { name: 'Docházka vlčušek' }).getByRole('listitem')
    check(`attendance: ${vlc.length} vlc children`, (await rows.count()) === vlc.length)
    const pastTrips = events.filter((e) => e.startDate <= today && e.registrationOpen)
    let wrong = []
    for (const member of vlc) {
      const row = rows.filter({ has: page.getByText(`${member.firstName} ${member.lastName}`) })
      const { percent } = meetingStats(member, meetings)
      const trips = pastTrips.filter(
        (e) => !e.cancelled && e.posterStatus !== 'none' && e.participants?.[member.id]?.attended,
      ).length
      const want = [
        percent === null ? '—' : `${percent} %`,
        `${trips} výpr.`,
        meetsCampRequirement({ percent, trips }, SETTINGS) ? 'ok' : 'short',
      ]
      const got = [
        await row.getByTestId('attendance').innerText(),
        await row.getByTestId('trips').innerText(),
        await row.getAttribute('data-camp'),
      ]
      if (want.join() !== got.join()) wrong.push(`${member.nickname}: ${got} ≠ ${want}`)
    }
    check('attendance: meeting %, trips and camp flag per child', !wrong.length, wrong.join('; '))
  }

  // ---- today card on other days (browser clock moved to noon in Prague) ----
  {
    const next = (weekday) => {
      let d = addDays(today, 1)
      while (weekdayOf(d) !== weekday) d = addDays(d, 1)
      return d
    }
    // vlc meeting, ss meeting (other troop for vlc), first day of the vlc trip
    const trip = events.find((e) => e.id === 'seed-stredohori')
    for (const date of [next('thu'), next('tue'), trip.startDate]) {
      await page.clock.setFixedTime(new Date(`${date}T10:00:00Z`))
      await page.reload({ waitUntil: 'load' })
      const card = page.getByTestId('today-card')
      await card.waitFor()
      const text = await card.getByTestId('today-text').innerText()
      const plan = troopDay('vlc', date, events)
      let ok = text === expectedToday('vlc', date)
      if (plan.kind !== 'free' && plan.kind !== 'otherTroop') {
        const href = await card.getByRole('link').getAttribute('href')
        const want = plan.kind === 'meeting' ? `schuzka=${date}` : `vyprava=${plan.event.id}`
        ok &&= href.includes('oddil=vlc') && href.includes(want)
      }
      check(`today: ${weekdayOf(date)} ${date} is „${plan.kind}“`, ok, text)
    }
    await page.clock.setFixedTime(new Date())
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Nejbližší akce' }).waitFor()
  }

  // ---- troop switch (tags in the header) ----
  {
    const switchGroup = page.getByRole('banner').getByRole('group', { name: 'Oddíl' })
    check(
      'switch: home troop vlc selected in the header',
      (await switchGroup.getByRole('button', { name: 'vlčušky' }).getAttribute('aria-pressed')) ===
        'true',
    )
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'skauti a skautky' })
      .click()
    check(
      'switch: attendance shows ss',
      await page.getByRole('heading', { name: 'Docházka skautů a skautek' }).isVisible(),
    )
    const text = await page.getByTestId('today-text').innerText()
    check('switch: ss today card', text === expectedToday('ss'), text)
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Nejbližší akce' }).waitFor()
    check(
      'switch: choice remembered after reload',
      await page.getByRole('heading', { name: 'Docházka skautů a skautek' }).isVisible(),
    )
    await page
      .getByRole('group', { name: 'Oddíl' })
      .getByRole('button', { name: 'vlčušky' })
      .click()
  }

  // ---- navigation ----
  {
    check(
      'nav: no separate menu, parent preview in the header',
      (await page.getByRole('banner').getByRole('navigation').count()) === 0 &&
        (await page
          .getByRole('banner')
          .getByRole('link', { name: 'náhled pro rodiče' })
          .count()) === 1,
    )
    const tools = page.getByRole('navigation', { name: 'Nástroje' })
    await tools.getByRole('link', { name: 'Docházka' }).click()
    await page.waitForURL(/\/vedouci\/dochazka$/)
    check(
      'nav: Docházka opens its page, troop switch in its header',
      (await page.getByRole('heading', { name: 'Docházka' }).isVisible()) &&
        (await page.getByRole('group', { name: 'Oddíl' }).isVisible()),
    )
    await page.getByRole('link', { name: '← zpět na vedoucovskou stránku' }).click()
    await page.waitForURL(/\/vedouci$/)
    await page.getByRole('link', { name: 'plakátek', exact: true }).first().click()
    await page.waitForURL(/\/clenove\/akce\//)
    check('nav: poster link opens the poster', true)
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- admin ----
  {
    const { ctx, page, errors } = await openAs(browser, 'spravce@zare.test')
    check(
      'admin: greeting and home troop ss',
      (await page.getByRole('heading', { name: 'Ahoj, Hobit!' }).isVisible()) &&
        (await page.getByRole('heading', { name: 'Docházka skautů a skautek' }).isVisible()),
    )
    const admin = page
      .getByRole('navigation', { name: 'Nástroje' })
      .getByRole('link', { name: 'Administrace' })
    check('admin: Administrace among the tools', (await admin.count()) === 1)
    await admin.click()
    await page.waitForURL(/\/vedouci\/administrace$/)
    check(
      'admin: Administrace has the leader header without the troop switch',
      (await page.getByRole('link', { name: 'náhled pro rodiče' }).isVisible()) &&
        (await page.getByRole('group', { name: 'Oddíl' }).count()) === 0,
    )
    check('admin: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- parents are kept out ----
  {
    const opened = await openPage(browser, '/prihlaseni')
    await opened.page.getByLabel('E-mail').fill('rodic@zare.test')
    await opened.page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
    await opened.page.getByRole('button', { name: 'Přihlásit se →' }).click()
    await opened.page.waitForURL(/\/clenove$/)
    await opened.page.goto(opened.page.url().replace('/clenove', '/vedouci'), { waitUntil: 'load' })
    await opened.page.waitForURL(/\/clenove$/)
    check('access: a parent is sent from /vedouci to /clenove', true)
    await opened.ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openAs(browser, 'vedouci@zare.test', {
      width,
      height: 800,
      mobile: true,
    })
    const overflow = await horizontalOverflow(page)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim() || el.name),
    )
    await page.screenshot({ path: `${SCREENSHOTS}leader-${width}.png`, fullPage: true })
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, String(overflow))
    check(`mobile ${width}: tap targets ≥ 24px`, small.length === 0, small.join(', '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
}
