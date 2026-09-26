// Leaders' waiting list (SPEC §4.6): only active entries, stats, sorting,
// filters, CSV export, leaders' note and deleting (Firestore round trip),
// security rules, mobile widths, and the annual reset (resetWaitlist).
// Accounts from `scripts/seed-users.js`, entries from `scripts/seed-waitlist.js`.

import { formatSchoolYear, recruitmentYears } from '../functions/src/shared/schoolYear.js'
import { ageOn } from '../functions/src/shared/waitlistRules.js'
import {
  SCREENSHOTS,
  APP_URL,
  callFunctionAs,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  FIRESTORE,
  horizontalOverflow,
  listDocs,
  openPage,
  patchDocAs,
  pragueToday,
  runScript,
  signInRest,
} from './lib.js'
import { buildWaitlist } from '../scripts/seed-waitlist.js'

const PASSWORD = 'heslo1234'

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

// vedouci@ is a leader, spravce@ an admin (only admins reset the list).
async function openWaitlist(browser, options, email = 'vedouci@zare.test') {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.goto(`${APP_URL}/vedouci/cekaci-listina`, { waitUntil: 'load' })
  await page.waitForFunction(
    () => document.querySelector('main')?.getAttribute('aria-busy') === 'false',
  )
  return opened
}

const owner = { Authorization: 'Bearer owner' }
async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: owner })
  return res.ok ? (await res.json()).fields : null
}

export default async function waitlistAdmin({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-waitlist.js')
  const today = pragueToday()
  const seeded = buildWaitlist(today)
  const active = seeded.filter((e) => e.status === 'active')
  const name = (e) => `${e.firstName} ${e.lastName}`
  const bySignUp = [...active].sort((a, b) => a.firstSignedUpAt.localeCompare(b.firstSignedUpAt))
  const leader = await signInRest('vedouci@zare.test', PASSWORD)

  const { ctx, page, errors } = await openWaitlist(browser)
  const table = page.getByRole('region', { name: 'Čekací listina' })
  const rows = table.locator('[data-testid^="row-"]')
  const rowOf = (e) => page.getByTestId(`row-${e.id}`)
  const rowNames = () =>
    rows.evaluateAll((els) => els.map((el) => el.querySelector('.font-medium').textContent.trim()))

  // ---- list and stats ----
  {
    const text = await table.innerText()
    check(
      `list: ${active.length} active entries, archived ones hidden`,
      (await rows.count()) === active.length &&
        !text.includes('Neodpověděl') &&
        !text.includes('Přijatá'),
    )
    const girls = active.filter((e) => e.gender === 'girl').length
    const boys = active.filter((e) => e.gender === 'boy').length
    const fresh = active.filter((e) => e.firstSignedUpAt > '2026-08-24').length
    const stats = await page.getByRole('region', { name: 'Přehled listiny' }).innerText()
    check(
      'stats: count, new since reset, girls / boys, + other',
      (await page.getByTestId('stat-total').innerText()) === String(active.length) &&
        stats.includes(`z toho ${fresh} `) &&
        (await page.getByTestId('stat-gender').innerText()).replace(/\s/g, '') ===
          `${girls}/${boys}` &&
        stats.includes('+ 1 jiné'),
    )
    const youngest = active.reduce((a, b) => (b.birthDate > a.birthDate ? b : a))
    check(
      'stats: youngest and longest waiting',
      stats.includes(name(youngest)) && stats.includes(name(bySignUp[0])),
    )
    check(
      'header: leaders see the last reset date, no reset button',
      (await page.getByTestId('last-reset').innerText()) ===
        'listina naposledy resetována 24. 8. 2026' &&
        !(await page.getByRole('button', { name: 'Resetovat listinu na další rok' }).count()),
    )
    const first = await rowOf(bySignUp[0]).innerText()
    const [y, m] = bySignUp[0].firstSignedUpAt.split('-').map(Number)
    check(
      'row: sign-up month, renewals badge, grade',
      first.includes(`${m}/${y}`) &&
        first.includes(`${bySignUp[0].renewalDates.length}×`) &&
        first.includes(`${bySignUp[0].grade}.`),
      first.replace(/\s+/g, ' '),
    )
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-admin.png`, fullPage: true })
  }

  // ---- sorting ----
  {
    check('sort: oldest sign-up first', (await rowNames())[0] === name(bySignUp[0]))
    const header = table.locator('.lg\\:grid').first()
    await header.getByRole('button', { name: /Věk/ }).click()
    const youngestFirst = [...active].sort(
      (a, b) =>
        b.birthDate.localeCompare(a.birthDate) ||
        a.firstSignedUpAt.localeCompare(b.firstSignedUpAt),
    )
    const ages = await rowNames()
    const monthsOf = (e) => {
      const a = ageOn(e.birthDate, today)
      return a.years * 12 + a.months
    }
    const sortedAges = ages.map((n) => monthsOf(active.find((e) => name(e) === n)))
    check(
      'sort: by age, youngest first',
      sortedAges.every((v, i) => i === 0 || sortedAges[i - 1] <= v) &&
        monthsOf(youngestFirst[0]) === sortedAges[0],
    )
    await header.getByRole('button', { name: /Věk/ }).click()
    const reversed = (await rowNames()).map((n) => monthsOf(active.find((e) => name(e) === n)))
    check(
      'sort: second click reverses',
      reversed.every((v, i) => i === 0 || reversed[i - 1] >= v),
    )
    await header.getByRole('button', { name: /Zapsáno/ }).click()
  }

  // ---- filters ----
  {
    const status = page.getByRole('status').filter({ hasText: 'zobrazeno' })
    await page.getByRole('button', { name: 'holky', exact: true }).click()
    const girls = active.filter((e) => e.gender === 'girl').length
    check(
      'filter: girls',
      (await rows.count()) === girls &&
        (await status.innerText()).includes(`zobrazeno ${girls} z ${active.length}`),
    )
    await page.getByRole('button', { name: 'všichni' }).click()
    await page.getByRole('button', { name: /jen s poznámkou \(2\)/ }).click()
    check('filter: only with a note', (await rows.count()) === 2)
    await page.getByRole('button', { name: 'zrušit filtry' }).click()
    await page.getByLabel('Věk').selectOption('7-9')
    const sevenToNine = active.filter((e) => {
      const y = ageOn(e.birthDate, today).years
      return y >= 7 && y <= 9
    }).length
    check('filter: age 7–9', (await rows.count()) === sevenToNine)

    // CSV of the filtered rows
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Stáhnout CSV' }).click(),
    ])
    const csv = await (await download.createReadStream()).toArray()
    const content = Buffer.concat(csv).toString('utf8')
    const lines = content.split('\r\n')
    check(
      'csv: BOM, header, filtered rows, file name',
      content.startsWith('﻿"Zapsáno";"Jméno dítěte";"Pohlaví"') &&
        lines.length === sevenToNine + 1 &&
        download.suggestedFilename() === `cekaci-listina-${today}.csv`,
      `${lines.length - 1} rows, ${download.suggestedFilename()}`,
    )
    await page.getByRole('button', { name: 'zrušit filtry' }).click()
    check('filter: cleared', (await rows.count()) === active.length)
  }

  // ---- note and delete ----
  {
    const target = bySignUp[1]
    const row = rowOf(target)
    await row.getByRole('button', { expanded: false }).first().click()
    const detail = await row.innerText()
    check(
      'detail: parent contact links',
      (await row.locator(`a[href="mailto:${target.email}"]`).count()) === 1 &&
        (await row.locator(`a[href="tel:${target.phone}"]`).count()) === 1,
      detail.replace(/\s+/g, ' '),
    )
    await row.getByRole('button', { name: 'Přidat poznámku' }).click()
    await row.getByLabel(/Poznámka vedoucích/).fill('  Bratr už chodí k Vlčuškám.  ')
    await row.getByRole('button', { name: 'Hotovo' }).click()
    check(
      'note: saved trimmed, shown in a gold frame',
      (await until(
        async () =>
          fieldValue((await getDoc(`waitlist/${target.id}`))?.leaderNote) ===
          'Bratr už chodí k Vlčuškám.',
      )) &&
        (await row.getByText('Bratr už chodí k Vlčuškám.').isVisible()) &&
        (await row.evaluate((el) => getComputedStyle(el).boxShadow.includes('inset'))),
    )
    await row.getByRole('button', { name: 'upravit' }).click()
    await row.getByLabel(/Poznámka vedoucích/).fill('')
    await row.getByRole('button', { name: 'Hotovo' }).click()
    check(
      'note: emptied',
      await until(
        async () => fieldValue((await getDoc(`waitlist/${target.id}`))?.leaderNote) === '',
      ),
    )

    await row.getByRole('button', { name: 'Smazat zápis' }).click()
    check(
      'delete: asks first',
      (await row.getByRole('alert').innerText()).includes(`Opravdu smazat ${name(target)}`),
    )
    await row.getByRole('button', { name: 'Zrušit' }).click()
    await row.getByRole('button', { name: 'Smazat zápis' }).click()
    await row.getByRole('button', { name: 'Ano, smazat' }).click()
    check(
      'delete: entry gone from Firestore and the list',
      (await until(async () => !(await getDoc(`waitlist/${target.id}`)))) &&
        (await until(async () => (await rows.count()) === active.length - 1)),
    )
  }

  // ---- security ----
  {
    const status = await patchDocAs(leader.idToken, `waitlist/${bySignUp[2].id}`, {
      status: { stringValue: 'admitted' },
    })
    check('rules: leaders may change only the note', status === 403, `HTTP ${status}`)
    for (const [who, email] of [
      ['leaders', 'vedouci@zare.test'],
      ['parents', 'rodic@zare.test'],
    ]) {
      const { idToken } = await signInRest(email, PASSWORD)
      const res = await callFunctionAs(idToken, 'resetWaitlist', { admittedIds: [] })
      check(
        `reset: ${who} may not reset`,
        res.error?.status === 'PERMISSION_DENIED',
        JSON.stringify(res),
      )
    }
  }
  const errorsBefore = errors.length
  check('console: no errors', !errorsBefore, errors.join(' | '))
  await ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const problems = []
    const { ctx, page, errors } = await openWaitlist(
      browser,
      { width, height: 800, mobile: true },
      'spravce@zare.test',
    )
    const row = page.getByTestId(`row-${bySignUp[0].id}`)
    await row.getByRole('button', { expanded: false }).first().click()
    await row.getByText('Kontakt na rodiče:').waitFor()
    if (!(await row.innerText()).includes('Rodič:')) problems.push('no parent in the card detail')
    await page
      .getByRole('button', { name: 'Resetovat listinu na další rok' })
      .scrollIntoViewIfNeeded()
    const overflow = await horizontalOverflow(page)
    if (overflow > 0) problems.push(`overflow ${overflow}`)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, select')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim()),
    )
    if (small.length) problems.push(`small ${small.join(', ')}`)
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-admin-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Resetovat listinu na další rok' }).click()
    await page.getByRole('button', { name: 'Začít' }).click()
    if ((await horizontalOverflow(page)) > 0) problems.push('wizard overflow')
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-reset-${width}.png` })
    if (errors.length) problems.push(errors.join(' | '))
    await ctx.close()
    check(
      `mobile ${width}: cards, no overflow, tap targets, console errors`,
      !problems.length,
      problems.join('; '),
    )
  }

  // ---- annual reset ----
  {
    const { ctx, page, errors } = await openWaitlist(browser, {}, 'spravce@zare.test')
    const rows = page.locator('[data-testid^="row-"]')
    const remaining = bySignUp.slice(2).length + 1 // bySignUp[1] was deleted
    const admitted = [bySignUp[0], bySignUp[3]]
    await page.getByRole('button', { name: 'Resetovat listinu na další rok' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset listiny na další rok' })
    const year = formatSchoolYear(recruitmentYears(today, today).doneYear)
    check(
      'reset: explains, names the recruitment year',
      (await dialog.innerText()).includes(`nováčky na školní rok ${year} už máme nabrané`),
    )
    await dialog.getByRole('button', { name: 'Začít' }).click()
    for (const e of admitted) {
      // search ignores case and diacritics
      const q = e.lastName
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toUpperCase()
      await dialog.getByRole('searchbox').fill(q)
      await dialog.getByRole('checkbox', { name: new RegExp(name(e)) }).click()
    }
    await dialog.getByRole('searchbox').fill('')
    check(
      'reset: admitted ticked',
      (await dialog.getByTestId('admitted-count').innerText()) === '2',
    )
    await dialog.getByRole('button', { name: 'Pokračovat na e-mail' }).click()
    const emailed = remaining - admitted.length
    const preview = await dialog.innerText()
    check(
      'reset: e-mail preview with sender, subject and a child',
      preview.includes('Skautský oddíl Záře <zare@skaut.cz>') &&
        preview.includes('Máte stále zájem o náš oddíl?') &&
        preview.includes(name(bySignUp[2])),
    )
    await dialog.getByRole('button', { name: `Odeslat ${emailed} e-mailů` }).click()
    check(
      'reset: asks to confirm',
      (await dialog.getByRole('alert').innerText()).includes('Tohle nejde vzít zpět'),
    )
    await dialog.getByRole('button', { name: 'Ano, odeslat' }).click()
    await dialog.getByText('Odesláno', { exact: true }).waitFor({ timeout: 15000 })
    check(
      'reset: done in the wizard',
      (await dialog.innerText()).includes(`odesláno ${emailed} z ${emailed}`),
    )
    await dialog.getByRole('button', { name: 'Hotovo' }).click()

    const docs = await listDocs('waitlist')
    const statusOf = (e) => fieldValue(docs.find((d) => d.name.endsWith(`/${e.id}`))?.fields.status)
    const awaiting = docs.filter((d) => fieldValue(d.fields.status) === 'awaitingRenewal')
    check(
      'reset: admitted archived, others await renewal with a token, previous reset deleted',
      admitted.every((e) => statusOf(e) === 'admitted') &&
        awaiting.length === emailed &&
        awaiting.every((d) => /^[0-9a-f]{64}$/.test(fieldValue(d.fields.renewalTokenHash))) &&
        !docs.some((d) => fieldValue(d.fields.lastName) === 'Neodpověděl') &&
        !docs.some((d) => fieldValue(d.fields.lastName) === 'Přijatá'),
    )
    const resets = await listDocs('waitlistResets')
    const log = resets[0]?.fields ?? {}
    check(
      'reset: settings/public and the reset log updated',
      fieldValue((await getDoc('settings/public')).lastWaitlistReset) === today &&
        resets.length === 1 &&
        fieldValue(log.emailedCount) === String(emailed) &&
        fieldValue(log.admittedCount) === '2' &&
        fieldValue(log.deletedCount) === '2' &&
        fieldValue(log.recruitmentYear) === String(recruitmentYears(today, today).doneYear),
    )
    const [y, m, d] = today.split('-').map(Number)
    check(
      'reset: banner, empty list, new reset date',
      (
        await page.getByRole('status').filter({ hasText: 'Listina resetována' }).innerText()
      ).includes(`e-mail s odkazem odešel ${emailed} rodičům`) &&
        (await until(async () => (await rows.count()) === 0)) &&
        (await page.getByText('Listina je teď prázdná').isVisible()) &&
        (await page.getByTestId('last-reset').innerText()) === `naposledy ${d}. ${m}. ${y}`,
    )
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-after-reset.png`, fullPage: true })
    check('reset: no console errors', !errors.length, errors.join(' | '))
    await ctx.close()
  }
}
