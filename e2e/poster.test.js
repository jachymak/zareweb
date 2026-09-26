// Event poster (SPEC §3.2): content composed from the poster data, packing
// checklist kept locally, unpublished / deleted / camp / cancelled events,
// leader preview of a draft, security rules, mobile widths.
// Data from `scripts/seed-activity.js` (published: seed-stredohori, draft: seed-blanik).

import {
  FIRESTORE,
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  horizontalOverflow,
  openPage,
  patchDoc,
  runScript,
  signInRest,
} from './lib.js'
import { EVENTS } from '../scripts/seed-activity.js'

const PASSWORD = 'heslo1234'
const PARENT = 'rodic@zare.test'
const LEADER = 'vedouci@zare.test'

const stredohori = EVENTS.find((e) => e.id === 'seed-stredohori')

// `2026-10-06`, `2026-10-07` → „6.–7. 10.“ (same month in the seed, or across months)
function range(start, end) {
  const [, sm, sd] = start.split('-').map(Number)
  const [, em, ed] = end.split('-').map(Number)
  if (start === end) return `${sd}. ${sm}.`
  return sm === em ? `${sd}.–${ed}. ${em}.` : `${sd}. ${sm}.–${ed}. ${em}.`
}

// Opens `path`, signs in on the login redirect and waits to come back.
async function openAs(browser, email, path, options) {
  const opened = await openPage(browser, path, options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL((url) => url.pathname === path, { timeout: 10000 })
  return opened
}

const main = (page) => page.getByRole('main')
const poster = (id) => `/clenove/akce/${id}`

export default async function posterSuite({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  // ---- from the parent home to the poster ----
  const { ctx, page, errors } = await openAs(browser, PARENT, '/clenove')
  await page.getByRole('heading', { name: 'Výpravník' }).waitFor({ timeout: 10000 })
  await page
    .getByRole('article', { name: 'Výprava do Středohoří' })
    .getByRole('link', { name: 'plakátek' })
    .click()
  await page.getByRole('heading', { name: 'sbaleno?' }).waitFor({ timeout: 10000 })
  check('poster: opens from „Nejbližší akce“', page.url().endsWith(poster('seed-stredohori')))
  await page.screenshot({ path: `${SCREENSHOTS}poster-desktop.png`, fullPage: true })

  // ---- content ----
  {
    const heading = await page.getByRole('heading', { level: 1 }).innerText()
    check(
      'content: title and date',
      heading.includes('Výprava do Středohoří') &&
        heading.includes(range(stredohori.startDate, stredohori.endDate)),
      heading,
    )
    const text = await main(page).innerText()
    for (const line of [
      'Vyrazíme na dva dny do Českého středohoří',
      'Kam: Milešov, České středohoří (mapa)',
      'Sraz: 8:00 u Památníku, 8:30 na Hlavním nádraží',
      'Návrat: 16:40 na Hlavní nádraží, 17:00 k Památníku',
      'Peněz: 350 Kč',
      'S sebou: Spacák, karimatka, hygienické potřeby, náhradní tričko, lahev s pitím',
      'Jídlo: svačina na sobotu, zbytek vaříme',
      'Těší se na vás Ondys',
      'Ozvěte se organizátorovi — Ondys (+420 608 117 442, ondys@example.cz)',
    ]) {
      check(`content: „${line}“`, text.includes(line))
    }
    check(
      'content: map link',
      (await page.getByRole('link', { name: '(mapa)' }).getAttribute('href')) ===
        'https://mapy.cz/s/milesovka',
    )
    check('content: empty „jinde“ fields left out', !text.includes(', ,'))
  }

  // ---- checklist ----
  {
    const item = page.getByRole('checkbox', { name: 'karimatka' })
    await item.click()
    check('checklist: ticking an item', (await item.getAttribute('aria-checked')) === 'true')
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'sbaleno?' }).waitFor()
    check(
      'checklist: kept after a reload',
      (await page.getByRole('checkbox', { name: 'karimatka' }).getAttribute('aria-checked')) ===
        'true' &&
        (await page.getByRole('checkbox', { name: 'spacák' }).getAttribute('aria-checked')) ===
          'false',
    )
  }

  check('layout: no footer on the poster', (await page.getByRole('contentinfo').count()) === 0)

  // ---- back to the calendar ----
  {
    await page.getByRole('link', { name: '← zpět do výpravníku' }).click()
    await page.getByRole('heading', { name: 'Výpravník' }).waitFor()
    await page.waitForFunction(() => {
      const r = document.getElementById('vypravnik').getBoundingClientRect()
      return r.top >= -2 && r.top < window.innerHeight / 2
    })
    check('back: returns to the calendar anchor', page.url().endsWith('/clenove#vypravnik'))
  }

  // ---- other states ----
  for (const [id, text, name] of [
    ['seed-blanik', 'plakátek se ještě chystá', 'draft: parent sees „chystá se“'],
    ['seed-tabor', 'k téhle akci plakátek není', 'camp: no poster'],
    ['seed-smazana', 'Tuhle akci jsme nenašli', 'deleted event: not found'],
    ['neexistuje', 'Tuhle akci jsme nenašli', 'unknown event: not found'],
  ]) {
    await page.goto(page.url().replace(/\/clenove.*/, poster(id)), { waitUntil: 'load' })
    await page.getByText(text).waitFor({ timeout: 10000 })
    check(`${name}`, true)
  }
  check(
    'draft: parent does not get the draft content',
    (await page.getByText('Rozepsaný plakátek').count()) === 0,
  )

  await patchDoc('events/seed-uzly', { cancelled: { booleanValue: true } })
  await page.goto(page.url().replace(/\/clenove.*/, poster('seed-uzly')), { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'sbaleno?' }).waitFor({ timeout: 10000 })
  check(
    'cancelled: poster marked „Akce je zrušená“',
    await page.getByText('Akce je zrušená.').isVisible(),
  )
  check('parent: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- security rules ----
  {
    const { idToken } = await signInRest(PARENT, PASSWORD)
    const read = async (id) =>
      (
        await fetch(`${FIRESTORE}/events/${id}/poster/content`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
      ).status
    check('rules: parent reads a published poster', (await read('seed-stredohori')) === 200)
    check('rules: parent cannot read a draft poster', (await read('seed-blanik')) === 403)
  }

  // ---- leader preview ----
  {
    const { ctx, page, errors } = await openAs(browser, LEADER, poster('seed-blanik'))
    await page.getByRole('heading', { name: 'sbaleno?' }).waitFor({ timeout: 10000 })
    const text = await main(page).innerText()
    check(
      'leader: draft shown as a preview',
      text.includes('Náhled — rodiče tenhle plakátek zatím nevidí.') &&
        text.includes('Rozepsaný plakátek.'),
    )
    check(
      'leader: back link to the leader home',
      (await page.getByRole('link', { name: '← zpět na vedoucovskou stránku' }).count()) === 1,
    )
    check('leader: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openAs(browser, PARENT, poster('seed-stredohori'), {
      width,
      height: 800,
      mobile: true,
    })
    await page.getByRole('heading', { name: 'sbaleno?' }).waitFor({ timeout: 10000 })
    const overflow = await horizontalOverflow(page)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p, dd')
        })
        .map((el) => el.textContent.trim() || el.name),
    )
    await page.screenshot({ path: `${SCREENSHOTS}poster-${width}.png`, fullPage: true })
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, String(overflow))
    check(`mobile ${width}: tap targets ≥ 24px`, small.length === 0, small.join(', '))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  runScript('seed-activity.js')
}
