// Administration tabs without skautIS (SPEC §4.8): children's meeting days,
// children without a parent account, meeting schedule (days, times, ranges
// without meetings, old ones pruned) and where it is used (public home,
// attendance, leader home logic), waiting list (e-mail texts, ages; the reset
// itself is in the waitlistadmin suite), e-mails about events (texts, the
// onEventUpdated function), packing list templates, camp requirements per
// troop, security rules, mobile widths.
// Accounts from `scripts/seed-users.js`, children from `scripts/seed-members.js`
// (vlc: Žabka 900101 and Kulíšek without a day, Sojka thu, Liška mon; ss: Bobr
// and Vydra tue; Ježek is inactive), activity from `scripts/seed-activity.js`
// (the latest meeting date of each day is unrecorded).

import {
  SCREENSHOTS,
  FIRESTORE,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  patchDocAs,
  pragueToday,
  runScript,
  signInRest,
  callFunction,
  patchDoc,
  REPO,
  yearsAgo,
} from './lib.js'
import { readFileSync, statSync } from 'node:fs'
import { schoolYearRange } from '../functions/src/shared/schoolYear.js'
import {
  meetingDates,
  meetingSchedule,
  troopDay,
  weekdayOf,
} from '../functions/src/shared/meetingDays.js'

const PASSWORD = 'heslo1234'
const ADMIN_URL = '/vedouci/administrace'
const today = pragueToday()
const { from: yearStart } = schoolYearRange(today)
const latestMon = meetingDates('mon', yearStart, today).at(-1) // unrecorded in the seed
const formatDay = (iso) => `${Number(iso.slice(8))}. ${Number(iso.slice(5, 7))}.`

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

// Firestore REST value → plain JS (maps and arrays included).
function plain(v) {
  if (!v) return undefined
  if ('mapValue' in v) {
    return Object.fromEntries(
      Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, plain(x)]),
    )
  }
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(plain)
  if ('integerValue' in v) return Number(v.integerValue)
  return fieldValue(v)
}

async function getDoc(path, headers = { Authorization: 'Bearer owner' }) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers })
  if (!res.ok) return { status: res.status, data: null }
  return { status: res.status, data: plain({ mapValue: { fields: (await res.json()).fields } }) }
}

async function openAs(browser, email, path, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/(vedouci|clenove)$/, { timeout: 10000 })
  if (path) await page.goto(new URL(path, page.url()).href, { waitUntil: 'load' })
  return opened
}

const tab = (page, label) => page.getByRole('tab', { name: label, exact: true })

// Opens a collapsed settings section (CollapsibleSection).
async function expand(section) {
  const header = section.locator('h3 > button[aria-expanded]').first()
  await header.waitFor()
  if ((await header.getAttribute('aria-expanded')) === 'false') await header.click()
}

async function deleteDocRest(path) {
  await fetch(`${FIRESTORE}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer owner' },
  })
}

// E-mails are only logged by the Functions emulator. `npm start` writes its log
// to .emulators.log; with emulators started otherwise the check is skipped.
const LOG = `${REPO}.emulators.log`
const suiteStart = Date.now()
let check = null
async function logCheck(name, line) {
  let fresh = false
  try {
    fresh = statSync(LOG).mtimeMs >= suiteStart
  } catch {
    // no log file
  }
  if (!fresh) return console.log(`SKIP  ${name} — ${LOG} is not written by the running emulators`)
  const found = await until(async () => readFileSync(LOG, 'utf8').includes(line), 8000)
  check(name, found, line)
}

export default async function adminExtras({ browser, check: report }) {
  check = report
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  const { ctx, page, errors } = await openAs(browser, 'spravce@zare.test', ADMIN_URL)
  await page.getByRole('heading', { level: 1, name: 'Administrace' }).waitFor()

  // ---- tabs in the URL ----
  await tab(page, 'děti').click()
  await page.waitForURL(/zalozka=deti/)
  check('tabs: the chosen tab is kept in the URL', page.url().includes('zalozka=deti'))

  // ---- children ----
  {
    // spravce@ is Hobit (s&s), so the troop switch starts on s&s
    await page.getByTestId('children-ss').waitFor()
    check(
      'children: one troop at a time — the admin’s home troop first',
      (await page.getByTestId('children-vlc').count()) === 0 &&
        (await page.getByTestId('missing-other').innerText()).includes('vlčušky: 2 bez dne'),
    )
    await page.getByTestId('missing-other').click()
    const vlc = page.getByTestId('children-vlc')
    await vlc.waitFor()
    const missing = page.getByTestId('missing-count')
    check(
      'children: 2 active children without a day (Žabka, Kulíšek)',
      (await missing.textContent()).includes('2 děti nemají'),
    )
    const zabka = page.getByTestId('child-900101')
    check(
      'children: Žabka highlighted without a day',
      await zabka.getByTestId('no-day').isVisible(),
    )
    await zabka.getByRole('button', { name: 'pondělí' }).click()
    const day = await until(
      async () => (await getDoc('members/900101')).data?.meetingDay === 'mon' || null,
    )
    check('children: a click saves the meeting day to Firestore', day)
    await until(async () => (await missing.textContent()).includes('1 dítě nemá'))
    check(
      'children: the list updates live (1 without a day)',
      (await missing.textContent()).includes('1 dítě nemá') &&
        (await zabka.getByRole('button', { name: 'pondělí' }).getAttribute('aria-pressed')) ===
          'true',
    )
    await page.getByRole('button', { name: 'jen bez dne' }).click()
    check(
      'children: „jen bez dne“ filters to Kulíšek',
      (await page.locator('[data-testid^="child-"]').count()) === 1,
    )
    await page.getByRole('button', { name: 'jen bez dne' }).click()
    await zabka.getByRole('button', { name: 'pondělí' }).click()
    check(
      'children: a click on the chosen day clears it',
      await until(async () => (await getDoc('members/900101')).data?.meetingDay === null),
    )
  }

  // ---- accounts: children without a parent account ----
  {
    await tab(page, 'účty a párování').click()
    await page.getByRole('button', { name: /^Děti bez účtu \d+$/ }).click()
    const unpaired = page.getByTestId('unpaired-child')
    await unpaired.first().waitFor()
    const names = await unpaired.allInnerTexts()
    check(
      'accounts: 4 active children without a parent account (Sojka, Bobr are paired)',
      names.length === 4 &&
        !names.some((n) => n.includes('Sojka') || n.includes('Bobr')) &&
        names.some((n) => n.includes('Žabka')),
      names.map((n) => n.split('\n')[0]).join(', '),
    )
    check(
      'accounts: parents’ contacts from skautIS with mailto links',
      (await unpaired.first().locator('a[href^="mailto:"]').count()) > 0,
    )
  }

  // ---- meetings ----
  {
    const lastYear = Number(yearStart.slice(0, 4)) - 1
    await patchDoc('settings/meetings', {
      noMeetings: {
        arrayValue: {
          values: [
            {
              mapValue: {
                fields: {
                  from: { stringValue: `${lastYear}-12-23` },
                  to: { stringValue: `${lastYear + 1}-01-02` },
                  troop: { stringValue: 'all' },
                  reason: { stringValue: 'vánoce loni' },
                },
              },
            },
          ],
        },
      },
    })
    await tab(page, 'schůzky').click()
    const vlc = page.getByTestId('troop-vlc')
    const ss = page.getByTestId('troop-ss')
    await vlc.waitFor()
    check(
      'meetings: sections start collapsed with a summary',
      (await vlc.getByTestId('summary').innerText()) === 'pondělí a čtvrtek · 17:00–19:00' &&
        !(await vlc.getByRole('button', { name: 'pondělí', exact: true }).isVisible()),
    )
    await expand(vlc)
    await expand(ss)
    await expand(page.getByTestId('ranges'))
    check(
      'meetings: defaults shown (vlc Mon + Thu)',
      (await vlc
        .getByRole('button', { name: 'pondělí', exact: true })
        .getAttribute('aria-pressed')) === 'true' &&
        (await vlc
          .getByRole('button', { name: 'čtvrtek', exact: true })
          .getAttribute('aria-pressed')) === 'true',
    )

    // validation: three days
    await vlc.getByRole('button', { name: 'pátek', exact: true }).click()
    await page.getByRole('button', { name: 'uložit' }).click()
    check(
      'meetings: three days → „Vyber dva dny.“',
      await vlc.getByText('Vyber dva dny.').isVisible(),
    )
    const pruned = (await getDoc('settings/meetings')).data
    check(
      'meetings: a range of the previous school year is deleted when the tab opens',
      pruned?.noMeetings?.length === 0,
      JSON.stringify(pruned),
    )
    check(
      'meetings: nothing saved while invalid',
      !(await getDoc('settings/meetings')).data?.vlc?.days.includes('fri'),
    )
    await vlc.getByRole('button', { name: 'pátek', exact: true }).click()

    // vlc time 16:30–18:00, ss meets Wed + Thu
    await page.getByLabel('Začátek schůzky — Vlčušky').fill('16:30')
    await page.getByLabel('Konec schůzky — Vlčušky').fill('18:00')
    await ss.getByRole('button', { name: 'úterý', exact: true }).click()
    await ss.getByRole('button', { name: 'čtvrtek', exact: true }).click()

    // a range: the latest Monday (vlc), and one for both troops
    const add = page.getByTestId('add-range')
    await add.getByRole('button', { name: '+ přidat' }).click()
    check(
      'meetings: adding a range without a date asks for it',
      await page.getByText('Vyber, od kdy schůzky nejsou.').isVisible(),
    )
    await add.getByLabel('Od', { exact: true }).fill(latestMon)
    await add.getByLabel('Oddíl').selectOption('vlc')
    await add.getByLabel('Důvod').fill('státní svátek')
    await add.getByRole('button', { name: '+ přidat' }).click()
    await add.getByLabel('Od', { exact: true }).fill(`${Number(today.slice(0, 4)) + 1}-02-02`)
    await add.getByLabel('Do', { exact: true }).fill(`${Number(today.slice(0, 4)) + 1}-02-06`)
    await add.getByLabel('Oddíl').selectOption('all')
    await add.getByLabel('Důvod').fill('jarní prázdniny')
    await add.getByRole('button', { name: '+ přidat' }).click()
    check(
      'meetings: ranges listed before saving, „neuložené změny“',
      (await page.getByTestId('no-meeting').count()) === 2 &&
        (await page.getByText('neuložené změny').isVisible()),
    )

    await page.getByRole('button', { name: 'uložit' }).click()
    await page.getByText('uloženo ✓').waitFor()
    check(
      'meetings: after saving, the range that is over is hidden (still in the data)',
      (await page.getByTestId('no-meeting').count()) === 1,
    )
    const saved = (await getDoc('settings/meetings')).data
    check(
      'meetings: saved to settings/meetings',
      saved?.vlc.start === '16:30' &&
        saved.vlc.end === '18:00' &&
        saved.ss.days.join() === 'wed,thu' &&
        saved.noMeetings.length === 2 &&
        saved.noMeetings.some(
          (r) =>
            r.from === latestMon &&
            r.to === latestMon &&
            r.troop === 'vlc' &&
            r.reason === 'státní svátek',
        ) &&
        saved.noMeetings.some((r) => r.troop === 'all' && r.to.endsWith('-02-06')),
      JSON.stringify(saved),
    )
    await page.getByTestId('invalid-days').waitFor()
    check(
      'meetings: warns that 2 children (Bobr, Vydra) have a day the troop no longer has',
      (await page.getByTestId('invalid-days').textContent()).includes('2 děti mají'),
    )

    // children tab follows the new days
    await page.getByTestId('invalid-days').getByRole('button').click()
    await page.getByTestId('children-vlc').waitFor()
    await page.getByTestId('missing-other').click()
    await page.getByTestId('children-ss').waitFor()
    check(
      'meetings → children: Bobr flagged „den úterý už oddíl nemá“',
      (await page.getByTestId('child-900201').getByTestId('no-day').textContent()).includes(
        'den úterý už oddíl nemá',
      ) &&
        (await page.getByTestId('child-900201').getByRole('button', { name: 'středa' }).count()) ===
          1,
    )

    // shared logic with the saved schedule
    const schedule = meetingSchedule(saved)
    const holidayMon = troopDay('vlc', latestMon, [], schedule)
    check(
      'meetings: troopDay on the holiday Monday → noMeeting with the reason',
      holidayMon.kind === 'noMeeting' && holidayMon.reason === 'státní svátek',
    )
    const expectedToday = troopDay('vlc', today, [], schedule).kind
    check(`meetings: today (${weekdayOf(today)}) for vlc → ${expectedToday}`, !!expectedToday)
  }

  // ---- the schedule where it is used ----
  {
    const pub = await openPage(browser, '/')
    await pub.page.getByText('pondělí a čtvrtek · 16:30–18:00').waitFor({ timeout: 10000 })
    check(
      'public home: troop list shows the saved days and times',
      await pub.page.getByText('středa a čtvrtek · 17:00–19:00').isVisible(),
    )
    await pub.ctx.close()

    const att = await openAs(browser, 'spravce@zare.test', '/vedouci/dochazka?oddil=vlc')
    await att.page.getByRole('heading', { name: 'Docházka', level: 1 }).waitFor()
    await att.page.getByText('načítám…').waitFor({ state: 'detached' })
    await att.page
      .getByRole('group', { name: 'Den schůzek' })
      .getByRole('button', { name: 'pondělí' })
      .click()
    const strip = att.page.getByRole('group', { name: 'Termín schůzky' })
    await strip.waitFor()
    const labels = await strip.getByRole('button').allTextContents()
    check(
      `attendance: the holiday Monday ${formatDay(latestMon)} is not offered`,
      labels.length > 0 && !labels.some((l) => l.trim().startsWith(formatDay(latestMon))),
      labels.slice(0, 3).join(' | '),
    )
    check(
      'attendance: meeting time from the schedule (16.30–18 h)',
      await att.page.getByText('schůzky pondělí · 16.30–18 h').isVisible(),
    )
    await att.ctx.close()
  }

  // ---- packing templates ----
  {
    await page.goto(new URL(`${ADMIN_URL}?zalozka=sablony`, page.url()).href, { waitUntil: 'load' })
    const list = page.getByTestId('template')
    await list.first().waitFor()
    const before = (await listDocs('packingTemplates')).length
    await page.getByRole('button', { name: '+ nová šablona' }).click()
    const draft = page.getByRole('form', { name: 'Nová šablona' })
    await draft.getByRole('button', { name: 'uložit' }).click()
    check(
      'templates: empty template → name and items required',
      (await draft.getByText('Vyplň název.').isVisible()) &&
        (await draft.getByText('Napiš aspoň jednu věc.').isVisible()),
    )
    await draft.getByLabel('Název').fill('Zkušební výprava')
    await draft.getByLabel('Věci — každá na nový řádek').fill('spacák\n\n  ešus \nbaterka')
    await draft.getByRole('button', { name: 'uložit' }).click()
    const created = await until(async () =>
      (await listDocs('packingTemplates')).find(
        (d) => fieldValue(d.fields.name) === 'Zkušební výprava',
      ),
    )
    check(
      'templates: created in Firestore with trimmed items',
      created &&
        plain(created.fields.items).join('|') === 'spacák|ešus|baterka' &&
        (await listDocs('packingTemplates')).length === before + 1,
    )
    const card = page.getByRole('form', { name: /^Zkušební výprava/ })
    await expand(card)
    await card.getByLabel('Věci — každá na nový řádek').fill('spacák\nešus\nbaterka\npláštěnka')
    await card.getByRole('button', { name: 'uložit' }).click()
    const updated = await until(async () => {
      const d = (await listDocs('packingTemplates')).find(
        (x) => fieldValue(x.fields.name) === 'Zkušební výprava',
      )
      return plain(d?.fields.items)?.length === 4 ? d : null
    })
    check('templates: edited items saved', !!updated)
    await card.getByRole('button', { name: 'smazat šablonu' }).click()
    await card.getByRole('button', { name: 'Ano, smazat' }).click()
    await card.waitFor({ state: 'detached' })
    check(
      'templates: deleted from Firestore',
      !(await listDocs('packingTemplates')).some(
        (d) => fieldValue(d.fields.name) === 'Zkušební výprava',
      ),
    )
  }

  // ---- waiting list: e-mail texts and ages ----
  {
    await tab(page, 'čekací listina').click()
    const form = page.getByTestId('email-waitlistRenewal')
    await form.waitFor()
    check(
      'waitlist: settings collapsed to bars with summaries',
      (await form.getByTestId('summary').innerText()) === 'Máte stále zájem o náš oddíl?' &&
        (await page.getByTestId('waitlist-ages').getByTestId('summary').innerText()) ===
          'upozornit od 12 let · hranice 15 let' &&
        !(await form.getByLabel('Text').isVisible()),
    )
    await expand(page.getByTestId('reset'))
    await expand(form)
    check(
      'waitlist: the reset with its explanation is here',
      (await page.getByTestId('reset').innerText()).includes('nechce nabírat další děti'),
    )
    const body = form.getByLabel('Text')
    const original = await body.inputValue()
    check(
      'waitlist e-mails: default renewal text loaded',
      original.includes('{odkaz}') && original.includes('{dite}'),
    )
    await body.fill(original.replace('{odkaz}', 'odkaz'))
    await form.getByRole('button', { name: 'uložit' }).click()
    check(
      'waitlist e-mails: renewal text without {odkaz} is refused',
      await form.getByText('Text musí obsahovat {odkaz}').isVisible(),
    )
    await body.fill(original)
    await form.getByLabel('Předmět').fill('Trvá Váš zájem o Záři?')
    check(
      'waitlist e-mails: preview follows the subject',
      (await form.getByTestId('preview-subject').innerText()) === 'Trvá Váš zájem o Záři?',
    )
    await form.getByRole('button', { name: 'uložit' }).click()
    await form.getByText('uloženo ✓').waitFor()

    const confirmation = page.getByTestId('email-waitlistConfirmation')
    await expand(confirmation)
    await confirmation.getByLabel('Předmět').fill('Jste na listině: {dite}')
    check(
      'waitlist e-mails: confirmation preview fills {dite}',
      (await confirmation.getByTestId('preview-subject').innerText()) ===
        'Jste na listině: Jan Novák',
    )
    await confirmation.getByRole('button', { name: 'uložit' }).click()
    await confirmation.getByText('uloženo ✓').waitFor()
    const emails = (await getDoc('settings/emails')).data
    check(
      'waitlist e-mails: saved to settings/emails',
      emails?.waitlistRenewal?.subject === 'Trvá Váš zájem o Záři?' &&
        emails.waitlistRenewal.body === original.trim() &&
        emails.waitlistConfirmation?.subject === 'Jste na listině: {dite}',
      JSON.stringify(emails),
    )
    await page.reload({ waitUntil: 'load' })
    await form.waitFor()
    await expand(form)
    check(
      'waitlist e-mails: saved text comes back after reload',
      (await form.getByLabel('Předmět').inputValue()) === 'Trvá Váš zájem o Záři?',
    )
    await form.getByRole('button', { name: 'vrátit původní text' }).click()
    check(
      'waitlist e-mails: „vrátit původní text“ fills the default subject',
      (await form.getByLabel('Předmět').inputValue()) === 'Máte stále zájem o náš oddíl?',
    )

    const ages = page.getByTestId('waitlist-ages')
    await expand(ages)
    check(
      'waitlist ages: current values loaded',
      (await ages.getByLabel('Hranice (let)').inputValue()) === '15',
    )
    await ages.getByLabel('Upozornit od (let)').fill('15')
    await ages.getByRole('button', { name: 'uložit' }).click()
    check(
      'waitlist ages: warning age ≥ limit is refused',
      await ages.getByText('Upozornění musí být na nižší věk').isVisible(),
    )
    await ages.getByLabel('Upozornit od (let)').fill('11')
    await ages.getByLabel('Hranice (let)').fill('14')
    await ages.getByRole('button', { name: 'uložit' }).click()
    await ages.getByText('uloženo ✓').waitFor()
    const pub = (await getDoc('settings/public')).data
    check(
      'waitlist ages: saved to settings/public',
      pub.waitlistWarnAge === 11 && pub.waitlistMaxAge === 14 && !!pub.lastWaitlistReset,
      JSON.stringify(pub),
    )

    // the confirmation e-mail after a sign-up (only logged by the emulator)
    for (const d of await listDocs('waitlist')) {
      if (fieldValue(d.fields.lastName) === 'Testovací')
        await deleteDocRest(d.name.split('/documents/')[1])
    }
    const signUp = await callFunction('submitWaitlist', {
      firstName: 'Potvrzení',
      lastName: 'Testovací',
      gender: 'girl',
      birthDate: yearsAgo(today, 8),
      grade: 2,
      parentName: 'Eva Testovací',
      email: 'potvrzeni@example.cz',
      phone: '+420 777 123 456',
      knowsSomeone: false,
      knowsWhom: '',
    })
    check('waitlist: sign-up accepted', signUp.result?.status === 'created', JSON.stringify(signUp))
    logCheck(
      'waitlist: confirmation e-mail with the saved subject',
      'Waitlist confirmation e-mail to potvrzeni@example.cz: Jste na listině: Potvrzení Testovací',
    )
  }

  // ---- e-mails about events ----
  {
    await tab(page, 'e-maily').click()
    const opened = page.getByTestId('email-registrationOpened')
    const poster = page.getByTestId('email-posterPublished')
    await expand(opened)
    await expand(poster)
    await opened.getByLabel('posílat tenhle e-mail').uncheck()
    check(
      'event e-mails: a switched-off e-mail hides its text',
      await opened.getByText('Tenhle e-mail se neposílá.').isVisible(),
    )
    await opened.getByRole('button', { name: 'uložit' }).click()
    await opened.getByText('uloženo ✓').waitFor()
    check(
      'event e-mails: the bar says a switched-off e-mail isn’t sent',
      (await opened.getByTestId('summary').innerText()) === 'neposílá se',
    )
    await poster.getByLabel('Předmět').fill('Plakátek: {akce}')
    await poster.getByRole('button', { name: 'uložit' }).click()
    await poster.getByText('uloženo ✓').waitFor()
    const emails = (await getDoc('settings/emails')).data
    check(
      'event e-mails: saved (registration e-mail off, poster subject)',
      emails.registrationOpened?.enabled === false &&
        emails.posterPublished?.subject === 'Plakátek: {akce}' &&
        emails.posterPublished.enabled === true,
      JSON.stringify(emails),
    )

    // onEventUpdated: registration opened (switched off → nothing), then the poster
    const start = `${Number(today.slice(0, 4)) + 1}-03-12`
    const event = {
      title: { stringValue: 'Zkušební výprava' },
      audience: { stringValue: 'vlc' },
      organizerIds: { arrayValue: { values: [] } },
      startDate: { stringValue: start },
      endDate: { stringValue: start },
      cancelled: { booleanValue: false },
      deleted: { booleanValue: false },
      registrationOpen: { booleanValue: false },
      posterStatus: { stringValue: 'draft' },
    }
    await patchDoc('events/test-emails', event)
    await patchDoc('events/test-emails', {
      registrationOpen: { booleanValue: true },
      registrationDeadline: { stringValue: `${Number(today.slice(0, 4)) + 1}-03-05` },
    })
    await new Promise((r) => setTimeout(r, 3000))
    check(
      'event e-mails: switched-off registration e-mail is not sent',
      !(await getDoc('events/test-emails')).data.registrationNotifiedAt,
    )
    await patchDoc('events/test-emails', { posterStatus: { stringValue: 'published' } })
    const notified = await until(async () => {
      const d = (await getDoc('events/test-emails')).data
      return d.posterNotifiedAt && d.registrationNotifiedAt ? d : null
    }, 15000)
    check('event e-mails: publishing the poster sends its e-mail once (both marked)', !!notified)
    logCheck(
      'event e-mails: poster e-mail to the paired parent of a vlc child, with the saved subject',
      'posterPublished e-mail to rodic@zare.test: Plakátek: Zkušební výprava',
    )
    await deleteDocRest('events/test-emails')
  }

  // ---- e-mails about accounts ----
  {
    const approved = page.getByTestId('email-accountApproved')
    await expand(approved)
    check(
      'account e-mails: the approval e-mail can’t be switched off',
      (await approved.getByLabel('posílat tenhle e-mail').count()) === 0,
    )
    await approved.getByLabel('Předmět').fill('Schváleno: web Záře')
    await approved.getByRole('button', { name: 'uložit' }).click()
    await approved.getByText('uloženo ✓').waitFor()
    check(
      'account e-mails: saved subject',
      (await getDoc('settings/emails')).data.accountApproved?.subject === 'Schváleno: web Záře',
    )

    // onUserWritten: the seeded pending account was announced to the admins;
    // approving it (here as a leader) e-mails the user once.
    const pending = (await listDocs('users')).find(
      (d) => fieldValue(d.fields.email) === 'cekajici@zare.test',
    )
    const path = `users/${pending.name.split('/').at(-1)}`
    check(
      'account e-mails: pending account with a note announced to the admins',
      !!(await until(async () => (await getDoc(path)).data.adminNotifiedAt, 15000)),
    )
    await patchDoc(path, { role: { stringValue: 'leader' } })
    check(
      'account e-mails: approval e-mail marked as sent',
      !!(await until(async () => (await getDoc(path)).data.approvalNotifiedAt, 15000)),
    )
    logCheck(
      'account e-mails: approval e-mail to the user with the saved subject',
      'accountApproved e-mail to cekajici@zare.test: Schváleno: web Záře',
    )
    logCheck(
      'account e-mails: admins told about the pending account',
      'newAccount e-mail to spravce@zare.test: Nový účet čeká na schválení: cekajici@zare.test',
    )
  }

  // ---- settings: camp requirements per troop ----
  {
    await tab(page, 'nastavení').click()
    const vlc = page.getByTestId('camp-vlc')
    const ss = page.getByTestId('camp-ss')
    await vlc.waitFor()
    await expand(vlc)
    await expand(ss)
    check(
      'camp: current values loaded',
      (await vlc.getByLabel('Výprav aspoň — Vlčušky').inputValue()) === '4' &&
        (await ss.getByTestId('camp-text').innerText()) ===
          'na tábor je potřeba 4 výpravy a 60 % schůzek',
    )
    await ss.getByLabel('Schůzek aspoň (%) — Skauti a skautky').fill('120')
    await page.getByRole('button', { name: 'uložit' }).click()
    check('camp: 120 % is refused', await ss.getByText('Zadej celé číslo 0–100.').isVisible())
    await ss.getByLabel('Schůzek aspoň (%) — Skauti a skautky').fill('70')
    await ss.getByLabel('Výprav aspoň — Skauti a skautky').fill('5')
    await vlc.getByRole('checkbox', { name: 'Schůzek aspoň (%)' }).uncheck()
    await vlc.getByLabel('Výprav aspoň — Vlčušky').fill('3')
    check(
      'camp: the text follows (meetings not required for vlc)',
      (await vlc.getByTestId('camp-text').innerText()) === 'na tábor je potřeba 3 výpravy',
    )
    await page.getByRole('button', { name: 'uložit' }).click()
    await page.getByText('uloženo ✓').waitFor()
    const camp = (await getDoc('settings/app')).data?.campRequirements
    check(
      'camp: saved to settings/app per troop (null = not required)',
      camp?.vlc.trips === 3 &&
        camp.vlc.meetingPct === null &&
        camp.ss.trips === 5 &&
        camp.ss.meetingPct === 70,
      JSON.stringify(camp),
    )

    const parent = await openAs(browser, 'rodic@zare.test')
    await parent.page.getByText('Vlčušky: na tábor je potřeba 3 výpravy').waitFor()
    check(
      'camp: the parent of children in both troops sees each troop’s requirement',
      await parent.page
        .getByText('Skauti a skautky: na tábor je potřeba 5 výprav a 70 % schůzek')
        .isVisible(),
    )
    await parent.ctx.close()
  }

  check('admin page: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- security rules ----
  {
    const anon = await getDoc('settings/meetings', {})
    check('rules: anyone can read settings/meetings', anon.status === 200)
    const leader = await signInRest('vedouci@zare.test', PASSWORD)
    const status = await patchDocAs(leader.idToken, 'settings/meetings', {
      noMeetings: { arrayValue: { values: [] } },
    })
    check('rules: a leader cannot write settings/meetings', status === 403)
    const tpl = await patchDocAs(leader.idToken, 'packingTemplates/seed-chata', {
      name: { stringValue: 'x' },
    })
    check('rules: a leader cannot write packing templates', tpl === 403)
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const m = await openAs(browser, 'spravce@zare.test', ADMIN_URL, {
      width,
      height: 780,
      mobile: true,
    })
    for (const [id, ready] of [
      ['deti', 'children-ss'], // spravce@'s home troop
      ['schuzky', 'troop-vlc'],
      ['cekaci-listina', 'reset'],
      ['emaily', 'email-registrationOpened'],
      ['sablony', 'template'],
      ['nastaveni', 'camp-vlc'],
    ]) {
      await m.page.goto(new URL(`${ADMIN_URL}?zalozka=${id}`, m.page.url()).href, {
        waitUntil: 'load',
      })
      await m.page.getByTestId(ready).first().waitFor()
      const overflow = await horizontalOverflow(m.page)
      check(`mobile ${width}: ${id} has no horizontal overflow`, overflow <= 0, `${overflow}px`)
      await m.page.screenshot({
        path: `${SCREENSHOTS}adminextras-${id}-${width}.png`,
        fullPage: true,
      })
    }
    check(`mobile ${width}: no console errors`, m.errors.length === 0, m.errors.join(' | '))
    await m.ctx.close()
  }
}
