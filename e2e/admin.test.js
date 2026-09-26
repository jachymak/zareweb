// Administration — accounts & pairing (SPEC §4.8): access, suggestions,
// pairing approves a pending account live, picker, unpairing, reject /
// reactivate / delete, leader roles, security rules, mobile widths.
// Accounts from `scripts/seed-users.js`, children from `scripts/seed-members.js`.

import {
  SCREENSHOTS,
  callFunctionAs,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  horizontalOverflow,
  listDocs,
  openPage,
  patchDoc,
  patchDocAs,
  runScript,
  signInRest,
  signUpRest,
} from './lib.js'

const PASSWORD = 'heslo1234'
const ADMIN_URL = '/vedouci/administrace'

const userDoc = async (email) =>
  (await listDocs('users')).find((d) => fieldValue(d.fields.email) === email)
const roleOf = async (email) => fieldValue((await userDoc(email))?.fields.role)
const parentUidsOf = async (memberId) =>
  (
    (await listDocs('members')).find((d) => d.name.endsWith(`/${memberId}`))?.fields.parentUids
      ?.arrayValue.values ?? []
  ).map(fieldValue)

// Polls until `fn` returns truthy (live updates, async writes).
async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function signIn(page, email) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
}

// Opens a page, signs in and waits for the account's home.
async function openAs(browser, email, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  await signIn(opened.page, email)
  await opened.page.waitForURL(/\/(vedouci|clenove)$/, { timeout: 10000 })
  return opened
}

const card = (page, email) => page.getByRole('article', { name: email })
const filter = (page, label) => page.getByRole('button', { name: new RegExp(`^${label} \\d+$`) })

export default async function admin({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')

  // ---- access ----
  {
    const { ctx, page } = await openAs(browser, 'vedouci@zare.test')
    check(
      'access: leader home has no Administrace link',
      (await page.getByRole('link', { name: 'Administrace →' }).count()) === 0,
    )
    await page.goto(page.url() + '/administrace', { waitUntil: 'load' })
    await page.waitForURL(/\/vedouci$/)
    check('access: leader is sent from Administrace to /vedouci', true)
    await ctx.close()
  }

  const { ctx, page, errors } = await openAs(browser, 'spravce@zare.test')
  await page.getByRole('link', { name: 'Administrace →' }).click()
  await page.getByRole('heading', { level: 1, name: 'Administrace' }).waitFor()
  await card(page, 'cekajici@zare.test').waitFor()
  check('access: admin opens Administrace from the leader home', page.url().endsWith(ADMIN_URL))

  // ---- pending account: note + suggestions ----
  {
    check(
      'list: opens on pending accounts (1)',
      (await filter(page, 'Čekající').getAttribute('aria-pressed')) === 'true' &&
        (await filter(page, 'Čekající').innerText()).endsWith('1'),
    )
    const pending = card(page, 'cekajici@zare.test')
    check(
      'pending: note shown',
      (await pending.getByTestId('note').innerText()) === 'Anna Nováková (Žabka), vlčušky',
    )
    // Parents' contacts load after the accounts; wait for the e-mail match.
    await pending.getByText('e-mail rodiče ve skautISu', { exact: false }).waitFor()
    const suggestions = await pending.getByTestId('suggestions').innerText()
    check(
      'pending: Žabka suggested by e-mail and note',
      suggestions.includes('Žabka') &&
        suggestions.includes('e-mail rodiče ve skautISu, jméno v poznámce') &&
        !suggestions.includes('Sojka'),
      suggestions.replace(/\s+/g, ' '),
    )
    await page.screenshot({ path: `${SCREENSHOTS}admin-desktop.png`, fullPage: true })
  }

  // ---- pairing approves live ----
  {
    const other = await openPage(browser, '/prihlaseni')
    await signIn(other.page, 'cekajici@zare.test')
    await other.page.getByRole('heading', { name: 'Čekáme na schválení' }).waitFor()
    await card(page, 'cekajici@zare.test')
      .getByRole('button', { name: 'Přiřadit Anna Nováková' })
      .click()
    await other.page.waitForURL(/\/clenove$/, { timeout: 10000 })
    check('pair: the waiting user is moved to /clenove live', true)
    const uid = (await userDoc('cekajici@zare.test')).name.split('/').at(-1)
    check(
      'pair: Firestore — child paired and role parent',
      (await parentUidsOf('900101')).includes(uid) &&
        (await roleOf('cekajici@zare.test')) === 'parent',
    )
    await other.ctx.close()
  }

  // ---- a new registration appears live; picker ----
  const newEmail = 'nova.registrace@example.cz'
  {
    const { uid } = await signUpRest(newEmail, PASSWORD)
    await patchDoc(`users/${uid}`, {
      email: { stringValue: newEmail },
      displayName: { stringValue: 'Jana Nová' },
      role: { stringValue: 'pending' },
      note: { stringValue: 'Tonda Registrovaný (Kulíšek), vlčušky' },
      createdAt: { timestampValue: new Date().toISOString() },
    })
    const fresh = card(page, newEmail)
    await fresh.waitFor({ timeout: 10000 })
    check('live: new registration appears without reload', true)
    const suggestions = await fresh.getByTestId('suggestions').innerText()
    check(
      'suggestions: Kulíšek by note only',
      suggestions.includes('Kulíšek') &&
        suggestions.includes('jméno v poznámce') &&
        !suggestions.includes('e-mail'),
      suggestions.replace(/\s+/g, ' '),
    )

    await fresh.getByRole('button', { name: '+ přiřadit dítě' }).click()
    const search = fresh.getByRole('searchbox', { name: 'Hledat dítě' })
    await search.fill('jez')
    check(
      'picker: inactive child not offered',
      await fresh.getByText('Nic nenalezeno.').isVisible(),
    )
    await search.fill('vyd')
    await fresh.getByRole('button', { name: /Vydra/ }).click()
    await filter(page, 'Rodiče').click()
    const parentCard = card(page, newEmail)
    await parentCard.waitFor()
    check(
      'picker: child paired, account moved to parents',
      (await parentCard.getByRole('button', { name: 'Odebrat Matěj Pokorný' }).isVisible()) &&
        (await until(async () => (await roleOf(newEmail)) === 'parent')),
    )

    await parentCard.getByRole('button', { name: 'Odebrat Matěj Pokorný' }).click()
    check(
      'unpair: last child removed → back to pending',
      (await until(async () => (await roleOf(newEmail)) === 'pending')) &&
        (await parentUidsOf('900202')).length === 0,
    )
  }

  // ---- reject, reactivate, delete ----
  {
    await filter(page, 'Čekající').click()
    await card(page, newEmail).getByRole('button', { name: 'zamítnout' }).click()
    check('reject: role none', await until(async () => (await roleOf(newEmail)) === 'none'))

    await filter(page, 'Bez přístupu').click()
    await card(page, newEmail).getByRole('button', { name: 'znovu aktivovat' }).click()
    check(
      'reactivate: back to pending',
      await until(async () => (await roleOf(newEmail)) === 'pending'),
    )

    await filter(page, 'Čekající').click()
    await card(page, newEmail).getByRole('button', { name: 'zamítnout' }).click()
    await filter(page, 'Bez přístupu').click()
    const rejected = card(page, newEmail)
    await rejected.getByRole('button', { name: 'smazat účet' }).click()
    await rejected.getByRole('button', { name: 'Ano, smazat' }).click()
    await rejected.waitFor({ state: 'detached', timeout: 15000 })
    const login = await signInRest(newEmail, PASSWORD)
    check('delete: profile and Auth account removed', !(await userDoc(newEmail)) && !login.uid)
  }

  // ---- revoke a parent ----
  {
    await filter(page, 'Rodiče').click()
    const parent = card(page, 'rodic@zare.test')
    check(
      'parent: paired child shown',
      await parent.getByRole('button', { name: 'Odebrat Klára Krejčí' }).isVisible(),
    )
    await parent.getByRole('button', { name: 'odebrat přístup' }).click()
    check(
      'revoke parent: role none and children unpaired',
      (await until(async () => (await roleOf('rodic@zare.test')) === 'none')) &&
        (await parentUidsOf('900102')).length === 0,
    )
  }

  // ---- leader roles ----
  {
    await filter(page, 'Vedoucí').click()
    const leader = card(page, 'vedouci@zare.test')
    await leader.getByRole('button', { name: 'správce' }).click()
    check(
      'leaders: leader → správce',
      await until(async () => (await roleOf('vedouci@zare.test')) === 'admin'),
    )
    await leader.getByRole('button', { name: 'vedoucí' }).click()
    check(
      'leaders: správce → vedoucí',
      await until(async () => (await roleOf('vedouci@zare.test')) === 'leader'),
    )
    const own = card(page, 'spravce@zare.test')
    check(
      'leaders: no actions on the own account',
      (await own.getByRole('button').count()) === 0 && (await own.getByText('(ty)').isVisible()),
    )
  }
  check('admin page: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- security rules and the delete function ----
  {
    runScript('seed-users.js')
    runScript('seed-members.js')
    const leader = await signInRest('vedouci@zare.test', PASSWORD)
    const parent = await signInRest('rodic@zare.test', PASSWORD)
    check(
      'rules: leader may not pair children',
      (await patchDocAs(leader.idToken, 'members/900103', {
        parentUids: { arrayValue: { values: [{ stringValue: leader.uid }] } },
      })) === 403,
    )
    check(
      'rules: leader may not change roles',
      (await patchDocAs(leader.idToken, `users/${parent.uid}`, {
        role: { stringValue: 'admin' },
      })) === 403,
    )
    const denied = await callFunctionAs(leader.idToken, 'deleteAccount', { uid: parent.uid })
    check(
      'deleteAccount: leaders refused',
      denied.error?.status === 'PERMISSION_DENIED',
      JSON.stringify(denied),
    )
    const adminUser = await signInRest('spravce@zare.test', PASSWORD)
    const active = await callFunctionAs(adminUser.idToken, 'deleteAccount', { uid: parent.uid })
    check(
      'deleteAccount: only accounts without access',
      active.error?.status === 'FAILED_PRECONDITION' && !!(await userDoc('rodic@zare.test')),
      JSON.stringify(active),
    )
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const opened = await openAs(browser, 'spravce@zare.test', {
      width,
      height: 800,
      mobile: true,
    })
    const { page: mobile, errors: mobileErrors } = opened
    await mobile.goto(mobile.url() + '/administrace', { waitUntil: 'load' })
    await card(mobile, 'cekajici@zare.test').waitFor()
    await card(mobile, 'cekajici@zare.test')
      .getByRole('button', { name: '+ přiřadit dítě' })
      .click()
    const overflow = await horizontalOverflow(mobile)
    const small = await mobile.evaluate(() =>
      [...document.querySelectorAll('a, button, input')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim() || el.name),
    )
    await mobile.screenshot({ path: `${SCREENSHOTS}admin-${width}.png`, fullPage: true })
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, String(overflow))
    check(`mobile ${width}: tap targets ≥ 24px`, small.length === 0, small.join(', '))
    check(`mobile ${width}: no console errors`, mobileErrors.length === 0, mobileErrors.join(' | '))
    await opened.ctx.close()
  }

  runScript('seed-users.js')
  runScript('seed-members.js')
}
