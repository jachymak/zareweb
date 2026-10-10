// The leaders' directory (SPEC §4.10) and contacts from the skautIS export
// (§4.8 skautIS): the admin uploads an XLSX export (built here like skautIS
// gives it), sees the preview and writes it; a leader searches and filters the
// directory, downloads vCards, chooses phone groups, creates the phone
// password and reads the address book over CardDAV; security rules; mobile
// widths. Accounts from `scripts/seed-users.js`, children from
// `scripts/seed-members.js`, leaders from `scripts/seed-activity.js`.

import { crc32, deflateRawSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import {
  FIRESTORE,
  listDocs,
  FUNCTIONS,
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
const owner = { Authorization: 'Bearer owner' }
const CARDDAV = `${FUNCTIONS}/carddav`

// ---- an XLSX like the skautIS export (shared strings, header row 8) ----

function zip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name)
    const raw = Buffer.from(text)
    const data = deflateRawSync(raw)
    const crc = crc32(raw)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, nameBuf, data)
    centrals.push(central, nameBuf)
    offset += local.length + nameBuf.length + data.length
  }
  const dir = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(dir.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, dir, end])
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
function xlsx(rows) {
  const strings = []
  const index = (s) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1)
  const col = (i) => String.fromCharCode(65 + (i % 26)).padStart(i >= 26 ? 2 : 1, 'A')
  const sheet = rows
    .map(
      (r, ri) =>
        `<row r="${ri + 1}">${r
          .map((v, ci) =>
            v === '' ? '' : `<c r="${col(ci)}${ri + 1}" t="s"><v>${index(v)}</v></c>`,
          )
          .join('')}</row>`,
    )
    .join('')
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  return zip({
    'xl/sharedStrings.xml': `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="${ns}">${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}"><sheetData>${sheet}</sheetData></worksheet>`,
  })
}

const HEADER = [
  'Jméno', 'Příjmení', 'Přezdívka', 'Datum narození', 'Kategorie', 'E-mail (další)',
  'E-mail (hlavní)', 'Mobil (další)', 'Mobil / telefon (hlavní)', 'Telefon (další)',
  'Otec: jméno', 'Otec: příjmení', 'Otec: mail', 'Otec: telefon', 'Otec: poznámka',
  'Matka: jméno', 'Matka: příjmení', 'Matka: mail', 'Matka: telefon', 'Matka: poznámka',
  'Ostatní: jméno', 'Ostatní: příjmení', 'Ostatní: mail', 'Ostatní: telefon', 'Ostatní: poznámka',
  'Ostatní: typ',
] // prettier-ignore
const person = (fields) => HEADER.map((h) => fields[h] ?? '')
const EXPORT = xlsx([
  ['skautIS - export osob: Export pro zare-web'],
  ['Datum vygenerování: 06.10.2026 20:55:19'],
  ['Jednotky'],
  ['Jednotka', '', 'Včetně podřízených'],
  ['116.22.220 - Záře - vlčušky', '', 'Ne'],
  ['116.22.222 - Záře', '', 'Ne'],
  ['Osoby'],
  HEADER,
  // Sojka: father and mother, her main e-mail is her mother's; the mother
  // doesn't want mass e-mails, her e-mail is only in the note
  person({
    Jméno: 'Klára', Příjmení: 'Krejčí', Přezdívka: 'Sojka', 'Datum narození': '02.11.2016',
    Kategorie: 'Světluška', 'E-mail (hlavní)': 'matka.krejci@example.cz',
    'Otec: jméno': 'Rodič', 'Otec: příjmení': 'Testovací', 'Otec: mail': 'rodic@zare.test',
    'Otec: telefon': '602333444',
    'Otec: poznámka': 'Automaticky převedeno z původních kontaktů rodičů.',
    'Matka: jméno': 'Marie', 'Matka: příjmení': 'Krejčí', 'Matka: telefon': '603111222',
    'Matka: poznámka': 'Nechce hromadné maily: matka.krejci@example.cz',
  }),
  // Vydra: own phones (two in one cell), grandmother as „ostatní“, placeholders for the mother;
  // a second „ostatní“ „dítě“ (his e-mail, so that he gets the e-mails too) repeats the row
  person({
    Jméno: 'Matěj', Příjmení: 'Pokorný', Přezdívka: 'Vydruška', 'Datum narození': '12.12.2012',
    Kategorie: 'Skaut', 'Mobil / telefon (hlavní)': '605101202, 605999888',
    'Otec: jméno': 'Jiří', 'Otec: příjmení': 'Pokorný', 'Otec: mail': 'pokorny.j@example.cz',
    'Otec: telefon': '608777888', 'Matka: jméno': '(jméno matky)', 'Matka: příjmení': '(příjmení matky)',
    'Ostatní: jméno': 'Věra', 'Ostatní: příjmení': 'Pokorná', 'Ostatní: telefon': '601222333',
    'Ostatní: typ': 'babička',
  }),
  person({
    Jméno: 'Matěj', Příjmení: 'Pokorný', Přezdívka: 'Vydruška', 'Datum narození': '12.12.2012',
    Kategorie: 'Skaut', 'Mobil / telefon (hlavní)': '605101202, 605999888',
    'Otec: jméno': 'Jiří', 'Otec: příjmení': 'Pokorný', 'Otec: mail': 'pokorny.j@example.cz',
    'Otec: telefon': '608777888', 'Matka: jméno': '(jméno matky)', 'Matka: příjmení': '(příjmení matky)',
    'Ostatní: jméno': 'Matěj', 'Ostatní: příjmení': 'Pokorný', 'Ostatní: mail': 'matej.p@example.cz',
    'Ostatní: typ': 'dítě',
  }),
  person({ Jméno: 'Nikdo', Příjmení: 'Neznámý', 'Datum narození': '01.01.2015', Kategorie: 'Vlče' }),
  // Ondys: birthday; his phone differs from the sync
  person({
    Jméno: 'Ondřej', Příjmení: 'Sýkora', Přezdívka: 'Ondys', 'Datum narození': '24.12.1998',
    Kategorie: 'Rover', 'Mobil / telefon (hlavní)': '608117000', 'Otec: jméno': 'Otec',
    'Otec: příjmení': 'Sýkora', 'Otec: telefon': '600000000',
  }),
]) // prettier-ignore

// ---- helpers ----

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

const restValue = (v) =>
  v?.arrayValue
    ? (v.arrayValue.values ?? []).map(restValue)
    : v?.mapValue
      ? Object.fromEntries(
          Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, restValue(x)]),
        )
      : fieldValue(v)
async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: owner })
  if (!res.ok) return null
  return restValue({ mapValue: { fields: (await res.json()).fields } })
}

const basic = (user, password) => ({
  Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
})
async function dav(method, path, auth, body, depth = '1') {
  const res = await fetch(`${CARDDAV}${path}`, {
    method,
    headers: { ...auth, Depth: depth, 'Content-Type': 'application/xml' },
    body,
  })
  return { status: res.status, text: await res.text() }
}

const rows = (page) => page.getByTestId('directory-row')
const rowOf = (page, name) =>
  rows(page).filter({ has: page.locator('h3 .font-hand').getByText(name, { exact: true }) })

export default async function directorySuite({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  await clearCollection('phonePasswords')
  await clearCollection('phoneContacts')
  runScript('seed-users.js')
  await clearCollection('members') // e.g. children added by an earlier sync
  runScript('seed-members.js')
  runScript('seed-activity.js')

  // ---- the export import (admin) ----
  {
    const { ctx, page, errors } = await openAs(
      browser,
      'spravce@zare.test',
      '/vedouci/administrace?zalozka=skautis',
    )
    await page.getByTestId('last-contacts-import').waitFor()
    await page.getByTestId('contacts-export-input').setInputFiles([
      {
        name: 'Export_pro_zare-web.XLSX',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: EXPORT,
      },
    ])
    await page.getByTestId('import-children').waitFor()
    const children = await page.getByTestId('import-children').innerText()
    check(
      'import: changed children with their new contacts',
      (await page.getByTestId('import-row').count()) === 2 &&
        children.includes('otec Rodič Testovací 602 333 444') &&
        children.includes('babička Věra Pokorná') &&
        children.includes('dítě 605 101 202 605 999 888'),
      children,
    )
    check(
      "import: a child's e-mail that is its mother's is not its own",
      !/dítě[^;]*matka\.krejci/.test(children),
    )
    const birthdays = await page.getByTestId('import-birthdays').innerText()
    check('import: leader birthday', birthdays.includes('Ondys 24. 12. 1998'), birthdays)
    const differences = await page.getByTestId('import-differences').innerText()
    check(
      'import: differences against the sync',
      differences.includes('Matěj Pokorný — přezdívka: na webu Vydra, v exportu Vydruška') &&
        differences.includes('Ondřej Sýkora — telefon'),
      differences,
    )
    check(
      'import: not on the web / not in the export',
      (await page.getByTestId('import-not-on-web').innerText()).includes('Nikdo Neznámý (Vlče)') &&
        (await page.getByTestId('import-not-in-export').innerText()).includes('Anna Nováková'),
    )
    await page.screenshot({ path: `${SCREENSHOTS}directory-import.png`, fullPage: true })
    await page.getByRole('button', { name: 'použít' }).click()
    await page.getByRole('status').filter({ hasText: 'Hotovo' }).waitFor({ timeout: 10000 })

    const sojka = await getDoc('members/900102/private/contacts')
    const vydra = await getDoc('members/900202/private/contacts')
    check(
      'import: stored parents with labels, own contacts',
      sojka?.parents?.map((p) => p.label).join() === 'otec,matka' &&
        sojka.parents[0].noteEmails.length === 0 &&
        sojka.parents[1].email === null &&
        sojka.parents[1].noteEmails.join() === 'matka.krejci@example.cz' &&
        sojka.own.emails.length === 0 &&
        vydra?.parents?.map((p) => `${p.label}:${p.name}`).join() ===
          'otec:Jiří Pokorný,babička:Věra Pokorná' &&
        vydra.own.emails.join() === 'matej.p@example.cz' &&
        vydra.own.mailedEmails.join() === 'matej.p@example.cz' &&
        vydra.own.phones.join() === '605101202,605999888' &&
        Boolean(sojka.importedAt),
      JSON.stringify([sojka, vydra]),
    )
    check(
      'import: untouched child keeps its contacts',
      (await getDoc('members/900103/private/contacts'))?.parents?.length === 2,
    )
    check(
      'import: leader birthday stored privately',
      (await getDoc('skautisPeople/800001/private/details'))?.birthDate === '1998-12-24' &&
        (await getDoc('skautisPeople/800001'))?.birthDate === undefined,
    )
    check(
      'import: last import shown',
      !(await page.getByTestId('last-contacts-import').innerText()).includes('zatím nikdy'),
    )

    check('import: no console errors', errors.length === 0, errors.join(' | '))
    await page
      .getByTestId('contacts-export-input')
      .setInputFiles([
        { name: 'x.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('nope') },
      ])
    await page.getByRole('alert').waitFor()
    check(
      'import: a file that is not an export',
      (await page.getByRole('alert').innerText()).includes('nevypadá jako export'),
    )
    await ctx.close()
  }

  // ---- the directory (leader) ----
  const leader = await openAs(browser, 'vedouci@zare.test', '/vedouci')
  const { page, errors } = leader
  {
    await page
      .getByRole('navigation', { name: 'Nástroje' })
      .getByRole('link', { name: 'Kontakty' })
      .click()
    await page.waitForURL(/\/vedouci\/kontakty$/)
    await rows(page).first().waitFor()
    const count = await rows(page).count()
    check('list: active children, leaders and ostatní', count === 6 + 8 + 1, String(count))
    const vydra = (await rowOf(page, 'Vydra').innerText()).toLowerCase()
    check(
      'list: child with parents, own contacts and birthday',
      vydra.includes('otec · jiří pokorný') &&
        vydra.includes('608 777 888') &&
        vydra.includes('babička · věra pokorná') &&
        vydra.includes('dítě') &&
        vydra.includes('605 101 202') &&
        vydra.includes('narozeniny 12. 12. 2012'),
      vydra,
    )
    const sojka = await rowOf(page, 'Sojka').innerText()
    check(
      'list: a parent e-mail from the note shown with the parent',
      /matka · Marie Krejčí[\s\S]*matka\.krejci@example\.cz/i.test(sojka),
      sojka,
    )
    check(
      'list: phone and e-mail links',
      (await rowOf(page, 'Vydra')
        .locator('a[href="tel:+420608777888"], a[href="tel:608777888"]')
        .count()) === 1 &&
        (await rowOf(page, 'Vydra').locator('a[href="mailto:pokorny.j@example.cz"]').count()) === 1,
    )
    const ondys = await rowOf(page, 'Ondys').innerText()
    check(
      'list: leader with phone from the sync and birthday',
      ondys.includes('608 117 442') && ondys.includes('narozeniny 24. 12. 1998'),
      ondys,
    )

    await page.getByTestId('directory-search').fill('vera pokorn')
    check(
      "search: by a parent's name, without diacritics",
      (await rows(page).count()) === 1 && (await rowOf(page, 'Vydra').count()) === 1,
    )
    await page.getByTestId('directory-search').fill('')
    await page.getByRole('button', { name: /^vedoucí \d+$/ }).click()
    check('filter: leaders', (await rows(page).count()) === 8, String(await rows(page).count()))
    await page.getByRole('button', { name: /^vlčušky \d+$/ }).click()
    check('filter: vlčušky', (await rows(page).count()) === 4, String(await rows(page).count()))

    check(
      'list: a plain directory first (no save buttons)',
      (await page.getByRole('button', { name: /^uložit .* do telefonu$/ }).count()) === 0,
    )
    await page.getByTestId('phone-setup-toggle').click()
    await page.getByRole('button', { name: /^Uložit jednotlivě/ }).click()
    check(
      'pick: iPhone note',
      (await page.getByTestId('pick-note').innerText()).includes('Vytvořit nový kontakt'),
    )
    const saveSojka = rowOf(page, 'Sojka').getByRole('button', { name: /^uložit .* do telefonu$/ })
    const [file] = await Promise.all([page.waitForEvent('download'), saveSojka.click()])
    // Unfolded (long vCard lines continue on the next line after a space).
    const one = (await readFile(await file.path(), 'utf8')).replace(/\r\n /g, '')
    check(
      'download: one card, without ⚜️, named by the nickname',
      file.suggestedFilename() === 'Sojka.vcf' &&
        (one.match(/BEGIN:VCARD/g) ?? []).length === 1 &&
        one.includes('N:(Krejčí Klára);Sojka;;;') &&
        !one.includes('⚜️') &&
        !one.includes('uloženo') &&
        one.includes('ORG:Záře · vlčušky') &&
        one.includes('X-ABLabel:matka') &&
        one.includes('matka.krejci@example.cz') &&
        one.includes('BDAY:2016-11-02') &&
        /NOTE:otec: Rodič Testovací\\, matka: Marie Krejčí\\nstaženo z webu Záře /.test(one),
      one,
    )
    await page.getByRole('button', { name: /^všichni \d+$/ }).click()
    await page.screenshot({ path: `${SCREENSHOTS}directory-desktop.png`, fullPage: true })
    await page.getByTestId('pick-note').getByRole('button', { name: 'hotovo' }).click()
    check(
      'pick: done hides the save buttons',
      (await page.getByRole('button', { name: /^uložit .* do telefonu$/ }).count()) === 0,
    )
  }

  // ---- the phone ----
  let password
  {
    await page.getByTestId('phone-setup-toggle').click()
    await page.getByRole('button', { name: /^Mít všechny a pořád aktuální/ }).click()
    const groups = page.getByTestId('phone-groups')
    await groups.getByLabel('rodiče vlčušek').check()
    await groups.getByLabel('skauti a skautky (jejich vlastní čísla)').check()
    await groups.getByLabel('vedoucí').check()
    await page.getByTestId('groups-saved').waitFor()
    check('phone: a change says it is saved', true)
    const uid = (await signInRest('vedouci@zare.test', PASSWORD)).uid
    let stored
    for (let i = 0; i < 20; i++) {
      stored = await getDoc(`phoneContacts/${uid}`)
      if (stored?.groups?.length === 3) break
      await new Promise((r) => setTimeout(r, 200))
    }
    check(
      'phone: groups saved in their order',
      stored?.groups?.join() === 'vlcParents,ssChildren,leaders',
      JSON.stringify(stored),
    )
    await page.getByRole('button', { name: 'vytvořit heslo pro telefon' }).click()
    await page.getByTestId('phone-password').waitFor({ timeout: 15000 })
    password = (await page.getByTestId('phone-password').locator('b').innerText()).trim()
    const summary = await page.getByTestId('groups-summary').innerText()
    check(
      'phone: groups fold to a summary once there is a password',
      summary.includes('rodiče vlčušek, skauti a skautky (jejich vlastní čísla), vedoucí'),
      summary,
    )
    await page.getByRole('button', { name: 'upravit výběr' }).click()
    check('phone: „upravit výběr“ opens the groups', await groups.isVisible())
    await page.getByRole('button', { name: 'hotovo' }).click()
    check('phone: password shown once', /^[a-z2-9]{4}(-[a-z2-9]{4}){3}$/.test(password), password)
    check(
      'phone: server address',
      (await page.getByTestId('carddav-url').innerText()).includes('/europe-west3/carddav'),
    )
    await page.screenshot({ path: `${SCREENSHOTS}directory-phone.png`, fullPage: true })
    check('directory: no console errors', errors.length === 0, errors.join(' | '))
  }

  // ---- CardDAV ----
  {
    const auth = basic('Vedouci@Zare.test', password)
    check(
      'carddav: wrong password refused',
      (await dav('PROPFIND', '/', basic('vedouci@zare.test', 'spatne'))).status === 401,
    )
    const root = await dav(
      'PROPFIND',
      '/',
      auth,
      '<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>',
      '0',
    )
    check(
      'carddav: principal found (e-mail in any case)',
      root.status === 207 && root.text.includes('/carddav/principal/'),
    )
    const book = await dav(
      'PROPFIND',
      '/addressbooks/zare/',
      auth,
      '<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/"><d:prop><d:getetag/><cs:getctag/><d:current-user-privilege-set/></d:prop></d:propfind>',
    )
    const hrefs = [...book.text.matchAll(/<d:href>([^<]+\.vcf)<\/d:href>/g)].map((m) => m[1])
    // vlc children with parents (4), ss children with own contacts (Vydra), leaders with a phone or e-mail (8)
    check(
      'carddav: cards of the chosen groups, read-only',
      hrefs.length === 4 + 1 + 8 &&
        book.text.includes('<d:privilege><d:read/></d:privilege>') &&
        book.text.includes('<cs:getctag>'),
      String(hrefs.length),
    )
    const multiget = await dav(
      'REPORT',
      '/addressbooks/zare/',
      auth,
      `<c:addressbook-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav"><d:prop><d:getetag/><c:address-data/></d:prop>${hrefs
        .filter((h) => h.includes('child-900202'))
        .map((h) => `<d:href>${h}</d:href>`)
        .join('')}</c:addressbook-multiget>`,
    )
    check(
      'carddav: an ss child has only its own contacts (no parents group chosen)',
      multiget.text.includes('FN:⚜️ Vydra (Pokorný Matěj)') &&
        multiget.text.includes('X-ABLabel:dítě') &&
        multiget.text.includes('matej.p@example.cz') &&
        !multiget.text.includes('X-ABLabel:otec'),
      multiget.text,
    )
    const card = await dav('GET', '/addressbooks/zare/leader-800001.vcf', auth)
    check(
      'carddav: leader card',
      card.text.includes('N:;⚜️ Ondys;;;') &&
        card.text.includes('ORG:Záře · vedoucí') &&
        card.text.includes('BDAY:1998-12-24') &&
        card.text.includes('NOTE:Ondřej Sýkora'),
      card.text,
    )
    check(
      'carddav: writing refused',
      (await dav('PUT', '/addressbooks/zare/x.vcf', auth, 'BEGIN:VCARD')).status === 403 &&
        (await dav('DELETE', '/addressbooks/zare/leader-800001.vcf', auth)).status === 403,
    )
  }

  // ---- ostatní (shared contacts) ----
  {
    await page.getByRole('button', { name: /^všichni \d+$/ }).click()
    await page.getByTestId('add-shared-contact').click()
    const form = page.getByTestId('shared-contact-form')
    await form.getByRole('button', { name: 'uložit' }).click()
    check(
      'ostatní: validated',
      (await form.getByText('Vyplň jméno.').isVisible()) &&
        (await form.getByText('Vyplň telefon nebo e-mail.').isVisible()),
    )
    await form.getByLabel('Jméno').fill('Marie Kovářová')
    await form.getByLabel('Poznámka').fill('správkyně tábořiště')
    await form.getByLabel('Telefon').fill('777 123 456')
    await form.getByRole('button', { name: 'uložit' }).click()
    await form.waitFor({ state: 'detached' })
    const marie = rowOf(page, 'Marie Kovářová')
    await marie.waitFor()
    const text = await marie.innerText()
    check(
      'ostatní: added, the list shows ostatní',
      text.includes('správkyně tábořiště · ostatní') &&
        text.includes('777 123 456') &&
        text.includes('přidal(a) Ondys') &&
        (await page.getByRole('button', { name: /^ostatní 2$/ }).getAttribute('aria-pressed')) ===
          'true',
      text,
    )
    await marie.getByRole('button', { name: 'upravit Marie Kovářová' }).click()
    await form.getByLabel('E-mail').fill('kovarova@example.cz')
    await form.getByRole('button', { name: 'uložit' }).click()
    await form.waitFor({ state: 'detached' })
    const stored = (await listDocs('sharedContacts'))
      .map((d) => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fieldValue(v)])))
      .find((c) => c.name === 'Marie Kovářová')
    check(
      'ostatní: stored with author, edited',
      stored?.email === 'kovarova@example.cz' &&
        stored.phone === '777 123 456' &&
        stored.createdByName === 'Ondys' &&
        Boolean(stored.createdAt),
      JSON.stringify(stored),
    )

    // The phone panel is still open from above.
    await page.getByRole('button', { name: 'upravit výběr' }).click()
    await page.getByTestId('phone-groups').getByLabel('ostatní', { exact: true }).check()
    await page.getByTestId('groups-saved').waitFor()
    const book = await dav(
      'PROPFIND',
      '/addressbooks/zare/',
      basic('vedouci@zare.test', password),
      '<d:propfind xmlns:d="DAV:"><d:prop><d:getetag/></d:prop></d:propfind>',
    )
    const others = [...book.text.matchAll(/other-([A-Za-z0-9-]+)\.vcf/g)].map((m) => m[1])
    const card = await dav(
      'GET',
      `/addressbooks/zare/other-${others.find((id) => id !== 'seed-starosta')}.vcf`,
      basic('vedouci@zare.test', password),
    )
    check(
      'ostatní: in the phone with the group',
      others.length === 2 &&
        card.text.includes('N:;⚜️ Marie Kovářová;;;') &&
        card.text.includes('ORG:Záře · ostatní') &&
        card.text.includes('NOTE:správkyně tábořiště'),
      card.text,
    )
    await page.getByTestId('phone-setup-toggle').click()

    await marie.getByRole('button', { name: 'upravit Marie Kovářová' }).click()
    await form.getByRole('button', { name: 'smazat kontakt' }).click()
    await form.getByRole('button', { name: 'ano, smazat' }).click()
    await form.waitFor({ state: 'detached' })
    await marie.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})
    check(
      'ostatní: deleted for everyone',
      (await marie.count()) === 0 &&
        !(await listDocs('sharedContacts')).some(
          (d) => fieldValue(d.fields.name) === 'Marie Kovářová',
        ),
    )
    check('ostatní: no console errors', errors.length === 0, errors.join(' | '))
  }

  // ---- security rules ----
  {
    const leaderToken = (await signInRest('vedouci@zare.test', PASSWORD)).idToken
    const parent = await signInRest('rodic@zare.test', PASSWORD)
    const admin = await signInRest('spravce@zare.test', PASSWORD)
    const leaderUid = (await signInRest('vedouci@zare.test', PASSWORD)).uid
    check(
      "rules: a leader can't set others' groups or the password date",
      (await patchDocAs(leaderToken, `phoneContacts/${admin.uid}`, {
        groups: { arrayValue: { values: [] } },
      })) === 403 &&
        (await patchDocAs(leaderToken, `phoneContacts/${leaderUid}`, {
          passwordSetAt: { timestampValue: new Date().toISOString() },
        })) === 403,
    )
    const sharedFields = {
      name: { stringValue: 'X' },
      description: { stringValue: '' },
      phone: { stringValue: '1' },
      email: { nullValue: null },
      createdBy: { stringValue: 'someone-else' },
      createdByName: { stringValue: 'X' },
      updatedBy: { stringValue: leaderUid },
    }
    check(
      "rules: ostatní — parents can't read, a leader can't add as someone else",
      (await fetch(`${FIRESTORE}/sharedContacts/seed-starosta`, {
        headers: { Authorization: `Bearer ${parent.idToken}` },
      }).then((r) => r.status)) === 403 &&
        (await patchDocAs(leaderToken, 'sharedContacts/fake', sharedFields)) === 403,
    )
    check(
      "rules: a parent can't have phone contacts",
      (await patchDocAs(parent.idToken, `phoneContacts/${parent.uid}`, {
        groups: { arrayValue: { values: [{ stringValue: 'leaders' }] } },
      })) === 403,
    )
    const read = (token, path) =>
      fetch(`${FIRESTORE}/${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(
        (r) => r.status,
      )
    check(
      'rules: phone passwords readable by nobody, leader birthdays not by parents',
      (await read(leaderToken, `phonePasswords/${leaderUid}`)) === 403 &&
        (await read(parent.idToken, 'skautisPeople/800001/private/details')) === 403 &&
        (await read(leaderToken, 'skautisPeople/800001/private/details')) === 200,
    )
  }
  await leader.ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const m = await openAs(browser, 'vedouci@zare.test', '/vedouci/kontakty', {
      width,
      height: 800,
      mobile: true,
    })
    await rows(m.page).first().waitFor()
    const vydra = rowOf(m.page, 'Vydra')
    const folded = !(await vydra.getByTestId('directory-details').isVisible())
    await vydra.getByRole('button').click()
    check(
      `mobile ${width}: rows folded, a tap opens one`,
      folded && (await vydra.getByText('608 777 888').isVisible()),
    )
    await m.page.getByTestId('phone-setup-toggle').click()
    await m.page.getByRole('button', { name: /^Mít všechny a pořád aktuální/ }).click()
    await m.page.getByTestId('groups-summary').waitFor()
    check(`mobile ${width}: no horizontal overflow`, (await horizontalOverflow(m.page)) <= 0)
    await m.page.screenshot({ path: `${SCREENSHOTS}directory-${width}.png`, fullPage: true })
    await m.ctx.close()
  }
}
