// Guides (SPEC §4.11): only admins — the link in the „správa“ tools, the
// accordion with the open guide kept in the URL; leaders are sent back home;
// mobile widths. Accounts from `scripts/seed-users.js`.

import {
  SCREENSHOTS,
  APP_URL,
  clearAuthAccounts,
  clearCollection,
  horizontalOverflow,
  openPage,
  runScript,
} from './lib.js'

const PASSWORD = 'heslo1234'

async function login(browser, email, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  return opened
}

const guideButton = (page, name) => page.getByRole('button', { name })

export default async function guides({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')

  // ---- admin, desktop ----
  {
    const { ctx, page, errors } = await login(browser, 'spravce@zare.test')
    const link = page.getByRole('group', { name: 'správa' }).getByRole('link', { name: 'Návody' })
    await link.waitFor({ timeout: 10000 })
    await link.click()
    await page.waitForURL('**/vedouci/navody')
    await page.getByRole('heading', { name: 'Návody' }).waitFor()

    const konference = guideButton(page, 'E-mailová konference oddílu ve skautISu')
    const rodic = guideButton(page, 'Rodič nechce dostávat e-maily z konference')
    check(
      'admin: guides listed, all folded',
      (await konference.getAttribute('aria-expanded')) === 'false' &&
        (await rodic.getAttribute('aria-expanded')) === 'false' &&
        !(await page.getByText('Vynutit synchronizaci').first().isVisible()),
    )

    await konference.click()
    await page.waitForURL(/navod=konference/)
    const body = page.getByRole('region', { name: 'E-mailová konference oddílu ve skautISu' })
    check(
      'admin: opened guide shows its steps and help links',
      (await konference.getAttribute('aria-expanded')) === 'true' &&
        (await body.locator('li').count()) >= 5 &&
        (await body.innerText()).includes('Automatická pravidla') &&
        (await body
          .getByRole('link', { name: 'automatická pravidla' })
          .getAttribute('href')
          .then((h) => h.startsWith('https://napoveda.skaut.cz/'))),
    )

    await rodic.click()
    await page.waitForURL(/navod=rodic-nechce-maily/)
    check(
      'admin: one guide open at a time',
      (await konference.getAttribute('aria-expanded')) === 'false' &&
        (await rodic.getAttribute('aria-expanded')) === 'true',
    )

    await page.reload({ waitUntil: 'load' })
    await rodic.waitFor()
    check(
      'admin: the open guide survives a reload (?navod=)',
      (await rodic.getAttribute('aria-expanded')) === 'true',
    )
    await rodic.click()
    await page.waitForURL((url) => !url.search.includes('navod'))
    check('admin: closing removes ?navod=', (await rodic.getAttribute('aria-expanded')) === 'false')

    await konference.click()
    await page.screenshot({ path: `${SCREENSHOTS}guides-desktop.png`, fullPage: true })
    check('admin: no console errors', !errors.length, errors.join(' | '))
    await ctx.close()
  }

  // ---- leader: no link, the page sends them home ----
  {
    const { ctx, page } = await login(browser, 'vedouci@zare.test')
    await page.getByRole('link', { name: 'Schůzky' }).first().waitFor({ timeout: 10000 })
    check('leader: no „Návody“ link', !(await page.getByRole('link', { name: 'Návody' }).count()))
    await page.goto(`${APP_URL}/vedouci/navody`, { waitUntil: 'load' })
    await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
    check('leader: /vedouci/navody redirects to the leader home', true)
    await ctx.close()
  }

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await login(browser, 'spravce@zare.test', {
      width,
      height: 800,
      mobile: true,
    })
    await page.goto(`${APP_URL}/vedouci/navody?navod=konference`, { waitUntil: 'load' })
    await page.getByRole('region', { name: 'E-mailová konference oddílu ve skautISu' }).waitFor()
    const problems = []
    const overflow = await horizontalOverflow(page)
    if (overflow > 0) problems.push(`overflow ${overflow}px`)
    const small = await page
      .getByRole('button', { name: /konference/ })
      .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 40).length)
    if (small) problems.push(`${small} small buttons`)
    if (errors.length) problems.push(errors.join(' | '))
    await page.screenshot({ path: `${SCREENSHOTS}guides-${width}.png`, fullPage: true })
    check(
      `mobile ${width}: no overflow, tap targets, console errors`,
      !problems.length,
      problems.join(', '),
    )
    await ctx.close()
  }
}
