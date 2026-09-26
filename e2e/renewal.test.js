// Waiting-list renewal by token (SPEC §2.3): pre-fill, confirm (original
// order kept), single-use links, withdraw, age limit and server-side checks.
// Entries awaiting renewal come from `scripts/seed-renewal.js`.

import { formatSchoolYear, gradeSchoolYear } from '../functions/src/shared/schoolYear.js'
import { ageOn } from '../functions/src/shared/waitlistRules.js'
import {
  SCREENSHOTS,
  callFunction,
  clearCollection,
  czechAge,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  pragueToday,
  runScript,
} from './lib.js'

const RESET = '2026-08-24' // settings/public as seeded
const SEEDED = { birthDate: '2017-10-02', grade: 2, gradeSchoolYear: 2026 } // see seed-renewal.js

// Seeds an entry awaiting renewal; returns the app path of its renewal link.
function seedRenewal(...args) {
  const url = runScript('seed-renewal.js', ...args)
    .trim()
    .split('\n')
    .at(-1)
  return new URL(url).pathname
}
const tokenOf = (path) => path.split('/').at(-1)
const entryNamed = async (firstName) =>
  (await listDocs('waitlist')).find((d) => fieldValue(d.fields.firstName) === firstName)

export default async function renewal({ browser, check }) {
  const today = pragueToday()
  const schoolYear = gradeSchoolYear(RESET, today)
  const heading = (page, name) => page.getByRole('heading', { name })
  const confirmBtn = (page) => page.getByRole('button', { name: 'Potvrdit zájem' })
  const open = async (path, options) => {
    const opened = await openPage(browser, path, options)
    await opened.page.waitForFunction(() => !document.querySelector('main[aria-busy="true"]'))
    return opened
  }

  await clearCollection('waitlist')

  // ---- confirm ----
  {
    const path = seedRenewal()
    const { ctx, page, errors, calls } = await open(path)
    check('form: shown for a valid token', await heading(page, 'Máte stále zájem?').isVisible())
    const child = (await page.getByTestId('child').innerText()).replace(/\s+/g, ' ')
    const age = czechAge(ageOn(SEEDED.birthDate, today), 'je jí')
    check(
      'form: read-only child info',
      child.includes('Eliška Obnovená') &&
        child.includes('dívka · narození 2. 10. 2017') &&
        child.includes(age),
      child,
    )
    check(
      'form: no editable name or date inputs',
      (await page.getByLabel('Jméno', { exact: true }).count()) === 0 &&
        (await page.getByLabel('Den narození').count()) === 0,
    )
    check(
      'form: original sign-up month shown',
      await page.getByText('Na listině je od března 2024').isVisible(),
    )
    check(
      'form: grade question uses the next school year',
      await page.getByText(`ve školním roce ${formatSchoolYear(schoolYear)}?`).isVisible(),
    )

    const shifted = Math.min(10, SEEDED.grade + (schoolYear - SEEDED.gradeSchoolYear))
    check(
      `prefill: grade moved forward (${SEEDED.grade}. → ${shifted}.)`,
      (await page
        .getByRole('button', { name: `${shifted}. třída` })
        .getAttribute('aria-pressed')) === 'true',
    )
    const prefill = [
      await page.getByLabel('Jméno a příjmení rodiče').inputValue(),
      await page.getByLabel('E-mail').inputValue(),
      await page.getByLabel('Telefon').inputValue(),
      await page.getByLabel('Koho?').inputValue(),
    ].join('|')
    check(
      'prefill: parent contact and „koho“',
      prefill === 'Jana Obnovená|jana.obnovena@example.cz|+420 731 222 333|Tonda z Vlčušek',
      prefill,
    )

    await page.getByLabel('E-mail').fill('')
    await confirmBtn(page).click()
    check(
      'validation: e-mail error, nothing sent',
      (await page.getByText('Zadejte platný e-mail.').isVisible()) &&
        !calls.includes('confirmRenewal'),
    )

    const newGrade = shifted === 10 ? 9 : shifted + 1
    await page.getByLabel('E-mail').fill('Jana.Nova@Example.cz ')
    await page.getByRole('button', { name: 'Ne', exact: true }).click()
    await page.getByRole('button', { name: `${newGrade}. třída` }).click()
    await page.screenshot({ path: `${SCREENSHOTS}renewal-desktop.png`, fullPage: true })
    await confirmBtn(page).click()
    await heading(page, 'Eliška zůstává na čekací listině').waitFor({ timeout: 15000 })
    check('confirm: success screen', true)

    const f = (await entryNamed('Eliška')).fields
    const expected = {
      status: 'active',
      firstSignedUpAt: '2024-03-11T10:00:00Z',
      grade: String(newGrade),
      gradeSchoolYear: String(schoolYear),
      email: 'jana.nova@example.cz',
      knowsSomeone: false,
      knowsWhom: '',
      renewalTokenHash: null,
      birthDate: SEEDED.birthDate,
      phone: '+420731222333',
    }
    const wrong = Object.entries(expected)
      .filter(([k, v]) => fieldValue(f[k]) !== v)
      .map(([k]) => `${k}=${JSON.stringify(fieldValue(f[k]))}`)
    check(
      'firestore: reactivated, original order kept, answers saved',
      wrong.length === 0,
      wrong.join(', '),
    )
    check('firestore: renewal date appended', f.renewalDates.arrayValue.values.length === 2)
    check('confirm: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()

    const again = await open(path)
    check(
      'used link: friendly message',
      await heading(again.page, 'Tenhle odkaz už neplatí').isVisible(),
    )
    await again.ctx.close()
  }

  // ---- unknown token ----
  {
    const { ctx, page, errors } = await open('/cekaci-listina/obnovit/nesmysl')
    check(
      'unknown token: friendly message',
      await heading(page, 'Tenhle odkaz už neplatí').isVisible(),
    )
    check('unknown token: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- withdraw ----
  {
    const { ctx, page, errors } = await open(seedRenewal())
    const withdrawBtn = page.getByRole('button', { name: 'O místo už nemáme zájem' })
    await withdrawBtn.click()
    check('withdraw: inline confirmation', await page.getByTestId('withdraw-confirm').isVisible())
    await page.getByRole('button', { name: 'Ne, ponechat' }).click()
    check(
      'withdraw: can be cancelled',
      !(await page.getByTestId('withdraw-confirm').isVisible()) && !!(await entryNamed('Eliška')),
    )
    await withdrawBtn.click()
    await page.getByRole('button', { name: 'Ano, vyřadit' }).click()
    await heading(page, 'Díky, že jste dali vědět').waitFor({ timeout: 15000 })
    check('withdraw: farewell screen, entry deleted', !(await entryNamed('Eliška')))
    check('withdraw: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- too old ----
  {
    const path = seedRenewal('--too-old')
    const { ctx, page } = await open(path)
    check(
      'too old: notice, no confirm button, can withdraw',
      (await page.getByTestId('too-old').isVisible()) &&
        (await confirmBtn(page).count()) === 0 &&
        (await page.getByRole('button', { name: 'O místo už nemáme zájem' }).isVisible()),
    )
    await ctx.close()
    const r = await callFunction('confirmRenewal', {
      token: tokenOf(path),
      grade: 10,
      parentName: 'Jana O',
      email: 'a@b.cz',
      phone: '777888999',
      knowsSomeone: false,
      knowsWhom: '',
    })
    check(
      'server: too-old renewal rejected',
      r.error?.status === 'INVALID_ARGUMENT' && r.error.details.errors.tooOld,
    )
  }

  // ---- server-side protection ----
  {
    const token = tokenOf(seedRenewal())
    const answers = {
      grade: 3,
      parentName: 'Jana Obnovená',
      email: 'jana@example.cz',
      phone: '731222333',
      knowsSomeone: false,
      knowsWhom: '',
    }
    const bad = await callFunction('confirmRenewal', { token, ...answers, phone: '12' })
    check(
      'server: invalid answers rejected',
      bad.error?.status === 'INVALID_ARGUMENT' && bad.error.details.errors.phone,
    )
    check(
      'server: entry still awaiting renewal after rejection',
      fieldValue((await entryNamed('Eliška')).fields.status) === 'awaitingRenewal',
    )
    const ok = await callFunction('confirmRenewal', {
      token,
      ...answers,
      firstName: 'Hacker',
      birthDate: '2020-01-01',
      status: 'admitted',
    })
    const f = (await entryNamed('Eliška'))?.fields
    check(
      'server: read-only fields cannot be changed',
      ok.result?.status === 'confirmed' &&
        fieldValue(f.birthDate) === SEEDED.birthDate &&
        fieldValue(f.status) === 'active',
    )
    const reuse = await callFunction('withdrawRenewal', { token })
    check(
      'server: used token rejected',
      reuse.error?.status === 'NOT_FOUND' && !!(await entryNamed('Eliška')),
    )
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await open(seedRenewal(), { width, height: 800, mobile: true })
    check(`mobile ${width}: form without overflow`, (await horizontalOverflow(page)) <= 0)
    await page.screenshot({ path: `${SCREENSHOTS}renewal-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'O místo už nemáme zájem' }).click()
    check(
      `mobile ${width}: withdraw confirmation without overflow`,
      (await horizontalOverflow(page)) <= 0,
    )
    await page.getByRole('button', { name: 'Ne, ponechat' }).click()
    await confirmBtn(page).click()
    await heading(page, 'Eliška zůstává na čekací listině').waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    check(`mobile ${width}: confirmed without overflow`, (await horizontalOverflow(page)) <= 0)
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  await clearCollection('waitlist')
}
