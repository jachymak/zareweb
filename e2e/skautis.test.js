// skautIS sync in Administration (SPEC §4.8 skautIS): the return from the
// skautIS login with the token in the hash, the preview of changes (new,
// changed, gone children and leaders, left-out categories), cancel, applying
// (skautIS fields written, web data kept), a second sync with nothing to
// change, access rules, mobile widths. skautIS itself is replaced by the
// emulator fixture (`functions/src/skautis/fixture.js`, token FIXTURE_TOKEN)
// compared with `seed-members.js` and `seed-activity.js`; FIXTURE_TOKEN_BASIC
// refuses parents' contacts (the basic package of skautIS functions).

import { FIXTURE_TOKEN, FIXTURE_TOKEN_BASIC } from '../functions/src/skautis/fixture.js'
import {
  FIRESTORE,
  SCREENSHOTS,
  callFunctionAs,
  clearAuthAccounts,
  clearCollection,
  deleteDoc,
  horizontalOverflow,
  openPage,
  runScript,
  signInRest,
} from './lib.js'

const PASSWORD = 'heslo1234'
const RETURN_URL = `/vedouci/administrace#skautis=${FIXTURE_TOKEN}&role=1&unit=2`
const owner = { Authorization: 'Bearer owner' }

// Firestore REST value → plain JS (maps and arrays included).
function plain(v) {
  if (!v) return undefined
  if ('mapValue' in v)
    return Object.fromEntries(
      Object.entries(v.mapValue.fields ?? {}).map(([k, f]) => [k, plain(f)]),
    )
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(plain)
  if ('nullValue' in v) return null
  if ('integerValue' in v) return Number(v.integerValue)
  return v.stringValue ?? v.booleanValue ?? v.timestampValue ?? v.doubleValue
}
async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: owner })
  if (res.status === 404) return null
  const doc = await res.json()
  return Object.fromEntries(Object.entries(doc.fields ?? {}).map(([k, f]) => [k, plain(f)]))
}

async function openAs(browser, email, path, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/(vedouci|clenove)$/, { timeout: 10000 })
  await page.goto(new URL(path, page.url()).href, { waitUntil: 'load' })
  return opened
}

const group = (page, id) => page.getByTestId(id)
const rowsText = async (page, groupId, section) =>
  (await group(page, groupId)
    .getByTestId(`skautis-${section}`)
    .innerText()
    .catch(() => '')) ?? ''

export default async function skautisSuite({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  await clearCollection('members') // a child added by an earlier sync
  runScript('seed-members.js')
  runScript('seed-activity.js')
  await deleteDoc('skautisSync/pending')
  await deleteDoc('settings/skautis')

  // ---- access ----
  const leader = await signInRest('vedouci@zare.test', PASSWORD)
  const admin = await signInRest('spravce@zare.test', PASSWORD)
  const denied = await callFunctionAs(leader.idToken, 'previewSkautisSync', {
    token: FIXTURE_TOKEN,
  })
  check(
    'a leader cannot run the sync',
    denied.error?.status === 'PERMISSION_DENIED',
    denied.error?.status,
  )
  const badToken = await callFunctionAs(admin.idToken, 'previewSkautisSync', { token: 'x' })
  check(
    'an invalid token is refused',
    badToken.error?.status === 'INVALID_ARGUMENT',
    badToken.error?.status,
  )
  const nothing = await callFunctionAs(admin.idToken, 'applySkautisSync', {})
  check(
    'applying without a preview fails',
    nothing.error?.details?.reason === 'no-pending',
    JSON.stringify(nothing.error),
  )

  // ---- desktop: back from the skautIS login ----
  const { page, ctx, errors } = await openAs(browser, 'spravce@zare.test', RETURN_URL)
  await page.getByRole('heading', { name: 'Co se změní' }).waitFor({ timeout: 20000 })
  const url = new URL(page.url())
  check(
    'the token is dropped from the URL, the skautIS tab is open',
    url.hash === '' && url.searchParams.get('zalozka') === 'skautis',
    page.url(),
  )
  const pendingRead = await fetch(`${FIRESTORE}/skautisSync/pending`, {
    headers: { Authorization: `Bearer ${admin.idToken}` },
  })
  check(
    'the loaded data is not readable from the web',
    pendingRead.status === 403,
    pendingRead.status,
  )

  const membersAdded = await rowsText(page, 'skautis-members', 'added')
  const membersChanged = await rowsText(page, 'skautis-members', 'changed')
  const membersRemoved = await rowsText(page, 'skautis-members', 'removed')
  check(
    'new child: Ještěrka',
    /noví \(1\)/.test(membersAdded) && membersAdded.includes('Ještěrka'),
    membersAdded,
  )
  check(
    'changed children: Sojka parents, Vydra → Vydrák, Ježek back',
    /změnění \(3\)/.test(membersChanged) &&
      membersChanged.includes(
        'kontakty rodičů: Rodič Testovací, rodic@zare.test, +420 602 333 444; Marie Krejčí, +420 603 111 222 → Rodič Testovací, rodic@zare.test, +420 602 333 999; Marie Krejčí, +420 603 111 222',
      ) &&
      membersChanged.includes('přezdívka: Vydra → Vydrák') &&
      /Ježek[\s\S]*znovu v oddíle/.test(membersChanged),
    membersChanged,
  )
  check(
    'gone child: Liška',
    /odešlí \(1\)/.test(membersRemoved) && membersRemoved.includes('Liška'),
    membersRemoved,
  )
  const membersTitle = await group(page, 'skautis-members').locator('h3').innerText()
  check('3 children stay as they are', membersTitle.includes('beze změny 3'), membersTitle)

  const peopleAdded = await rowsText(page, 'skautis-people', 'added')
  const peopleChanged = await rowsText(page, 'skautis-people', 'changed')
  const peopleRemoved = await rowsText(page, 'skautis-people', 'removed')
  check(
    'new leader: Mravenec',
    peopleAdded.includes('Mravenec') && /noví \(1\)/.test(peopleAdded),
    peopleAdded,
  )
  check(
    'changed leader: Nina phone',
    peopleChanged.includes('telefon: +420 721 404 118 → +420 721 404 000') &&
      /změnění \(1\)/.test(peopleChanged),
    peopleChanged,
  )
  check(
    'gone leader: Quido',
    peopleRemoved.includes('Quido') && /odešlí \(1\)/.test(peopleRemoved),
    peopleRemoved,
  )
  const peopleTitle = await group(page, 'skautis-people').locator('h3').innerText()
  check('6 leaders stay as they are', peopleTitle.includes('beze změny 6'), peopleTitle)
  const skipped = await page.getByText('Nenačteno podle kategorie').innerText()
  check(
    'left-out categories are counted',
    skipped.includes('Benjamínek 1') && skipped.includes('Člen kmene dospělých 1'),
    skipped,
  )
  check(
    'the rules note is shown',
    (await page.getByTestId('skautis-rules').innerText()).includes('rover a ranger'),
  )
  await page.screenshot({ path: `${SCREENSHOTS}skautis-preview-desktop.png`, fullPage: true })

  // Cancel → back to the start, nothing written.
  await page.getByRole('button', { name: 'zrušit' }).click()
  const login = page.getByRole('link', { name: 'Synchronizovat ze skautISu' })
  const href = await login.getAttribute('href')
  check(
    'cancel shows the login link again',
    href?.startsWith('https://is.skaut.cz/Login/?appid=0e8e3482-a558-469f-bc63-b6985a39a6ed'),
    href,
  )
  check('cancel writes nothing', (await getDoc('members/900105')) === null)
  check(
    'never synced yet',
    (await page.getByTestId('last-sync').innerText()).includes('zatím nikdy'),
  )

  // ---- apply ----
  await page.goto(new URL(RETURN_URL, page.url()).href, { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'Co se změní' }).waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: 'použít změny' }).click()
  const status = page.getByRole('status').filter({ hasText: 'Hotovo' })
  await status.waitFor({ timeout: 20000 })
  check(
    'applied summary',
    (await status.innerText()).includes(
      'Děti: 1 nový, 3 změnění, 1 odešlý. Vedoucí: 1 nový, 1 změněný, 1 odešlý.',
    ),
    await status.innerText(),
  )
  const today = new Date().toLocaleDateString('cs-CZ')
  const lastSync = page.getByTestId('last-sync')
  await page
    .waitForFunction(
      (t) => document.querySelector('[data-testid="last-sync"]')?.textContent.includes(t),
      today,
      { timeout: 5000 },
    )
    .catch(() => {})
  check(
    'last sync date and time shown',
    (await lastSync.innerText()).includes(today) &&
      / v \d{1,2}:\d{2}$/.test(await lastSync.innerText()),
    await lastSync.innerText(),
  )

  const jesterka = await getDoc('members/900105')
  const jesterkaContacts = await getDoc('members/900105/private/contacts')
  check(
    'new child written',
    jesterka?.nickname === 'Ještěrka' &&
      jesterka.troop === 'vlc' &&
      jesterka.skautisPersonId === 900105 &&
      jesterka.birthDate === '2018-03-03' &&
      jesterka.active === true &&
      jesterka.meetingDay === null &&
      jesterka.parentUids?.length === 0 &&
      jesterkaContacts?.parents?.[0]?.email === 'mala@example.cz',
    JSON.stringify(jesterka),
  )
  const sojka = await getDoc('members/900102')
  const sojkaContacts = await getDoc('members/900102/private/contacts')
  check(
    'changed child keeps meeting day and pairing',
    sojka.meetingDay === 'thu' &&
      sojka.parentUids.length === 1 &&
      sojkaContacts.parents[0].phone === '+420 602 333 999',
    JSON.stringify({ sojka, sojkaContacts }),
  )
  check('nickname updated', (await getDoc('members/900202')).nickname === 'Vydrák')
  check('returning child active again', (await getDoc('members/900203')).active === true)
  const liska = await getDoc('members/900103')
  check(
    'gone child inactive, web data kept',
    liska.active === false && liska.meetingDay === 'mon',
    JSON.stringify(liska),
  )
  const mravenec = await getDoc('skautisPeople/800014')
  check(
    'new leader written with a home troop guess',
    mravenec?.nickname === 'Mravenec' &&
      mravenec.name === 'Adam Novotný' &&
      mravenec.troop === 'ss' &&
      mravenec.roleTitle === null &&
      mravenec.phone === '+420 739 222 333' &&
      mravenec.active === true,
    JSON.stringify(mravenec),
  )
  const nina = await getDoc('skautisPeople/800002')
  check(
    'changed leader keeps role title and troop',
    nina.phone === '+420 721 404 000' &&
      nina.roleTitle === 'zástupkyně vedoucího' &&
      nina.troop === 'vlc',
    JSON.stringify(nina),
  )
  check('gone leader inactive', (await getDoc('skautisPeople/800022')).active === false)
  check('Elina keeps no home troop', (await getDoc('skautisPeople/800021')).troop === null)
  const settings = await getDoc('settings/skautis')
  check('settings/skautis.lastSyncAt set', !!settings?.lastSyncAt, JSON.stringify(settings))
  check('the loaded data is removed', (await getDoc('skautisSync/pending')) === null)

  // ---- a second sync: nothing to change ----
  await page.goto(new URL(RETURN_URL, page.url()).href, { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'Co se změní' }).waitFor({ timeout: 20000 })
  check('second sync: nothing changes', (await page.getByText('Nic se nemění.').count()) === 2)
  check('no console errors (desktop)', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    await clearCollection('members')
    runScript('seed-members.js')
    runScript('seed-activity.js')
    const m = await openAs(browser, 'spravce@zare.test', RETURN_URL, {
      width,
      height: 800,
      mobile: true,
    })
    await m.page.getByRole('heading', { name: 'Co se změní' }).waitFor({ timeout: 20000 })
    const overflow = await horizontalOverflow(m.page)
    check(`${width} px: no horizontal overflow`, overflow <= 0, `${overflow}px`)
    const box = await m.page.getByRole('button', { name: 'použít změny' }).boundingBox()
    check(`${width} px: apply button tappable`, box && box.height >= 40, JSON.stringify(box))
    await m.page.screenshot({ path: `${SCREENSHOTS}skautis-preview-${width}.png`, fullPage: true })
    check(`${width} px: no console errors`, m.errors.length === 0, m.errors.join(' | '))
    await m.ctx.close()
  }

  // ---- basic package: no parents' contacts, the stored ones are kept ----
  await clearCollection('members')
  await deleteDoc('members/900105/private/contacts') // left by the first apply
  runScript('seed-members.js')
  runScript('seed-activity.js')
  const basicUrl = RETURN_URL.replace(FIXTURE_TOKEN, FIXTURE_TOKEN_BASIC)
  const b = await openAs(browser, 'spravce@zare.test', basicUrl)
  await b.page.getByRole('heading', { name: 'Co se změní' }).waitFor({ timeout: 20000 })
  const basicChanged = await rowsText(b.page, 'skautis-members', 'changed')
  check(
    'basic package: the preview says parents are not loaded',
    (await b.page.getByTestId('skautis-no-parents').count()) === 1,
  )
  check(
    'basic package: parents are not compared',
    /změnění \(2\)/.test(basicChanged) && !basicChanged.includes('kontakty rodičů'),
    basicChanged,
  )
  await b.page.getByRole('button', { name: 'použít změny' }).click()
  const basicStatus = b.page.getByRole('status').filter({ hasText: 'Hotovo' })
  await basicStatus.waitFor({ timeout: 20000 })
  check(
    'basic package: applied',
    (await basicStatus.innerText()).includes('Děti: 1 nový, 2 změnění, 1 odešlý.'),
    await basicStatus.innerText(),
  )
  check(
    'basic package: stored parents kept',
    (await getDoc('members/900102/private/contacts'))?.parents?.[0]?.phone === '+420 602 333 444',
  )
  check(
    'basic package: new child has no contacts yet',
    (await getDoc('members/900105'))?.nickname === 'Ještěrka' &&
      (await getDoc('members/900105/private/contacts')) === null,
  )
  check('basic package: no console errors', b.errors.length === 0, b.errors.join(' | '))
  await b.ctx.close()
  await deleteDoc('skautisSync/pending')
}
