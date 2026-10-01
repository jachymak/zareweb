// Troop history page (SPEC §2.5): the link from the Tábor section, the history
// text and the camp list running up to this year's camp.

import { SCREENSHOTS, horizontalOverflow, openPage, pragueToday } from './lib.js'

const FIRST_CAMP_YEAR = 1976
const FILLED_UP_TO = 2018 // last year with a theme in src/content/history.js

// The camp starts in early July, so this year's row appears from July on.
function lastCampYear(today) {
  const [year, month] = today.split('-').map(Number)
  return month >= 7 ? year : year - 1
}

export default async function historyPage({ browser, check }) {
  const last = lastCampYear(pragueToday())
  const rows = (page) => page.locator('#tabory li')

  // ---- desktop: from the home page ----
  {
    const { ctx, page, errors } = await openPage(browser, '/#tabor')
    const link = page.locator('#tabor').getByRole('link', { name: /historie oddílu/i })
    await link.waitFor({ timeout: 10000 })
    check('desktop: Tábor section links to the history', await link.isVisible())
    await link.click()
    await page.waitForURL('**/historie')
    await page.getByRole('heading', { name: 'Historie oddílu' }).waitFor()
    await page.waitForTimeout(1500) // the global smooth scroll
    const top = await page.evaluate(() => scrollY)
    check('desktop: page opens at the top', top === 0, `scrollY=${top}`)
    check(
      'desktop: history text shown',
      (await page.locator('main').innerText()).includes('11. 11. 1975 zakládá nynější oddíl Záře'),
    )
    const years = await rows(page).evaluateAll((lis) =>
      lis.map((li) => Number(li.querySelector('span').textContent)),
    )
    check(
      `desktop: one row per camp year ${FIRST_CAMP_YEAR}–${last}`,
      years.length === last - FIRST_CAMP_YEAR + 1 &&
        years[0] === FIRST_CAMP_YEAR &&
        years.at(-1) === last,
      `${years[0]}…${years.at(-1)} (${years.length})`,
    )
    const text = (year) =>
      rows(page)
        .nth(year - FIRST_CAMP_YEAR)
        .innerText()
    check('desktop: camp theme shown', (await text(1987)).includes('California'))
    check(
      'desktop: per-troop themes shown',
      /vlčušky: Asterix a Obelix[\s\S]*skauti: bez tématu/.test(await text(2017)),
    )
    check(
      'desktop: years without a theme show „doplníme“',
      last <= FILLED_UP_TO || (await text(last)).includes('doplníme'),
    )
    check('desktop: no horizontal overflow', (await horizontalOverflow(page)) <= 0)
    await page.screenshot({ path: `${SCREENSHOTS}history-desktop.png`, fullPage: true })
    await page.getByRole('link', { name: '← Zpět na stránku oddílu' }).click()
    await page.waitForURL(/\/$/)
    check('desktop: back link returns home', await page.locator('#tabor').isVisible())
    check('desktop: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openPage(browser, '/historie', {
      width,
      height: 800,
      mobile: true,
    })
    await rows(page).first().waitFor({ timeout: 10000 })
    check(`mobile ${width}: no horizontal overflow`, (await horizontalOverflow(page)) <= 0)
    const columns = await page
      .locator('#tabory .grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    check(`mobile ${width}: camps in one column`, columns === 1)
    await page.screenshot({ path: `${SCREENSHOTS}history-${width}.png`, fullPage: true })
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
}
