// Leaders' news (SPEC §4.4): the list (published, important, withdrawn
// below), publishing with validation and <b>/<i>/<a> in the text (the „?“ hint),
// what a parent sees, editing (an older item's separate link moves into the text),
// withdrawing and restoring, security rules, mobile widths. Accounts from
// `scripts/seed-users.js` (vedouci@ is Ondys 800001), children from
// `scripts/seed-members.js` (rodic@ has children in both troops), news from
// `scripts/seed-activity.js`.

import {
  SCREENSHOTS,
  APP_URL,
  clearAuthAccounts,
  clearCollection,
  FIRESTORE,
  fieldValue,
  horizontalOverflow,
  openPage,
  patchDocAs,
  runScript,
  signInRest,
} from './lib.js'
import { NEWS } from '../scripts/seed-activity.js'

const PASSWORD = 'heslo1234'

async function until(fn, timeout = 10000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 200))
  }
}

async function signIn(browser, email, home, options) {
  const opened = await openPage(browser, '/prihlaseni', options)
  const { page } = opened
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Heslo', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Přihlásit se →' }).click()
  await page.waitForURL(home, { timeout: 10000 })
  return opened
}

async function openNews(browser, options) {
  const opened = await signIn(browser, 'vedouci@zare.test', /\/vedouci$/, options)
  await opened.page.goto(`${APP_URL}/vedouci/aktuality`, { waitUntil: 'load' })
  await opened.page.getByRole('heading', { name: 'Zveřejněné aktuality' }).waitFor()
  return opened
}

// The parent home's news section text (after a fresh load).
async function parentNews(page) {
  await page.reload({ waitUntil: 'load' })
  const section = page.getByRole('region', { name: 'Aktuality' })
  await section.waitFor({ timeout: 10000 })
  return section.innerText()
}

const owner = { Authorization: 'Bearer owner' }
async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: owner })
  return res.ok ? (await res.json()).fields : null
}
async function listNews() {
  const res = await fetch(`${FIRESTORE}/news?pageSize=100`, { headers: owner })
  return (await res.json()).documents ?? []
}

export default async function news({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')
  const leader = await signInRest('vedouci@zare.test', PASSWORD)
  const parentAuth = await signInRest('rodic@zare.test', PASSWORD)

  const { ctx, page, errors } = await openNews(browser)
  const parent = await signIn(browser, 'rodic@zare.test', /\/clenove$/)
  const item = (title) => page.getByRole('article', { name: title })

  // ---- list ----
  {
    const published = page.getByRole('region', { name: 'Zveřejněné aktuality' })
    const withdrawn = page.getByRole('region', { name: /Stažené/ })
    const active = NEWS.filter((n) => !n.withdrawn)
    check(
      `list: ${active.length} published, newest first`,
      (await published.getByRole('article').count()) === active.length &&
        (await published.getByRole('article').first().getAttribute('aria-label')) ===
          [...active].sort((a, b) => a.age - b.age)[0].title,
    )
    check(
      'list: withdrawn item below, marked',
      (await withdrawn.getByRole('article', { name: 'Stažená zpráva' }).innerText()).includes(
        'staženo',
      ),
    )
    const prispevky = await item('Členské příspěvky na školní rok').innerText()
    check(
      'list: important item marked, with tag and author',
      prispevky.includes('důležité') && prispevky.includes('vši') && prispevky.includes('Hobit'),
    )
    await page.screenshot({ path: `${SCREENSHOTS}news-list.png`, fullPage: true })
  }

  // ---- publish ----
  const TITLE = 'Testovací aktualita pro vlčušky'
  const BODY =
    'Příští týden bude schůzka <b>venku</b>.\nVezměte si <i>holinky</i>, sraz je <a href="mapy.cz/s/sarka">tady</a>. <script>x</script>'
  let newsId
  {
    const form = page.getByRole('form', { name: 'Napsat rodičům' })
    await form.getByRole('button', { name: 'zveřejnit' }).click()
    check(
      'publish: required fields reported',
      (await form.getByText('Napiš titulek.').isVisible()) &&
        (await form.getByText('Napiš text vzkazu.').isVisible()),
    )
    await form.getByLabel('Titulek').fill(TITLE)
    await form.getByLabel('Komu se zobrazí').selectOption('vlc')
    await form.getByRole('button', { name: 'Nápověda: tučné písmo, kurzíva, odkazy' }).click()
    check(
      'publish: „?“ explains the tags',
      await form.getByText('Text jde zvýraznit jako v\u00a0HTML:').isVisible(),
    )
    await form.getByLabel('Text', { exact: true }).fill(BODY)
    await form.getByLabel('označit jako důležité').check()
    await form.getByRole('button', { name: 'zveřejnit' }).click()
    check(
      'publish: confirmation shown, form emptied',
      await until(
        async () =>
          (await form.getByRole('status').innerText()).includes('zveřejněno ✓') &&
          (await form.getByLabel('Titulek').inputValue()) === '',
      ),
    )
    const doc = (await listNews()).find((d) => fieldValue(d.fields.title) === TITLE)
    newsId = doc?.name.split('/').at(-1)
    const f = doc?.fields ?? {}
    check(
      'publish: saved with author and date, text as written',
      fieldValue(f.body) === BODY &&
        fieldValue(f.audience) === 'vlc' &&
        fieldValue(f.important) === true &&
        fieldValue(f.withdrawn) === false &&
        !('linkUrl' in f) &&
        fieldValue(f.authorUid) === leader.uid &&
        fieldValue(f.authorName) === 'Ondys' &&
        Math.abs(Date.parse(fieldValue(f.publishedAt)) - Date.now()) < 60000,
      JSON.stringify(f),
    )
    check(
      'publish: listed on top',
      (await page
        .getByRole('region', { name: 'Zveřejněné aktuality' })
        .getByRole('article')
        .first()
        .getAttribute('aria-label')) === TITLE,
    )
    const text = await parentNews(parent.page)
    check('publish: the parent sees it', text.includes(TITLE) && text.includes('Ondys'))
    const featured = parent.page.getByTestId('news-featured')
    check(
      'publish: the parent sees bold, italics and the link; other tags as text',
      (await featured.locator('b').innerText()) === 'venku' &&
        (await featured.locator('i').innerText()) === 'holinky' &&
        (await featured.getByRole('link', { name: 'tady' }).getAttribute('href')) ===
          'https://mapy.cz/s/sarka' &&
        text.includes('<script>x</script>') &&
        (await featured.locator('script').count()) === 0,
    )
  }

  // ---- edit ----
  {
    // An older item with the separate link (before links went into the text).
    await patchDocAs(leader.idToken, `news/${newsId}`, {
      linkLabel: { stringValue: 'mapa' },
      linkUrl: { stringValue: 'https://mapy.cz/s/stara' },
    })
    check(
      'edit: an older link is shown below the text',
      (await parentNews(parent.page)) &&
        (await parent.page
          .getByTestId('news-featured')
          .getByRole('link', { name: 'mapa' })
          .getAttribute('href')) === 'https://mapy.cz/s/stara',
    )
    const publishedAt = fieldValue((await getDoc(`news/${newsId}`)).publishedAt)
    await item(TITLE).getByRole('button', { name: 'upravit' }).click()
    const form = page.getByRole('form', { name: 'Upravit aktualitu' })
    const LEGACY = '\n\n<a href="https://mapy.cz/s/stara">mapa</a>'
    check(
      'edit: item loaded into the form, the older link in the text',
      (await form.getByLabel('Titulek').inputValue()) === TITLE &&
        (await form.getByLabel('Komu se zobrazí').inputValue()) === 'vlc' &&
        (await form.getByLabel('Text', { exact: true }).inputValue()) === BODY + LEGACY &&
        (await form.getByLabel('označit jako důležité').isChecked()),
    )
    await form.getByLabel('Titulek').fill(`${TITLE} (upraveno)`)
    await form.getByRole('button', { name: 'uložit změny' }).click()
    await page.getByRole('form', { name: 'Napsat rodičům' }).waitFor()
    const f =
      (await until(async () => {
        const d = await getDoc(`news/${newsId}`)
        return fieldValue(d.title) === `${TITLE} (upraveno)` && d
      })) || {}
    check(
      'edit: saved, author and date kept, the link moved into the text',
      fieldValue(f.title) === `${TITLE} (upraveno)` &&
        fieldValue(f.publishedAt) === publishedAt &&
        fieldValue(f.authorName) === 'Ondys' &&
        fieldValue(f.body) === BODY + LEGACY &&
        !('linkUrl' in f) &&
        !('linkLabel' in f),
      JSON.stringify(f),
    )
    check(
      'edit: list updated live',
      await until(async () => (await item(`${TITLE} (upraveno)`).count()) === 1),
    )
  }

  // ---- withdraw / restore ----
  {
    const title = `${TITLE} (upraveno)`
    await item(title).getByRole('button', { name: 'stáhnout' }).click()
    check(
      'withdraw: asks first',
      (await item(title).getByText('Opravdu stáhnout?').isVisible()) &&
        fieldValue((await getDoc(`news/${newsId}`)).withdrawn) === false,
    )
    await item(title).getByRole('button', { name: 'ano, stáhnout' }).click()
    check(
      'withdraw: saved, moved below',
      (await until(async () => fieldValue((await getDoc(`news/${newsId}`)).withdrawn) === true)) &&
        (await until(
          async () =>
            (await page
              .getByRole('region', { name: /Stažené/ })
              .getByRole('article', { name: title })
              .count()) === 1,
        )),
    )
    check(
      'withdraw: the parent no longer sees it',
      !(await parentNews(parent.page)).includes(TITLE),
    )
    await item(title).getByRole('button', { name: 'vrátit' }).click()
    check(
      'restore: published again',
      await until(async () => fieldValue((await getDoc(`news/${newsId}`)).withdrawn) === false),
    )
  }

  // ---- security rules ----
  {
    const now = { timestampValue: new Date().toISOString() }
    const fields = (uid) => ({
      title: { stringValue: 'x' },
      body: { stringValue: 'x' },
      audience: { stringValue: 'all' },
      important: { booleanValue: false },
      withdrawn: { booleanValue: false },
      authorUid: { stringValue: uid },
      authorName: { stringValue: 'x' },
      publishedAt: now,
    })
    check(
      'rules: a parent cannot write news',
      (await patchDocAs(parentAuth.idToken, 'news/rules-test', fields(parentAuth.uid))) === 403 &&
        (await patchDocAs(parentAuth.idToken, `news/${newsId}`, {
          withdrawn: { booleanValue: true },
        })) === 403,
    )
    check(
      'rules: a leader cannot sign as someone else or backdate',
      (await patchDocAs(leader.idToken, 'news/rules-test', fields('someone-else'))) === 403 &&
        (await patchDocAs(leader.idToken, `news/${newsId}`, {
          authorName: { stringValue: 'Nina' },
        })) === 403 &&
        (await patchDocAs(leader.idToken, `news/${newsId}`, { publishedAt: now })) === 403,
    )
  }

  check(
    'console: no errors',
    !errors.length && !parent.errors.length,
    [...errors, ...parent.errors].join(' | '),
  )
  await ctx.close()
  await parent.ctx.close()

  // ---- mobile ----
  for (const width of [360, 390]) {
    const problems = []
    const { ctx, page, errors } = await openNews(browser, { width, height: 800, mobile: true })
    const overflow = await horizontalOverflow(page)
    if (overflow > 0) problems.push(`overflow ${overflow}`)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input, select, textarea')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height < 24 && !el.closest('p')
        })
        .map((el) => el.textContent.trim() || el.name || el.type),
    )
    if (small.length) problems.push(`small ${small.join(', ')}`)
    // „upravit“ below the form brings the form into view.
    await page
      .getByRole('article', { name: 'Piknik s rodiči v Šárce' })
      .getByRole('button', { name: 'upravit' })
      .click()
    const form = page.getByRole('form', { name: 'Upravit aktualitu' })
    const inView = await until(() =>
      form.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return r.top >= -10 && r.top < window.innerHeight / 2
      }),
    )
    if (!inView) problems.push('form not scrolled into view')
    if (errors.length) problems.push(errors.join(' | '))
    await page.screenshot({ path: `${SCREENSHOTS}news-${width}.png`, fullPage: true })
    await ctx.close()
    check(
      `mobile ${width}: no overflow, tap targets, edit scrolls up, console errors`,
      !problems.length,
      problems.join('; '),
    )
  }

  runScript('seed-activity.js')
}
