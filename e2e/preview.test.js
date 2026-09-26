// Parent preview (SPEC §4.7): picking a child shows the parent home as its
// parent sees it (siblings included), sign-up clicks explain but save nothing,
// the poster keeps the preview, the child survives a reload, back to the
// leader area, mobile widths. Accounts from `scripts/seed-users.js`, children
// from `scripts/seed-members.js` (rodic@ has Sojka 900102 and Bobr 900201;
// Liška 900103 has no parent account), activity from `scripts/seed-activity.js`.

import {
  SCREENSHOTS,
  clearAuthAccounts,
  clearCollection,
  FIRESTORE,
  horizontalOverflow,
  openPage,
  runScript,
} from './lib.js'

const PASSWORD = 'heslo1234'

async function openPreview(browser, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill('vedouci@zare.test')
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(/\/vedouci$/, { timeout: 10000 })
  await page.getByRole('link', { name: 'náhled pro rodiče' }).click()
  await page.waitForURL(/\/vedouci\/nahled$/)
  return opened
}

async function pick(page, memberId) {
  await page.getByLabel('rodič dítěte').selectOption(memberId)
  await page.waitForURL(new RegExp(`\\?dite=${memberId}$`))
  await page.getByRole('heading', { name: 'Výpravník' }).waitFor({ timeout: 10000 })
}

const participant = async (eventId, memberId) => {
  const res = await fetch(`${FIRESTORE}/events/${eventId}/participants/${memberId}`, {
    headers: { Authorization: 'Bearer owner' },
  })
  return res.ok ? (await res.json()).fields : null
}

const childCards = (page) =>
  page
    .getByRole('article')
    .filter({ has: page.getByTestId('attendance') })
    .count()
const eventCard = (page, title) => page.getByRole('article', { name: title })

export default async function preview({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')

  const { ctx, page, errors } = await openPreview(browser)

  // ---- picking a child ----
  {
    check('pick: asks to pick a child first', await page.getByText('nahoře vyber dítě').isVisible())
    await pick(page, '900102')
    check(
      'pick: parent header, siblings shown too',
      (await page.getByText('· pro členy').isVisible()) &&
        (await page.getByRole('article', { name: 'Sojka', exact: true }).count()) === 1 &&
        (await page.getByRole('article', { name: 'Bobr', exact: true }).count()) === 1 &&
        (await page.getByTestId('preview-bar').innerText()).includes('rodič vidí i Bobr'),
    )
    await page.screenshot({ path: `${SCREENSHOTS}preview-desktop.png`, fullPage: true })
  }

  // ---- sign-up looks real, saves nothing ----
  {
    const stredohori = eventCard(page, 'Výprava do Středohoří')
    check(
      'sign-up: shows the parent’s real sign-ups',
      (await stredohori.getByRole('button', { name: 'Sojka' }).getAttribute('aria-pressed')) ===
        'true',
    )
    const kokorin = eventCard(page, 'Podzimní výprava na Kokořín')
    const bobr = kokorin.getByRole('button', { name: 'Bobr' })
    check('sign-up: toggle is enabled like for the parent', await bobr.isEnabled())
    await bobr.click()
    const notice = await kokorin.getByText('Tohle je jen náhled').innerText()
    check(
      'sign-up: click explains what it would do',
      notice.includes('Bobr rovnou přihlásí'),
      notice,
    )
    await new Promise((r) => setTimeout(r, 500))
    check(
      'sign-up: nothing written, toggle unchanged',
      !(await participant('seed-kokorin', '900201')) &&
        (await bobr.getAttribute('aria-pressed')) === 'false',
    )
    const uzly = eventCard(page, 'Uzlovací závody')
    await uzly.getByRole('button', { name: 'Bobr' }).click()
    check(
      'sign-up: after the deadline the parent’s notice',
      await uzly.getByText('Přihlašování už skončilo').isVisible(),
    )
  }

  // ---- poster keeps the preview ----
  {
    await eventCard(page, 'Výprava do Středohoří').getByRole('link', { name: 'plakátek' }).click()
    await page.waitForURL(/\/clenove\/akce\/seed-stredohori\?nahled=900102$/)
    await page.getByRole('link', { name: '← zpět do výpravníku' }).waitFor()
    check(
      'poster: parent look with the preview bar',
      (await page.getByTestId('preview-bar').isVisible()) &&
        (await page.getByText('· pro členy').isVisible()),
    )
    await page.getByRole('link', { name: '← zpět do výpravníku' }).click()
    await page.waitForURL(/\/vedouci\/nahled\?dite=900102#vypravnik$/)
    await page.getByRole('heading', { name: 'Výpravník' }).waitFor()
    check('poster: back to the preview calendar', true)
  }

  // ---- child without a parent account, reload ----
  {
    await pick(page, '900103')
    check(
      'pick: only the child when it has no parent',
      (await childCards(page)) === 1 &&
        (await page.getByRole('article', { name: 'Liška', exact: true }).count()) === 1,
    )
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('heading', { name: 'Výpravník' }).waitFor()
    check(
      'reload: keeps the picked child',
      (await page.getByLabel('rodič dítěte').inputValue()) === '900103',
    )
    await page.getByRole('link', { name: '← zpět do sekce pro vedoucí' }).click()
    await page.waitForURL(/\/vedouci$/)
    check('back: to the leader home', true)
  }
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const { ctx, page, errors } = await openPreview(browser, { width, height: 800, mobile: true })
    await pick(page, '900102')
    const overflow = await horizontalOverflow(page)
    await page.screenshot({ path: `${SCREENSHOTS}preview-${width}.png`, fullPage: true })
    check(`mobile ${width}: no horizontal overflow`, overflow <= 0, String(overflow))
    check(`mobile ${width}: no console errors`, errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
}
