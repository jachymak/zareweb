// Login / registration (SPEC §2.4): e-mail and Google login, redirect by role,
// route guards, registration with a note, waiting for approval (live), no
// access, password reset, security rules for own profiles, mobile widths.
// Accounts come from `scripts/seed-users.js` (password `heslo1234`).

import {
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  horizontalOverflow,
  listDocs,
  listOobCodes,
  openPage,
  patchDoc,
  patchDocAs,
  runScript,
  signInRest,
} from './lib.js'

const PASSWORD = 'heslo1234'
const LOGIN_URL = /\/prihlaseni(\?|$)/

const userDoc = async (email) =>
  (await listDocs('users')).find((d) => fieldValue(d.fields.email) === email)
const uidOf = (doc) => doc.name.split('/').at(-1)
const pathOf = (page) => new URL(page.url()).pathname + new URL(page.url()).search

// Failed sign-ins log the 400 response; that's expected, not an app error.
const appErrors = (errors) => errors.filter((e) => !e.includes('400'))

async function signIn(page, email, password = PASSWORD) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
}

const cardTitle = (page, name) => page.getByRole('heading', { level: 2, name })

export default async function login({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')

  // ---- login form, validation, wrong password ----
  {
    const { ctx, page, errors } = await openPage(browser, '/prihlaseni')
    await cardTitle(page, 'Přihlášení').waitFor()
    check(
      'login: intro and card shown',
      (await page.getByRole('heading', { level: 1, name: 'Oddílový zápisník' }).isVisible()) &&
        (await page.getByRole('button', { name: 'Přihlásit se Googlem' }).isVisible()),
    )
    await page.screenshot({ path: `${SCREENSHOTS}login-desktop.png`, fullPage: true })

    await page.getByRole('button', { name: 'Přihlásit se →' }).click()
    check(
      'login: empty form shows field errors',
      (await page.getByText('Zadej platný e-mail.').isVisible()) &&
        (await page.getByText('Zadej heslo.').isVisible()),
    )

    await signIn(page, 'vedouci@zare.test', 'spatneheslo')
    const alert = page.getByRole('alert')
    await alert.waitFor({ timeout: 10000 })
    check(
      'login: wrong password message',
      (await alert.innerText()) === 'Špatný e-mail nebo heslo.',
    )
    check('login: no app console errors', appErrors(errors).length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- leader: guard → login → back to the requested page ----
  {
    const { ctx, page, errors } = await openPage(browser, '/vedouci')
    await page.waitForURL(LOGIN_URL)
    check('guard: signed out /vedouci → login', pathOf(page) === '/prihlaseni?next=/vedouci')

    await signIn(page, 'vedouci@zare.test')
    await page.waitForURL('**/vedouci', { timeout: 10000 })
    await page.getByRole('heading', { name: 'Nejbližší akce' }).waitFor()
    check(
      'leader: lands on /vedouci with e-mail in the header',
      await page.getByText('vedouci@zare.test').isVisible(),
    )

    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Nejbližší akce' }).waitFor()
    check('leader: session survives a reload', pathOf(page) === '/vedouci')

    await page.goto(page.url().replace('/vedouci', '/clenove'), { waitUntil: 'load' })
    await page.waitForURL('**/vedouci')
    check('leader: /clenove → /vedouci', true)
    await page.goto(page.url().replace('/vedouci', '/prihlaseni'), { waitUntil: 'load' })
    await page.waitForURL('**/vedouci')
    check('leader: /prihlaseni → /vedouci', true)

    await page.getByRole('button', { name: 'odhlásit' }).click()
    await cardTitle(page, 'Přihlášení').waitFor()
    check('leader: sign out → login form', LOGIN_URL.test(page.url()))
    await page.goto(page.url().replace(/\/prihlaseni.*/, '/vedouci'), { waitUntil: 'load' })
    await page.waitForURL(LOGIN_URL)
    check('leader: after sign out /vedouci is guarded again', true)
    check('leader: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- admin and parent ----
  for (const [email, home, other] of [
    ['spravce@zare.test', '/vedouci', null],
    ['rodic@zare.test', '/clenove', '/vedouci'],
  ]) {
    const { ctx, page } = await openPage(browser, '/prihlaseni')
    await signIn(page, email)
    await page.waitForURL(`**${home}`, { timeout: 10000 })
    check(`${email}: lands on ${home}`, true)
    if (other) {
      await page.goto(page.url().replace(home, other), { waitUntil: 'load' })
      await page.waitForURL(`**${home}`)
      check(`${email}: ${other} → ${home}`, true)
    }
    await ctx.close()
  }

  // ---- pending: waiting screen, guarded areas, live approval ----
  {
    const { ctx, page, errors } = await openPage(browser, '/prihlaseni')
    await signIn(page, 'cekajici@zare.test')
    await cardTitle(page, 'Čekáme na schválení').waitFor({ timeout: 10000 })
    check(
      'pending: waiting screen with the saved note',
      (await page.getByRole('heading', { level: 1, name: 'Účet čeká na schválení' }).isVisible()) &&
        (await page.getByTestId('saved-note').innerText()) === 'Anna Nováková (Žabka), vlčušky',
    )
    await page.screenshot({ path: `${SCREENSHOTS}login-pending-desktop.png`, fullPage: true })

    await page.goto(page.url().replace(/\/prihlaseni.*/, '/clenove'), { waitUntil: 'load' })
    await cardTitle(page, 'Čekáme na schválení').waitFor()
    check('pending: /clenove → waiting screen', pathOf(page) === '/prihlaseni')

    const doc = await userDoc('cekajici@zare.test')
    await patchDoc(`users/${uidOf(doc)}`, { role: { stringValue: 'parent' } })
    await page.waitForURL('**/clenove', { timeout: 10000 })
    check('pending: approval moves the open page to /clenove', true)

    await patchDoc(`users/${uidOf(doc)}`, { role: { stringValue: 'none' } })
    await cardTitle(page, 'Účet nemá přístup').waitFor({ timeout: 10000 })
    check('pending: access removed live → no-access screen', pathOf(page) === '/prihlaseni')
    check('pending: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- rejected account ----
  {
    const { ctx, page } = await openPage(browser, '/prihlaseni')
    await signIn(page, 'zamitnuty@zare.test')
    await cardTitle(page, 'Účet nemá přístup').waitFor({ timeout: 10000 })
    check(
      'none: no-access screen with the account e-mail',
      await page.getByText('zamitnuty@zare.test').isVisible(),
    )
    await page.getByRole('button', { name: 'odhlásit se' }).click()
    await cardTitle(page, 'Přihlášení').waitFor()
    check('none: sign out → login form', true)
    await ctx.close()
  }

  // ---- forgotten password ----
  {
    const { ctx, page } = await openPage(browser, '/prihlaseni')
    await page.getByRole('button', { name: 'zapomenuté heslo' }).click()
    await cardTitle(page, 'Zapomenuté heslo').waitFor()
    await page.getByRole('button', { name: 'Poslat odkaz →' }).click()
    check('forgot: e-mail required', await page.getByText('Zadej platný e-mail.').isVisible())

    await page.getByLabel('E-mail').fill('rodic@zare.test')
    await page.getByRole('button', { name: 'Poslat odkaz →' }).click()
    const done = page.getByText('Hotovo — mrkni do e-mailu (i do spamu).')
    await done.waitFor({ timeout: 10000 })
    const codes = await listOobCodes()
    check(
      'forgot: reset e-mail sent (emulator oobCodes)',
      codes.some((c) => c.email === 'rodic@zare.test' && c.requestType === 'PASSWORD_RESET'),
    )

    await page.getByLabel('E-mail').fill('neexistuje@zare.test')
    await page.getByRole('button', { name: 'Poslat odkaz →' }).click()
    await page.waitForTimeout(1500)
    check(
      'forgot: unknown e-mail gets the same confirmation',
      (await done.isVisible()) && (await page.getByRole('alert').count()) === 0,
    )
    await page.getByRole('button', { name: '← zpět na přihlášení' }).click()
    check('forgot: back to login', await cardTitle(page, 'Přihlášení').isVisible())
    await ctx.close()
  }

  // ---- registration ----
  {
    const { ctx, page, errors } = await openPage(browser, '/prihlaseni')
    await page.getByRole('button', { name: 'nemám účet, chci ho založit' }).click()
    await cardTitle(page, 'Založení účtu').waitFor()
    check(
      'register: explains how approval works',
      await page.getByText('Jak to funguje').isVisible(),
    )
    await page.screenshot({ path: `${SCREENSHOTS}login-register-desktop.png`, fullPage: true })

    const submit = page.getByRole('button', { name: 'Založit účet →' })
    await submit.click()
    const messages = [
      'Vyplň své jméno.',
      'Zadej platný e-mail.',
      'Heslo musí mít alespoň 8 znaků.',
      'Napiš, koho u nás máš — podle toho účet schválíme.',
    ]
    const shown = await Promise.all(messages.map((m) => page.getByText(m).isVisible()))
    check('register: all fields required (incl. the note)', shown.every(Boolean), String(shown))

    await page.getByLabel('Tvoje jméno a příjmení').fill('Jana Registrovaná')
    await page.getByLabel('E-mail').fill('Jana.Reg@Example.cz ')
    await page.getByLabel('Heslo', { exact: true }).fill('kratke')
    await page.getByLabel('Koho u nás máš?').fill('  Tonda Registrovaný (Kulíšek), vlčušky ')
    await submit.click()
    check(
      'register: short password rejected',
      (await page.getByText(messages[2]).isVisible()) &&
        !(await page.getByText(messages[3]).isVisible()),
    )
    await page.getByLabel('Heslo', { exact: true }).fill('tajneheslo')
    await submit.click()
    await cardTitle(page, 'Čekáme na schválení').waitFor({ timeout: 10000 })
    check('register: waiting screen after sign-up', true)

    const f = (await userDoc('jana.reg@example.cz'))?.fields ?? {}
    const saved = {
      role: fieldValue(f.role),
      displayName: fieldValue(f.displayName),
      note: fieldValue(f.note),
      createdAt: !!fieldValue(f.createdAt),
    }
    check(
      'register: users/{uid} saved as pending with the note',
      JSON.stringify(saved) ===
        JSON.stringify({
          role: 'pending',
          displayName: 'Jana Registrovaná',
          note: 'Tonda Registrovaný (Kulíšek), vlčušky',
          createdAt: true,
        }),
      JSON.stringify(saved),
    )

    await page.getByRole('button', { name: 'upravit poznámku' }).click()
    await page.getByLabel('Koho u nás máš?').fill('Tonda a Bára Registrovaní, vlčušky')
    await page.getByRole('button', { name: 'Uložit →' }).click()
    await page.getByTestId('saved-note').waitFor()
    const note = fieldValue((await userDoc('jana.reg@example.cz')).fields.note)
    check('register: edited note saved', note === 'Tonda a Bára Registrovaní, vlčušky', note)

    await page.getByRole('button', { name: 'odhlásit se' }).click()
    await page.getByRole('button', { name: 'nemám účet, chci ho založit' }).click()
    await page.getByLabel('Tvoje jméno a příjmení').fill('Jana Znovu')
    await page.getByLabel('E-mail').fill('jana.reg@example.cz')
    await page.getByLabel('Heslo', { exact: true }).fill('tajneheslo')
    await page.getByLabel('Koho u nás máš?').fill('Tonda')
    await submit.click()
    const alert = page.getByRole('alert')
    await alert.waitFor({ timeout: 10000 })
    check(
      'register: existing e-mail refused',
      (await alert.innerText()).startsWith('Účet s tímhle e-mailem už existuje'),
    )
    check('register: no app console errors', appErrors(errors).length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- Google (Auth emulator's account picker) ----
  {
    const { ctx, page, errors } = await openPage(browser, '/prihlaseni')
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Přihlásit se Googlem' }).click(),
    ])
    await popup.waitForLoadState('load')
    await popup.locator('#add-account-button button').click()
    await popup.locator('#email-input').fill('petr.google@example.cz')
    await popup.locator('#display-name-input').fill('Petr Googlový')
    await popup.locator('#sign-in').click()

    await cardTitle(page, 'Čekáme na schválení').waitFor({ timeout: 15000 })
    check(
      'google: first login → waiting screen asking for the note',
      await page.getByLabel('Koho u nás máš?').isVisible(),
    )
    let f = (await userDoc('petr.google@example.cz'))?.fields ?? {}
    check(
      'google: pending profile created without a note',
      fieldValue(f.role) === 'pending' &&
        fieldValue(f.displayName) === 'Petr Googlový' &&
        fieldValue(f.note) === null,
    )

    await page.getByRole('button', { name: 'Uložit →' }).click()
    check(
      'google: note required',
      await page.getByText('Napiš, koho u nás máš — podle toho účet schválíme.').isVisible(),
    )
    await page.getByLabel('Koho u nás máš?').fill('Kuba Googlový, skauti')
    await page.getByRole('button', { name: 'Uložit →' }).click()
    await page.getByTestId('saved-note').waitFor({ timeout: 10000 })
    f = (await userDoc('petr.google@example.cz')).fields
    check('google: note saved', fieldValue(f.note) === 'Kuba Googlový, skauti')
    check('google: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- security rules for own profiles ----
  {
    const pending = await signInRest('cekajici@zare.test', PASSWORD)
    const pendingDoc = `users/${pending.uid}`
    await patchDoc(pendingDoc, { role: { stringValue: 'pending' } })
    check(
      'rules: pending user may update the note',
      (await patchDocAs(pending.idToken, pendingDoc, { note: { stringValue: 'Anna' } })) === 200,
    )
    check(
      'rules: pending user may not set their role',
      (await patchDocAs(pending.idToken, pendingDoc, { role: { stringValue: 'admin' } })) === 403,
    )
    const parent = await signInRest('rodic@zare.test', PASSWORD)
    check(
      'rules: approved user may not change the note',
      (await patchDocAs(parent.idToken, `users/${parent.uid}`, {
        note: { stringValue: 'x' },
      })) === 403,
    )
    check(
      'rules: user may not edit another profile',
      (await patchDocAs(parent.idToken, pendingDoc, { note: { stringValue: 'x' } })) === 403,
    )
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openPage(browser, '/prihlaseni', {
      width,
      height: 800,
      mobile: true,
    })
    await cardTitle(page, 'Přihlášení').waitFor()
    const smallTargets = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('a, button, input, textarea')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height < 24 && !el.closest('p')
          })
          .map((el) => el.textContent.trim() || el.name),
      )
    const overflow = []
    const small = []
    const measure = async (screen) => {
      if ((await horizontalOverflow(page)) > 0) overflow.push(screen)
      small.push(...(await smallTargets()))
    }
    await measure('login')
    await page.screenshot({ path: `${SCREENSHOTS}login-${width}.png`, fullPage: true })

    await page.getByRole('button', { name: 'nemám účet, chci ho založit' }).click()
    await page.getByRole('button', { name: 'Založit účet →' }).click()
    await measure('register')
    await page.screenshot({ path: `${SCREENSHOTS}login-register-${width}.png`, fullPage: true })

    await page.getByRole('button', { name: '← zpět na přihlášení' }).click()
    await signIn(page, 'cekajici@zare.test')
    await cardTitle(page, 'Čekáme na schválení').waitFor({ timeout: 10000 })
    await measure('pending')
    await page.screenshot({ path: `${SCREENSHOTS}login-pending-${width}.png`, fullPage: true })

    check(`mobile ${width}: no horizontal overflow`, overflow.length === 0, overflow.join(', '))
    check(`mobile ${width}: tap targets ≥ 24px`, small.length === 0, small.join(', '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  runScript('seed-users.js') // leave the test accounts in their seeded state
}
