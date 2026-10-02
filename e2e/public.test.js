// Public home page (SPEC §2.1): the intro, content, trail, FAQ, mobile menu,
// and the recruitment years read from settings/public.

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

const introButton = (page) => page.getByRole('button', { name: 'hurá na web' })

// Checks the intro covering the page and leaves it; the page is usable afterwards.
async function passIntro(page, check, label) {
  const button = introButton(page)
  await button.waitFor({ timeout: 10000 })
  const intro = await page.evaluate(() => {
    const layer = document.querySelector('.fixed.inset-0.z-50')
    const img = layer?.querySelector('img')
    const title = [...layer.querySelectorAll('p')].find((p) => p.textContent.includes('Záře'))
    const r = title.parentElement.getBoundingClientRect()
    return {
      covers: layer.getBoundingClientRect().height === innerHeight,
      webp: img?.currentSrc.endsWith('.webp'),
      titleInside: r.left >= 0 && r.right <= innerWidth,
      locked: getComputedStyle(document.documentElement).overflow === 'hidden',
    }
  })
  check(`${label}: intro covers the screen with the painting`, intro.covers && intro.webp)
  check(`${label}: intro title fits the screen`, intro.titleInside)
  check(`${label}: page under the intro doesn't scroll`, intro.locked)
  await button.click()
  await button.waitFor({ state: 'detached', timeout: 3000 })
  check(
    `${label}: „hurá na web“ reveals the page`,
    await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'),
  )
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
    await passIntro(page, check, 'desktop')
    await note(page).waitFor({ timeout: 10000 })
    const text = (await note(page).innerText()).replace(/\s+/g, ' ')
    check('desktop: Firestore emulator was queried', firestoreRequests.length > 0)
    check(
      'desktop: recruitment note from settings/public',
      text.includes(done) && text.includes(next),
      text,
    )

    const d = await page.locator('main > svg path[stroke-dasharray]').getAttribute('d')
    check('desktop: trail path drawn', !!d && d.split('C').length > 10)
    check('desktop: no horizontal overflow', (await horizontalOverflow(page)) <= 0)
    check(
      'desktop: all 7 sketches and the hero drawing loaded',
      await page.evaluate(
        () =>
          [...document.querySelectorAll('[data-stop] img, [data-trail-start] img')].filter(
            (i) => i.complete && i.naturalWidth > 0,
          ).length === 8,
      ),
    )

    const q = page.locator('#otazky button')
    const faqHeight = () => page.locator('#otazky').evaluate((el) => el.offsetHeight)
    const heightBefore = await faqHeight()
    await q.nth(2).click()
    const expanded = await q.evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-expanded')))
    check(
      'desktop: FAQ one open at a time',
      expanded.filter((e) => e === 'true').length === 1 && expanded[2] === 'true',
    )
    const heightAfter = await faqHeight()
    check(
      'desktop: FAQ keeps its height',
      heightAfter === heightBefore,
      `${heightBefore} → ${heightAfter}`,
    )
    await q.nth(2).click()
    check(
      'desktop: FAQ open item stays open',
      (await q.nth(2).getAttribute('aria-expanded')) === 'true',
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
    await page.getByRole('link', { name: '← Zpět na stránku oddílu' }).click()
    await page.waitForURL(/\/$/)
    check(
      'desktop: no intro when coming back within the site',
      (await introButton(page).count()) === 0,
    )
    await page.reload({ waitUntil: 'load' })
    check('desktop: intro again after reload', await introButton(page).isVisible())
    await page.keyboard.press('Space')
    await introButton(page).waitFor({ state: 'detached', timeout: 3000 })
    check(
      'desktop: Space leaves the intro without scrolling',
      await page.evaluate(() => scrollY === 0),
    )
    await page.reload({ waitUntil: 'load' })
    await introButton(page).waitFor({ timeout: 10000 })
    await page.keyboard.press('Enter')
    await introButton(page).waitFor({ state: 'detached', timeout: 3000 })
    check('desktop: Enter leaves the intro', true)
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
    await page.screenshot({ path: `${SCREENSHOTS}public-intro-${width}.png` })
    await passIntro(page, check, `mobile ${width}`)
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

  // ---- a link to a section skips the intro ----
  {
    const { ctx, page } = await openPage(browser, '/#tabor')
    await page.locator('#tabor').waitFor()
    await page.waitForTimeout(500)
    check('link to a section: no intro', (await introButton(page).count()) === 0)
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
