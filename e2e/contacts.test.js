// Leader contacts in Administration (SPEC §4.8 Contacts): the list per group
// with skautIS details and warnings, role title override, photos resized in
// the browser and stored in Storage `contacts/` (replaced and removed photos
// deleted), order, moving between groups, adding a skautIS leader and a manual
// contact (validation), removing, the contact person of a group; what parents
// then see in „Vedoucí“; security rules; mobile widths. Accounts from
// `scripts/seed-users.js`, leaders and contacts from `scripts/seed-activity.js`
// (vlc: Ondys, Nina, Oskar without a phone; ss: Hobit — contact person, Jasmína,
// Kuba; other: Elina, Quido, manual Kormorán).

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  FIRESTORE,
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  fieldValue,
  horizontalOverflow,
  openPage,
  patchDocAs,
  runScript,
  signInRest,
} from './lib.js'

const PASSWORD = 'heslo1234'
const URL_TAB = '/vedouci/administrace?zalozka=kontakty'
const BUCKET = `${process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'}.appspot.com`
const STORAGE = `http://127.0.0.1:9199/v0/b/${BUCKET}/o`
const owner = { Authorization: 'Bearer owner' }

// sharp is a dependency of the functions.
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const sharp = (await import(pathToFileURL(require.resolve('sharp')).href)).default
const jpeg = (width, height, color) =>
  sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg()
    .toBuffer()

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
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

async function contacts() {
  const res = await fetch(`${FIRESTORE}/contacts?pageSize=100`, { headers: owner })
  const docs = (await res.json()).documents ?? []
  return Object.fromEntries(
    docs.map((d) => [
      d.name.split('/').at(-1),
      Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fieldValue(v)])),
    ]),
  )
}
async function storageFiles(prefix) {
  const res = await fetch(`${STORAGE}?prefix=${encodeURIComponent(prefix)}`, { headers: owner })
  return ((await res.json()).items ?? []).map((i) => i.name)
}
async function clearContactPhotos() {
  for (const name of await storageFiles('contacts/')) {
    await fetch(`${STORAGE}/${encodeURIComponent(name)}`, { method: 'DELETE', headers: owner })
  }
}

const row = (page, text) => page.getByTestId('contact').filter({ hasText: text })
const group = (page, name) => page.getByRole('button', { name: new RegExp(`^${name} \\(`) })
const saveButton = (page) => page.getByRole('button', { name: 'uložit kontakty' })
const savedNote = (page) => page.getByRole('status').filter({ hasText: 'uloženo' })

export default async function contactsSuite({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')
  await clearContactPhotos()

  const { ctx, page, errors } = await openAs(browser, 'spravce@zare.test', URL_TAB)
  await page.getByTestId('contacts-vlc').waitFor()

  // ---- the list ----
  {
    const names = await page.getByTestId('contact').locator('h3').allInnerTexts()
    check('list: vlčušky in order', names.join(',') === 'Ondys,Nina,Oskar', names.join(','))
    check(
      'list: missing phone flagged',
      (await row(page, 'Oskar').innerText()).includes('doplň telefon ve skautISu'),
    )
    check(
      'list: group counts in the switch',
      (await group(page, 'ostatní').innerText()) === 'ostatní (3)',
      await group(page, 'ostatní').innerText(),
    )
    check(
      'list: role pre-filled from skautIS',
      (await row(page, 'Ondys').getByLabel('Role').inputValue()) === 'rádce Bobrů',
    )
  }

  // ---- edits ----
  {
    const ondys = row(page, 'Ondys')
    await ondys.getByLabel('Role').fill('rádce Bobrů a Veverek')
    check(
      'role: overridden with the skautIS value shown',
      (await ondys.innerText()).includes('ve skautISu: rádce Bobrů'),
    )
    check('dirty: unsaved changes shown', await page.getByText('neuložené změny').isVisible())

    await ondys
      .getByTestId('contact-photo-input')
      .setInputFiles([{ name: 'IMG_0001.HEIC', mimeType: '', buffer: Buffer.from('heic') }])
    await ondys.getByRole('alert').waitFor()
    check('photo: HEIC rejected', (await ondys.getByRole('alert').innerText()).includes('HEIC'))
    await ondys
      .getByTestId('contact-photo-input')
      .setInputFiles([
        { name: 'ondys.jpg', mimeType: 'image/jpeg', buffer: await jpeg(1600, 1000, '#4f7a4a') },
      ])
    await ondys.getByTestId('contact-photo').waitFor()
    check('photo: preview shown before saving', true)

    await row(page, 'Nina').getByRole('button', { name: 'Nina výš' }).click()
    await row(page, 'Oskar').getByLabel('Skupina').selectOption('ss')
    const names = await page.getByTestId('contact').locator('h3').allInnerTexts()
    check(
      'order: moved up, moved to another group',
      names.join(',') === 'Nina,Ondys',
      names.join(','),
    )

    await page.getByRole('button', { name: '+ přidat kontakt' }).click()
    await page
      .getByLabel('Vedoucí ze skautISu')
      .selectOption({ label: 'Hobit (Theodor Mikolajek)' })
    await page.getByRole('button', { name: 'přidat', exact: true }).click()
    check('add: skautIS leader added', await row(page, 'Hobit').isVisible())
    check(
      'primary: a leader in a second group is not its contact person',
      !(await row(page, 'Hobit').getByLabel('kontaktní osoba skupiny').isChecked()),
    )
    await row(page, 'Nina').getByLabel('kontaktní osoba skupiny').check()
    await row(page, 'Hobit').getByLabel('kontaktní osoba skupiny').check()
    check(
      'primary: one per group',
      !(await row(page, 'Nina').getByLabel('kontaktní osoba skupiny').isChecked()),
    )
    await row(page, 'Nina').getByLabel('kontaktní osoba skupiny').check()

    await group(page, 'ostatní').click()
    await page.getByRole('button', { name: 'Odebrat kontakt Elina' }).click()
    await page.getByRole('button', { name: '+ ruční kontakt' }).click()
    await saveButton(page).click()
    const manual = page.getByTestId('contact').last()
    await manual.getByText('Vyplň přezdívku nebo jméno.').waitFor()
    check('manual: validated', await manual.getByText('Vyplň telefon nebo e-mail.').isVisible())
    await manual.getByLabel('Přezdívka').fill('Sova')
    await manual.getByLabel('Jméno').fill('Alena Sovová')
    await manual.getByLabel('E-mail').fill('sova@example.cz')
    await manual.getByLabel('Role').fill('zdravotnice střediska')

    await group(page, 'vlčušky').click()
    await saveButton(page).click()
    await savedNote(page).waitFor({ timeout: 15000 })
    await page.screenshot({ path: `${SCREENSHOTS}contacts-desktop.png`, fullPage: true })
  }

  // ---- stored ----
  let firstPhoto
  {
    const all = await contacts()
    const ondys = all['seed-800001']
    firstPhoto = ondys?.photoPath
    check(
      'saved: role override and photo',
      ondys?.roleTitle === 'rádce Bobrů a Veverek' &&
        /^contacts\/seed-800001\/[A-Za-z0-9]{20}\.jpg$/.test(firstPhoto ?? '') &&
        ondys.photoUrl?.includes('token='),
      JSON.stringify(ondys),
    )
    check(
      'saved: order and groups',
      all['seed-800002'].order < ondys.order && all['seed-800003'].group === 'ss',
      JSON.stringify([all['seed-800002'].order, ondys.order, all['seed-800003'].group]),
    )
    check('saved: removed contact deleted', !all['seed-800021'])
    const hobit = Object.values(all).filter((c) => c.personId === '800011')
    check(
      'saved: a leader can be in two groups',
      hobit
        .map((c) => c.group)
        .sort()
        .join() === 'ss,vlc',
    )
    const sova = Object.values(all).find((c) => c.nickname === 'Sova')
    check(
      'saved: manual contact',
      sova?.personId === null &&
        sova.group === 'other' &&
        sova.email === 'sova@example.cz' &&
        sova.phone === null &&
        sova.roleTitle === 'zdravotnice střediska',
      JSON.stringify(sova),
    )
    check('saved: unchanged role stays from skautIS', all['seed-800002'].roleTitle === null)
    check(
      'saved: contact person per group',
      all['seed-800002'].primary === true &&
        all['seed-800011'].primary === true &&
        hobit.find((c) => c.group === 'vlc')?.primary === false &&
        !all['seed-800001'].primary,
      JSON.stringify(hobit),
    )
    const file = await fetch(`${STORAGE}/${encodeURIComponent(firstPhoto)}?alt=media`, {
      headers: owner,
    })
    const meta = await sharp(Buffer.from(await file.arrayBuffer())).metadata()
    check(
      'storage: photo cut to 480×640 JPEG',
      meta.width === 480 && meta.height === 640 && meta.format === 'jpeg',
      `${meta.width}×${meta.height} ${meta.format}`,
    )
  }

  // ---- replacing and removing photos ----
  {
    await page.reload({ waitUntil: 'load' })
    await page.getByTestId('contacts-vlc').waitFor()
    await row(page, 'Ondys')
      .getByTestId('contact-photo-input')
      .setInputFiles([
        {
          name: 'ondys2.png',
          mimeType: 'image/png',
          buffer: await sharp({
            create: { width: 500, height: 900, channels: 3, background: '#c0492a' },
          })
            .png()
            .toBuffer(),
        },
      ])
    await row(page, 'Nina')
      .getByTestId('contact-photo-input')
      .setInputFiles([
        { name: 'nina.jpg', mimeType: 'image/jpeg', buffer: await jpeg(800, 800, '#e5a83c') },
      ])
    await row(page, 'Nina').getByTestId('contact-photo').waitFor()
    await saveButton(page).click()
    await savedNote(page).waitFor({ timeout: 15000 })
    const files = await storageFiles('contacts/')
    check(
      'storage: replaced photo deleted',
      files.length === 2 && !files.includes(firstPhoto),
      files.join(', '),
    )
    await row(page, 'Nina').getByRole('button', { name: 'odebrat fotku' }).click()
    await saveButton(page).click()
    await savedNote(page).waitFor({ timeout: 15000 })
    const after = await until(
      async () => (await storageFiles('contacts/seed-800002/')).length === 0,
    )
    check(
      'storage: removed photo deleted',
      after && (await contacts())['seed-800002'].photoUrl === null,
    )
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- what parents see ----
  {
    const p = await openAs(browser, 'rodic@zare.test', '/clenove')
    const section = p.page.locator('section[aria-labelledby="leaders-title"]')
    await section.waitFor()
    const ondys = section.locator('li').filter({ hasText: 'Ondys' })
    const text = await ondys.innerText()
    check(
      'parents: overridden role and photo',
      text.includes('Ondřej Sýkora · rádce Bobrů a Veverek') &&
        (await ondys.locator('img').getAttribute('src'))?.includes('token='),
      text,
    )
    // lazy-loaded
    await ondys.locator('img').scrollIntoViewIfNeeded()
    const photoLoaded = await until(() =>
      ondys.locator('img').evaluate((img) => img.complete && img.naturalWidth === 480),
    )
    check('parents: photo loads from Storage', photoLoaded)
    const primary = section.getByTestId('primary-contact')
    check(
      'parents: contact person highlighted first',
      (await primary.count()) === 1 &&
        (await primary.innerText()).includes('Nina') &&
        (await primary.innerText()).includes('kontaktní osoba') &&
        (await section.locator('li').first().getAttribute('data-testid')) === 'primary-contact',
      await section.innerText(),
    )
    await p.page.getByRole('button', { name: 'ostatní' }).click()
    const other = await section.innerText()
    check(
      'parents: manual contacts shown, removed one gone',
      other.includes('Kormorán') &&
        other.includes('Petr Vondráček · vedoucí střediska Šipka') &&
        other.includes('Sova') &&
        other.includes('sova@example.cz') &&
        !other.includes('Elina'),
      other,
    )
    check('parents: no console errors', p.errors.length === 0, p.errors.join(' | '))
    await p.ctx.close()
  }

  // ---- security rules ----
  {
    const leader = await signInRest('vedouci@zare.test', PASSWORD)
    const parent = await signInRest('rodic@zare.test', PASSWORD)
    const upload = (token) =>
      fetch(
        `${STORAGE}?name=${encodeURIComponent('contacts/seed-800001/abcdefghijABCDEFGHIJ.jpg')}`,
        {
          method: 'POST',
          headers: { Authorization: `Firebase ${token}`, 'Content-Type': 'image/jpeg' },
          body: Buffer.from('x'),
        },
      ).then((r) => r.status)
    check('rules: a leader cannot upload contact photos', (await upload(leader.idToken)) === 403)
    check('rules: a parent cannot upload contact photos', (await upload(parent.idToken)) === 403)
    check(
      'rules: a leader cannot edit contacts',
      (await patchDocAs(leader.idToken, 'contacts/seed-800001', {
        roleTitle: { stringValue: 'x' },
      })) === 403,
    )
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const m = await openAs(browser, 'spravce@zare.test', URL_TAB, {
      width,
      height: 780,
      mobile: true,
    })
    await m.page.getByTestId('contacts-vlc').waitFor()
    await group(m.page, 'ostatní').click()
    const overflow = await horizontalOverflow(m.page)
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, `${overflow}px`)
    await m.page.screenshot({ path: `${SCREENSHOTS}contacts-${width}.png`, fullPage: true })
    check(`mobile ${width}: no console errors`, m.errors.length === 0, m.errors.join(' | '))
    await m.ctx.close()
  }
}
