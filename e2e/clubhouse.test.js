// Clubhouse (SPEC §4.5) on mock data from `src/services/clubhouse.js`: readings,
// automat is read-only, manuál enables the controls, changes are logged in
// batches (a minute apart, via the page clock), only the newest 5 shown,
// back to automat restores the schedule, mobile widths. Accounts from
// `scripts/seed-users.js`.

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

async function openClubhouse(browser, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill('vedouci@zare.test')
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.goto(`${APP_URL}/vedouci/klubovna`, { waitUntil: 'load' })
  await page.getByRole('note').waitFor()
  return opened
}

// The page is greyed out until the clubhouse is connected; the tests of the
// controls lift the cover.
async function uncover(page) {
  await page.evaluate(() => {
    document.querySelector('[inert]').inert = false
    document.querySelector('[role="note"]').parentElement.remove()
  })
  await page.getByRole('heading', { name: 'Zařízení' }).waitFor()
}

export default async function clubhouse({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')

  const { ctx, page, errors } = await openClubhouse(browser)

  // ---- greyed out ----
  {
    // A click on „manuál“ does nothing.
    const box = await page.getByRole('button', { name: 'manuál', exact: true }).boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    const covered = await page.evaluate(() =>
      [...document.querySelectorAll('main button')].every((b) => b.closest('[inert]')),
    )
    check(
      'cover: note shown, controls inert',
      (await page.getByRole('note').innerText()).includes('Tohle ještě nefunguje, ale bude') &&
        covered &&
        !(await page.getByText('manuál běží').isVisible()),
    )
    await page.screenshot({ path: `${SCREENSHOTS}clubhouse-cover.png`, fullPage: true })
    await uncover(page)
  }
  const devices = page.getByRole('region', { name: 'Zařízení' })
  const toggle = (name) => devices.getByRole('button', { name: new RegExp(`^${name}:`) })
  const log = page.getByRole('region', { name: 'Log' })

  // ---- automat ----
  {
    const text = await page.locator('main').innerText()
    const humidityRed = await page
      .getByText('64 %')
      .evaluate((el) => getComputedStyle(el).color === 'rgb(192, 73, 42)')
    check('automat: readings shown, high humidity red', text.includes('20,4 °C') && humidityRed)
    check(
      'automat: controls read-only',
      (await toggle('Ventilátory').isDisabled()) &&
        (await devices.getByRole('button', { name: 'o stupeň více' }).isDisabled()) &&
        (await devices.textContent()).includes('v automatu jen pro čtení'),
    )
    check(
      'automat: schedule and log listed',
      (await page.getByRole('region', { name: 'Podle rozvrhu' }).getByRole('listitem').count()) ===
        4 && (await log.getByRole('listitem').count()) === 5,
    )
    await page.screenshot({ path: `${SCREENSHOTS}clubhouse-auto.png`, fullPage: true })
  }

  // ---- manuál ----
  {
    await page.getByRole('button', { name: 'manuál', exact: true }).click()
    check(
      'manuál: 4 h by default, controls enabled',
      (await page.getByText('manuál běží ještě 4 h').isVisible()) &&
        (await toggle('Ventilátory').isEnabled()),
    )
    await page.clock.install()
    const entries = () => log.getByRole('listitem').allInnerTexts()
    const more = devices.getByRole('button', { name: 'o stupeň více' })
    await toggle('Ventilátory').click()
    await more.click()
    await more.click()
    await toggle('Odvlhčovač').click()
    await toggle('Odvlhčovač').click()
    await page.getByRole('button', { name: '2 h', exact: true }).click()
    const batch = 'Ručně: manuál na 2 h, klimatizace 23 °C, ventilátory zapnuté.'
    let list = await entries()
    check(
      'manuál: devices changed, length changed',
      (await page.getByText('manuál běží ještě 2 h').isVisible()) &&
        (await toggle('Ventilátory').innerText()) === 'zapnuto' &&
        (await devices.innerText()).includes('23 °C'),
    )
    check(
      'log: changes within a minute in one entry, undone change left out, newest 5 only',
      list[0].includes(batch) && list.length === 5,
      JSON.stringify(list),
    )
    await page.screenshot({ path: `${SCREENSHOTS}clubhouse-manual.png`, fullPage: true })

    await page.clock.fastForward('01:30')
    await toggle('Bojler').click()
    list = await entries()
    check(
      'log: a change after a minute starts a new entry',
      list[0].includes('Ručně: bojler vypnutý.') && list[1].includes(batch),
      JSON.stringify(list.slice(0, 2)),
    )

    await page.getByRole('button', { name: 'vrátit na automat' }).click()
    list = await entries()
    check(
      'back to automat: schedule restored, read-only, joins the open entry',
      (await toggle('Ventilátory').isDisabled()) &&
        (await toggle('Ventilátory').innerText()) === 'vypnuto' &&
        (await devices.innerText()).includes('21 °C') &&
        list[0].includes('Ručně: zpět na automat.') &&
        list[1].includes(batch),
      JSON.stringify(list.slice(0, 2)),
    )
  }
  check('no console errors', !errors.length, errors.join(' | '))
  await ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const problems = []
    const { ctx, page, errors } = await openClubhouse(browser, { width, height: 800, mobile: true })
    await page.screenshot({ path: `${SCREENSHOTS}clubhouse-cover-${width}.png` })
    await uncover(page)
    await page.getByRole('button', { name: 'manuál', exact: true }).click()
    const overflow = await horizontalOverflow(page)
    if (overflow > 0) problems.push(`overflow ${overflow}`)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim()),
    )
    if (small.length) problems.push(`small ${small.join(', ')}`)
    if (errors.length) problems.push(errors.join(' | '))
    await page.screenshot({ path: `${SCREENSHOTS}clubhouse-${width}.png`, fullPage: true })
    await ctx.close()
    check(
      `mobile ${width}: no overflow, tap targets, console errors`,
      !problems.length,
      problems.join('; '),
    )
  }
}
