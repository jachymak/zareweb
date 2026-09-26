// Waiting-list sign-up (SPEC §2.2): validation, form behaviour, the stored
// Firestore document, duplicates, age limits and server-side validation.

import { formatSchoolYear, gradeSchoolYear } from '../functions/src/shared/schoolYear.js'
import { ageOn, suggestGrade } from '../functions/src/shared/waitlistRules.js'
import {
  SCREENSHOTS,
  callFunction,
  clearCollection,
  czechAge,
  dateKeys,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  pragueToday,
  yearsAgo,
} from './lib.js'

const RESET = '2026-08-24' // settings/public as seeded

async function fillChild(page, { first, last, gender, birthDate }) {
  await page.getByLabel('Jméno', { exact: true }).fill(first)
  await page.getByLabel('Příjmení', { exact: true }).fill(last)
  await page.getByRole('button', { name: gender }).click()
  await typeDate(page, birthDate)
}

// Types the date into the day field only; auto-advance fills the rest.
async function typeDate(page, birthDate) {
  await page.getByLabel('Den narození').focus() // focus selects the old value
  await page.keyboard.type(dateKeys(birthDate))
}

async function fillParent(page) {
  await page.getByLabel('Jméno a příjmení rodiče').fill('Petra Nováková')
  await page.getByLabel('E-mail').fill('petra.novakova@example.cz')
  await page.getByLabel('Telefon').pressSequentially('604123456')
}

export default async function waitlist({ browser, check }) {
  const today = pragueToday()
  const schoolYear = gradeSchoolYear(RESET, today)
  const submit = (page) => page.getByRole('button', { name: 'Zapsat na čekací listinu' })
  const pressed = (page, name) => page.getByRole('button', { name }).getAttribute('aria-pressed')
  const open = async (options) => {
    const opened = await openPage(browser, '/cekaci-listina', options)
    await submit(opened.page).waitFor()
    return opened
  }

  await clearCollection('waitlist')

  // ---- desktop ----
  {
    const { ctx, page, errors, calls } = await open()
    check(
      'grade question uses the next school year',
      await page
        .getByText(`Do jaké třídy půjde ve školním roce ${formatSchoolYear(schoolYear)}?`)
        .isVisible(),
    )

    await submit(page).click()
    check(
      'empty submit: summary shown',
      await page.getByText('Doplňte prosím zvýrazněná pole.').isVisible(),
    )
    const shown = await page.locator('form .text-red').allInnerTexts()
    check('empty submit: field errors shown', shown.length >= 9, `${shown.length} messages`)
    check('empty submit: no function call', calls.length === 0)
    check(
      'empty submit: focus on first invalid field',
      await page.evaluate(() => document.activeElement?.closest('[data-invalid]') !== null),
    )

    const birthDate = yearsAgo(today, 8, 40) // 8 years and ~1 month
    await fillChild(page, { first: 'Anežka', last: 'Nováková', gender: 'dívka', birthDate })
    const typed = await Promise.all(
      ['Den', 'Měsíc', 'Rok'].map((l) => page.getByLabel(`${l} narození`).inputValue()),
    )
    check(
      'date: auto-advance fills DD / MM / RRRR',
      typed.join('') === dateKeys(birthDate),
      typed.join('.'),
    )
    const ageText = await page.getByTestId('age').innerText()
    const expectedAge = czechAge(ageOn(birthDate, today), 'je jí')
    check('date: age text with Czech plurals', ageText === expectedAge, ageText)

    const suggested = suggestGrade(birthDate, schoolYear)
    check(
      `grade: pre-filled from birth date (${suggested}.)`,
      (await pressed(page, `${suggested}. třída`)) === 'true',
    )
    check('grade: hint shown', await page.getByText('předvyplněno podle data narození').isVisible())
    const manual = suggested === 1 ? 2 : suggested - 1
    await page.getByRole('button', { name: `${manual}. třída` }).click()
    check(
      'grade: manual click overrides, hint hidden',
      (await pressed(page, `${manual}. třída`)) === 'true' &&
        !(await page.getByText('předvyplněno podle data narození').isVisible()),
    )

    await fillParent(page)
    check(
      'phone: formatted in groups of 3',
      (await page.getByLabel('Telefon').inputValue()) === '604 123 456',
    )
    await page.getByRole('button', { name: 'Ano', exact: true }).click()
    await submit(page).click()
    check(
      'knows someone: „Koho?“ required',
      await page.getByText('Napište, koho znáte.').isVisible(),
    )
    await page.getByLabel('Koho?').fill('Bára Svobodová z Vlčušek')
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-desktop.png`, fullPage: true })

    await submit(page).click()
    await page
      .getByRole('heading', { name: 'Anežka je na čekací listině' })
      .waitFor({ timeout: 15000 })
    check(
      'submit: success screen with e-mail',
      await page.getByText('petra.novakova@example.cz').isVisible(),
    )

    const docs = await listDocs('waitlist')
    const f = docs[0]?.fields ?? {}
    check('firestore: exactly one entry', docs.length === 1, `${docs.length}`)
    const expected = {
      firstName: 'Anežka',
      lastName: 'Nováková',
      gender: 'girl',
      birthDate,
      grade: String(manual),
      gradeSchoolYear: String(schoolYear),
      parentName: 'Petra Nováková',
      email: 'petra.novakova@example.cz',
      phone: '+420604123456',
      knowsSomeone: true,
      knowsWhom: 'Bára Svobodová z Vlčušek',
      status: 'active',
      leaderNote: '',
    }
    const wrong = Object.entries(expected)
      .filter(([k, v]) => fieldValue(f[k]) !== v)
      .map(([k]) => `${k}=${fieldValue(f[k])}`)
    check('firestore: stored fields match the form', wrong.length === 0, wrong.join(', '))
    check('firestore: firstSignedUpAt is a server timestamp', !!f.firstSignedUpAt?.timestampValue)

    await page.getByRole('button', { name: 'Zapsat další dítě' }).click()
    const parent = [
      await page.getByLabel('Jméno a příjmení rodiče').inputValue(),
      await page.getByLabel('E-mail').inputValue(),
      await page.getByLabel('Telefon').inputValue(),
    ].join('|')
    check(
      'another child: parent contact kept',
      parent === 'Petra Nováková|petra.novakova@example.cz|604 123 456',
      parent,
    )
    check(
      'another child: child fields cleared',
      (await page.getByLabel('Jméno', { exact: true }).inputValue()) === '',
    )

    // Duplicate — case and diacritics differ
    await fillChild(page, { first: 'anezka', last: 'NOVAKOVA', gender: 'dívka', birthDate })
    await page.getByRole('button', { name: 'Ne', exact: true }).click()
    await submit(page).click()
    await page.getByTestId('duplicate').waitFor({ timeout: 15000 })
    check(
      'duplicate: message shown',
      (await page.getByTestId('duplicate').innerText()) === 'anezka už na čekací listině je.',
    )
    check('duplicate: no second entry', (await listDocs('waitlist')).length === 1)

    // Age limits (settings/public: warn 12, max 15)
    await typeDate(page, yearsAgo(today, 13))
    check(
      'warn age (13): info shown, can continue',
      (await page
        .getByText('Děti od 12 let standardně už nenabíráme, ale zapíšeme ji i tak')
        .isVisible()) && (await submit(page).isVisible()),
    )
    await typeDate(page, yearsAgo(today, 16))
    check(
      'max age (16): rest hidden, cannot submit',
      (await page.getByTestId('too-old').isVisible()) && !(await submit(page).isVisible()),
    )

    await page.getByLabel('Den narození').fill('31')
    await page.getByLabel('Měsíc narození').fill('04')
    await page.getByLabel('Rok narození').fill('2018')
    await submit(page).click()
    check(
      'invalid date 31. 4.: error',
      await page.getByText('Zadejte platné datum narození').isVisible(),
    )
    check('desktop: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- server-side validation (bypassing the form) ----
  {
    const bad = await callFunction('submitWaitlist', {
      firstName: 'Test',
      lastName: 'Server',
      gender: 'boy',
      birthDate: yearsAgo(today, 17),
      grade: 4,
      parentName: 'Jan Server',
      email: 'jan@example.cz',
      phone: '123',
      knowsSomeone: false,
      knowsWhom: '',
    })
    const errs = bad.error?.details?.errors ?? {}
    check(
      'server: rejects invalid data',
      bad.error?.status === 'INVALID_ARGUMENT' && errs.phone && errs.tooOld,
      JSON.stringify(errs),
    )
    check('server: nothing stored for invalid data', (await listDocs('waitlist')).length === 1)
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await open({ width, height: 800, mobile: true })
    check(`mobile ${width}: no horizontal overflow (empty)`, (await horizontalOverflow(page)) <= 0)
    await fillChild(page, {
      first: `Kuba${width}`,
      last: 'Mobilní',
      gender: 'chlapec',
      birthDate: yearsAgo(today, 9, 100),
    })
    await fillParent(page)
    await page.getByRole('button', { name: 'Ne', exact: true }).click()
    check(`mobile ${width}: no horizontal overflow (filled)`, (await horizontalOverflow(page)) <= 0)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('form button, form input')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.height < 40 || r.width < 40
        })
        .map((el) => el.getAttribute('aria-label') || el.textContent.trim()),
    )
    check(`mobile ${width}: controls ≥ 40 px`, small.length === 0, small.join(', '))
    await page.screenshot({ path: `${SCREENSHOTS}waitlist-${width}.png`, fullPage: true })
    await submit(page).click()
    await page
      .getByRole('heading', { name: `Kuba${width} je na čekací listině` })
      .waitFor({ timeout: 15000 })
    check(
      `mobile ${width}: submitted, no overflow on success`,
      (await horizontalOverflow(page)) <= 0,
    )
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
  check('firestore: 3 entries in total', (await listDocs('waitlist')).length === 3)
}
