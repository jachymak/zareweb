// Public home page (SPEC §2.1): content, trail, FAQ, mobile menu, and the
// recruitment years read from settings/public.

import { formatSchoolYear, recruitmentYears } from '../functions/src/shared/schoolYear.js'
import {
  SCREENSHOTS,
  deleteDoc,
  horizontalOverflow,
  openPage,
  patchDoc,
  pragueToday,
} from './lib.js'

const setReset = (date) => patchDoc('settings/public', { lastWaitlistReset: { stringValue: date } })

function expectedYears(reset) {
  const { doneYear, nextYear } = recruitmentYears(reset, pragueToday())
  return [formatSchoolYear(doneYear), formatSchoolYear(nextYear)]
}

export default async function publicPage({ browser, check }) {
  const note = (page) => page.locator('[data-testid=recruitment-note]')
  const RESET = '2026-08-24'
  const [done, next] = expectedYears(RESET)
  await setReset(RESET)

  // ---- desktop ----
  {
    const { ctx, page, errors } = await openPage(browser, '/')
    const firestoreRequests = []
    page.on('request', (r) => r.url().includes('127.0.0.1:8080') && firestoreRequests.push(r))
    await page.reload({ waitUntil: 'load' })
    await note(page).waitFor({ timeout: 10000 })
    const text = (await note(page).innerText()).replace(/\s+/g, ' ')
    check('desktop: Firestore emulator was queried', firestoreRequests.length > 0)
    check(
      'desktop: recruitment note from settings/public',
      text.includes(done) && text.includes(next),
      text,
    )

    const d = await page.locator('main > svg path').getAttribute('d')
    check('desktop: trail path drawn', !!d && d.split('C').length > 10)
    check('desktop: no horizontal overflow', (await horizontalOverflow(page)) <= 0)
    check(
      'desktop: all 8 sketches loaded',
      await page.evaluate(
        () =>
          [...document.querySelectorAll('[data-stop] img')].filter(
            (i) => i.complete && i.naturalWidth > 0,
          ).length === 8,
      ),
    )

    const q = page.locator('#otazky button')
    await q.nth(2).click()
    const expanded = await q.evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-expanded')))
    check(
      'desktop: FAQ one open at a time',
      expanded.filter((e) => e === 'true').length === 1 && expanded[2] === 'true',
    )

    await page.screenshot({ path: `${SCREENSHOTS}public-desktop.png`, fullPage: true })
    await page.getByRole('link', { name: 'Zapsat na čekací listinu' }).click()
    await page.waitForURL('**/cekaci-listina')
    check(
      'desktop: CTA → /cekaci-listina',
      await page.getByRole('heading', { name: 'Čekací listina' }).isVisible(),
    )

    // Round trip: change the data in Firestore, the page follows.
    const OTHER_RESET = '2025-03-10'
    const [done2, next2] = expectedYears(OTHER_RESET)
    await setReset(OTHER_RESET)
    await page.goto(page.url().replace('/cekaci-listina', '/'), { waitUntil: 'load' })
    await note(page).waitFor()
    const text2 = (await note(page).innerText()).replace(/\s+/g, ' ')
    check(
      'round trip: changed lastWaitlistReset shows new years',
      text2.includes(done2) && text2.includes(next2),
      text2,
    )
    await setReset(RESET)
    await page.reload({ waitUntil: 'load' })
    await note(page).waitFor()
    check('round trip: restored value shows again', (await note(page).innerText()).includes(done))
    check('desktop: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openPage(browser, '/', { width, height: 800, mobile: true })
    await note(page).waitFor({ timeout: 10000 })
    check(`mobile ${width}: recruitment note shown`, (await note(page).innerText()).includes(next))
    check(`mobile ${width}: no horizontal overflow`, (await horizontalOverflow(page)) <= 0)
    check(
      `mobile ${width}: desktop trail hidden`,
      !(await page.locator('main > svg').first().isVisible()),
    )
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p, footer')
        })
        .map((el) => el.textContent.trim()),
    )
    check(`mobile ${width}: standalone tap targets ≥ 24px`, small.length === 0, small.join(', '))
    await page.screenshot({ path: `${SCREENSHOTS}public-${width}.png` })

    await page.getByRole('button', { name: 'Otevřít menu' }).click()
    await page.locator('#public-menu').getByRole('link', { name: 'Pro rodiče' }).click()
    await page.waitForTimeout(2500) // smooth scroll over the whole page
    const faqTop = await page.locator('#otazky').evaluate((el) => el.getBoundingClientRect().top)
    check(
      `mobile ${width}: menu link scrolls to FAQ and closes menu`,
      faqTop >= 0 && faqTop < 200 && !(await page.locator('#public-menu').isVisible()),
      `top=${Math.round(faqTop)}`,
    )
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ---- settings/public missing ----
  {
    await deleteDoc('settings/public')
    const { ctx, page, errors } = await openPage(browser, '/')
    await page.waitForTimeout(1000)
    check(
      'missing settings/public: note hidden, page renders',
      (await note(page).count()) === 0 &&
        (await page.getByRole('heading', { name: 'Momentálně máme plno' }).isVisible()),
    )
    check('missing settings/public: no errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
}
