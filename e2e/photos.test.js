// Photo albums (SPEC §3.3, §4.9): what parents see (home, all albums, the
// justified grid, lightbox with ?photo= and the original download, the
// Výpravník link), security rules for Firestore and Storage, and the leaders'
// side — a new album from an event, upload incl. rejected HEIC, processing by
// the Cloud Function, cover, deleting photos, publishing, editing, deleting
// the album — at desktop and mobile widths. Accounts from `scripts/seed-users.js`,
// events from `scripts/seed-activity.js`, albums from `scripts/seed-photos.js`.

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  APP_URL,
  clearAuthAccounts,
  clearCollection,
  FIRESTORE,
  fieldValue,
  horizontalOverflow,
  openPage,
  patchDocAs,
  runScript,
  SCREENSHOTS,
  signInRest,
} from './lib.js'
import { ALBUMS } from '../scripts/seed-photos.js'

const PASSWORD = 'heslo1234'
const BUCKET = `${process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'}.appspot.com`
const STORAGE = `http://127.0.0.1:9199/v0/b/${BUCKET}/o`
const owner = { Authorization: 'Bearer owner' }

// sharp is a dependency of the functions.
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const sharp = (await import(pathToFileURL(require.resolve('sharp')).href)).default
const jpeg = (width, height, color) =>
  sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg()
    .withExif({ IFD2: { DateTimeOriginal: '2026:09:20 10:15:00' } })
    .toBuffer()

async function until(fn, timeout = 20000) {
  const end = Date.now() + timeout
  for (;;) {
    const value = await fn()
    if (value || Date.now() > end) return value
    await new Promise((r) => setTimeout(r, 300))
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

async function getDoc(path) {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: owner })
  return res.ok ? (await res.json()).fields : null
}
async function listDocs(path) {
  const res = await fetch(`${FIRESTORE}/${path}?pageSize=300`, { headers: owner })
  return (await res.json()).documents ?? []
}
async function storageFiles(prefix) {
  const res = await fetch(`${STORAGE}?prefix=${encodeURIComponent(prefix)}`, { headers: owner })
  return ((await res.json()).items ?? []).map((i) => i.name)
}
async function storageMeta(name) {
  const res = await fetch(`${STORAGE}/${encodeURIComponent(name)}`, { headers: owner })
  return res.ok ? res.json() : null
}

// Every row of the grid: tiles of equal height, justified rows as wide as the grid.
async function gridIsJustified(page) {
  return page.evaluate(() => {
    const problems = []
    for (const grid of document.querySelectorAll('[data-testid="photo-day"]')) {
      const tiles = [...grid.querySelectorAll('[data-testid="photo-tile"]')].map((t) =>
        t.getBoundingClientRect(),
      )
      const rows = new Map()
      tiles.forEach((r) => rows.set(Math.round(r.top), [...(rows.get(Math.round(r.top)) ?? []), r]))
      const list = [...rows.values()]
      const gridRight = Math.max(...tiles.map((r) => r.right))
      list.forEach((row, i) => {
        if (row.some((r) => Math.abs(r.height - row[0].height) > 1)) problems.push('height')
        const right = Math.max(...row.map((r) => r.right))
        if (i < list.length - 1 && Math.abs(right - gridRight) > 1) problems.push('width')
      })
    }
    return problems
  })
}

export default async function photos({ browser, check }) {
  await clearAuthAccounts()
  await clearCollection('users')
  runScript('seed-users.js')
  runScript('seed-members.js')
  runScript('seed-activity.js')
  runScript('seed-photos.js')
  // The long synchronous seed leaves pooled keep-alive connections dead; the
  // first request may hit one.
  const parentAuth = await signInRest('rodic@zare.test', PASSWORD).catch(() =>
    signInRest('rodic@zare.test', PASSWORD),
  )
  const leaderAuth = await signInRest('vedouci@zare.test', PASSWORD)
  const published = ALBUMS.filter((a) => a.published)
  const hidden = ALBUMS.find((a) => !a.published)

  // ---- parent ----
  const parent = await signIn(browser, 'rodic@zare.test', /\/clenove$/)
  {
    const { page } = parent
    const section = page.getByRole('region', { name: 'Fotky' })
    await section.getByTestId('album-card').first().waitFor()
    const titles = await section.getByTestId('album-card').allInnerTexts()
    check(
      'home: four latest published albums',
      titles.length === 4 &&
        titles[0].includes('Hry v Šárce') &&
        !titles.some((t) => t.includes(hidden.title)),
      titles.join(' | '),
    )
    check('home: card detail „září · 9 fotek“ style', /· 9 fotek/.test(titles[0]))

    await page.getByRole('button', { name: 'proběhlo' }).click()
    const link = page
      .getByTestId('calendar-event')
      .filter({ hasText: 'Zahajovací výprava' })
      .getByRole('link', { name: 'fotky →' })
    check('calendar: past event links to its album', (await link.count()) === 1)

    await section.getByRole('link', { name: 'všechna alba →' }).click()
    await page.waitForURL(/\/clenove\/fotky$/)
    await page.getByTestId('album-card').first().waitFor()
    const all = await page.getByTestId('album-card').allInnerTexts()
    check(
      'all albums: published ones by school year, hidden not listed',
      all.length === published.length &&
        !all.some((t) => t.includes(hidden.title)) &&
        (await page.getByRole('region', { name: /^Školní rok/ }).count()) === 2,
      all.join(' | '),
    )
    await page.screenshot({ path: `${SCREENSHOTS}photos-albums.png`, fullPage: true })

    await page.getByTestId('album-card').filter({ hasText: 'Zahajovací výprava' }).click()
    await page.waitForURL(/\/clenove\/fotky\/seed-album-zahajovaci$/)
    await page.getByTestId('photo-tile').first().waitFor()
    check('album: all 16 photos', (await page.getByTestId('photo-tile').count()) === 16)
    check(
      'album: grouped by day',
      (await page.getByTestId('photo-day').count()) === 2 &&
        (await page.getByRole('heading', { level: 2 }).first().innerText()).match(/\d+\. /),
    )
    const problems = await gridIsJustified(page)
    check('album: justified rows (equal heights, full width)', !problems.length, problems.join())
    const third = await page.getByTestId('photo-tile').nth(2).boundingBox()
    check('album: EXIF-rotated photo shown as portrait', third.height > third.width)
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SCREENSHOTS}photos-album.png`, fullPage: true })

    // lightbox
    await page.getByTestId('photo-tile').nth(1).click()
    await page.locator('.pswp--open').waitFor()
    const photoId = new URL(page.url()).searchParams.get('photo')
    check('lightbox: opens, photo in the URL', !!photoId)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${SCREENSHOTS}photos-lightbox.png` })
    await page.keyboard.press('ArrowRight')
    await until(async () => new URL(page.url()).searchParams.get('photo') !== photoId, 3000)
    check(
      'lightbox: next photo updates the URL',
      new URL(page.url()).searchParams.get('photo') !== photoId,
    )
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.getByRole('button', { name: 'Stáhnout originál' }).click(),
    ])
    check(
      'lightbox: „Stáhnout originál“ downloads the original',
      /^IMG_41\d\d\.jpg$/.test(download?.suggestedFilename() ?? ''),
      download?.suggestedFilename(),
    )
    await page.goBack()
    check(
      'lightbox: back button closes it',
      await until(async () => (await page.locator('.pswp--open').count()) === 0, 5000),
    )
    await page.goto(`${APP_URL}/clenove/fotky/seed-album-zahajovaci?photo=${photoId}`, {
      waitUntil: 'load',
    })
    check(
      'lightbox: a shared link opens the photo',
      !!(await page
        .locator('.pswp--open')
        .waitFor({ timeout: 8000 })
        .then(
          () => true,
          () => false,
        )),
    )

    await page.goto(`${APP_URL}/clenove/fotky/${hidden.id}`, { waitUntil: 'load' })
    check(
      'hidden album: not shown to parents',
      await page
        .getByText('Tohle album jsme nenašli')
        .waitFor({ timeout: 8000 })
        .then(
          () => true,
          () => false,
        ),
    )
    check('parent: no console errors', !parent.errors.length, parent.errors.join(' | '))
  }

  // ---- security rules ----
  {
    const hiddenRead = await fetch(`${FIRESTORE}/albums/${hidden.id}`, {
      headers: { Authorization: `Bearer ${parentAuth.idToken}` },
    })
    check('rules: parent cannot read a hidden album', hiddenRead.status === 403)
    check(
      'rules: parent cannot edit an album',
      (await patchDocAs(parentAuth.idToken, 'albums/seed-album-sarka', {
        title: { stringValue: 'x' },
      })) === 403,
    )
    check(
      'rules: leader cannot write photo documents',
      (await patchDocAs(leaderAuth.idToken, 'albums/seed-album-sarka/photos/fake', {
        status: { stringValue: 'ready' },
      })) === 403,
    )
    check(
      'rules: leader cannot change the photo count',
      (await patchDocAs(leaderAuth.idToken, 'albums/seed-album-sarka', {
        photoCount: { integerValue: '999' },
      })) === 403,
    )
    const upload = (token, name, type = 'image/jpeg') =>
      fetch(`${STORAGE}?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { Authorization: `Firebase ${token}`, 'Content-Type': type },
        body: Buffer.from('not really a photo'),
      }).then((r) => r.status)
    check(
      'rules: parent cannot upload photos',
      (await upload(parentAuth.idToken, 'originals/seed-album-sarka/abcdefghijABCDEFGHIJ.jpg')) ===
        403,
    )
    check(
      'rules: nobody uploads thumbnails',
      (await upload(leaderAuth.idToken, 'thumbs/seed-album-sarka/abcdefghijABCDEFGHIJ.jpg')) ===
        403,
    )
    const [original] = await storageFiles(`originals/${hidden.id}/`)
    const read = await fetch(`${STORAGE}/${encodeURIComponent(original)}?alt=media`, {
      headers: { Authorization: `Firebase ${parentAuth.idToken}` },
    })
    check('rules: parent cannot download originals of a hidden album', read.status === 403)
  }

  // ---- leader ----
  const leader = await signIn(browser, 'vedouci@zare.test', /\/vedouci$/)
  const { page } = leader
  const tool = page
    .getByRole('navigation', { name: 'Nástroje' })
    .getByRole('link', { name: 'Fotky' })
  check(
    'leader home: „Fotky“ tool',
    await tool.waitFor({ timeout: 10000 }).then(
      () => true,
      () => false,
    ),
  )
  await page.goto(`${APP_URL}/vedouci/fotky`, { waitUntil: 'load' })
  await page.getByTestId('album-card').first().waitFor()
  check(
    'leader list: all albums incl. hidden, with status',
    (await page.getByTestId('album-card').count()) === ALBUMS.length &&
      (await page.getByTestId('album-card').filter({ hasText: hidden.title }).innerText()).includes(
        'skryté před rodiči',
      ),
  )
  await page.screenshot({ path: `${SCREENSHOTS}photos-leader-list.png`, fullPage: true })

  // new album from an event
  let albumId
  {
    await page.getByRole('link', { name: '+ nové album' }).click()
    const form = page.getByRole('form', { name: 'Nové album' })
    await form.getByRole('button', { name: 'založit album' }).click()
    check(
      'new album: title and date required',
      await form.getByText('Napiš název alba.').isVisible(),
    )
    const option = await form
      .getByLabel('Z které akce')
      .locator('option', { hasText: 'Výprava do Brd' })
      .getAttribute('value')
    await form.getByLabel('Z které akce').selectOption(option)
    check(
      'new album: the event fills in title and troop',
      (await form.getByLabel('Název alba').inputValue()) === 'Výprava do Brd' &&
        (await form.getByLabel('Pro koho').inputValue()) === 'ss',
    )
    await form.getByLabel('Název alba').fill('Testovací album')
    await form.getByRole('button', { name: 'založit album' }).click()
    await page.waitForURL(/\/vedouci\/fotky\/[A-Za-z0-9]+$/)
    albumId = page.url().split('/').at(-1)
    const f = (await getDoc(`albums/${albumId}`)) ?? {}
    check(
      'new album: saved hidden, linked to the event',
      fieldValue(f.title) === 'Testovací album' &&
        fieldValue(f.eventId) === 'seed-brdy' &&
        fieldValue(f.audience) === 'ss' &&
        fieldValue(f.published) === false &&
        fieldValue(f.groupByDay) === true &&
        fieldValue(f.photoCount) === '0' &&
        fieldValue(f.createdBy) === leaderAuth.uid,
      JSON.stringify(f),
    )
  }

  // upload
  {
    await page.getByTestId('photo-input').setInputFiles([
      { name: 'les.jpg', mimeType: 'image/jpeg', buffer: await jpeg(1600, 1000, '#4f7a4a') },
      { name: 'Ohýnek.jpg', mimeType: 'image/jpeg', buffer: await jpeg(900, 1400, '#c0492a') },
      { name: 'louka.jpg', mimeType: 'image/jpeg', buffer: await jpeg(1400, 1400, '#e5a83c') },
      { name: 'IMG_0001.HEIC', mimeType: '', buffer: Buffer.from('heic') },
      { name: 'seznam.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
    ])
    const alert = page.getByRole('alert').filter({ hasText: 'nenahrál' })
    await alert.waitFor()
    const text = await alert.innerText()
    check(
      'upload: HEIC and other files rejected with a reason',
      text.includes('IMG_0001.HEIC') &&
        text.includes('HEIC (iPhone)') &&
        text.includes('seznam.txt'),
    )
    const processed = await until(
      async () => (await page.getByTestId('photo-tile').count()) === 3,
      40000,
    )
    check('upload: three photos processed and shown', processed)
    check(
      'upload: progress finished',
      (await page.getByTestId('upload-progress').innerText()).includes('nahráno 3 fotky'),
    )
    const order = await page
      .getByTestId('photo-tile')
      .getByRole('link')
      .evaluateAll((links) => links.map((a) => a.getAttribute('aria-label')))
    check(
      'order: same time taken → by file name',
      order.join() === 'les.jpg,louka.jpg,Ohýnek.jpg',
      order.join(),
    )
    const help = page.getByTestId('order-help')
    await help.getByText('Jak se fotky v albu řadí?').click()
    check(
      'upload: ordering explained',
      (await help.innerText()).includes('01.jpg, 02.jpg') &&
        (await help.innerText()).includes('Přesouvat fotky v už nahraném albu zatím nejde'),
    )
    // The count is raised right after the photo document is written.
    await until(async () => fieldValue((await getDoc(`albums/${albumId}`)).photoCount) === '3')
    const docs = await listDocs(`albums/${albumId}/photos`)
    const album = (await getDoc(`albums/${albumId}`)) ?? {}
    check(
      'upload: photo documents by the function, count and cover set',
      docs.length === 3 &&
        docs.every((d) => fieldValue(d.fields.status) === 'ready') &&
        fieldValue(album.photoCount) === '3' &&
        docs.some((d) => d.name.endsWith(fieldValue(album.coverPhotoId))),
      JSON.stringify({ count: album.photoCount, cover: album.coverPhotoId }),
    )
    const ohynek = docs.find((d) => fieldValue(d.fields.originalFilename) === 'Ohýnek.jpg')?.fields
    check(
      'upload: size, colour, date and uploader stored',
      fieldValue(ohynek?.width) === '900' &&
        fieldValue(ohynek?.height) === '1400' &&
        /^#[0-9a-f]{6}$/.test(fieldValue(ohynek?.dominantColor)) &&
        fieldValue(ohynek?.takenAt) === '2026-09-20T08:15:00Z' &&
        fieldValue(ohynek?.uploadedBy) === leaderAuth.uid,
      JSON.stringify(ohynek),
    )
    const files = await Promise.all(
      ['originals', 'previews', 'thumbs'].map((f) => storageFiles(`${f}/${albumId}/`)),
    )
    check(
      'upload: original, preview and thumbnail in Storage',
      files.every((f) => f.length === 3),
    )
    const meta = await storageMeta(fieldValue(ohynek?.originalPath))
    check(
      'upload: original downloads under its name',
      meta?.contentDisposition?.startsWith('attachment') &&
        meta.contentDisposition.includes("UTF-8''Oh%C3%BDnek.jpg"),
      meta?.contentDisposition,
    )
  }

  // cover and deleting
  {
    const tile = (name) =>
      page.getByTestId('photo-tile').filter({ has: page.getByRole('link', { name }) })
    await tile('louka.jpg').hover()
    await page.getByRole('button', { name: 'vybrat louka.jpg' }).click()
    await page
      .getByTestId('selection-bar')
      .getByRole('button', { name: 'nastavit jako titulní' })
      .click()
    const louka = (await listDocs(`albums/${albumId}/photos`)).find(
      (d) => fieldValue(d.fields.originalFilename) === 'louka.jpg',
    )
    const loukaId = louka.name.split('/').at(-1)
    check(
      'cover: chosen photo becomes the cover',
      await until(
        async () => fieldValue((await getDoc(`albums/${albumId}`)).coverPhotoId) === loukaId,
      ),
    )

    await page.getByRole('button', { name: 'vybrat fotky' }).click()
    await tile('louka.jpg').click()
    await tile('les.jpg').click()
    const bar = page.getByTestId('selection-bar')
    check('select: two selected', (await bar.innerText()).includes('vybráno 2'))
    await page.screenshot({ path: `${SCREENSHOTS}photos-leader-select.png`, fullPage: true })
    await bar.getByRole('button', { name: 'smazat' }).click()
    await bar.getByRole('button', { name: 'ano, smazat' }).click()
    check(
      'delete: photos gone from the grid',
      await until(async () => (await page.getByTestId('photo-tile').count()) === 1),
    )
    const album = await getDoc(`albums/${albumId}`)
    const left = await listDocs(`albums/${albumId}/photos`)
    check(
      'delete: documents, count and cover updated',
      left.length === 1 &&
        fieldValue(album.photoCount) === '1' &&
        left[0].name.endsWith(fieldValue(album.coverPhotoId)),
    )
    check(
      'delete: files removed from Storage',
      (await storageFiles(`thumbs/${albumId}/`)).length === 1 &&
        (await storageFiles(`originals/${albumId}/`)).length === 1,
    )
  }

  // publish, edit
  {
    await page.getByRole('button', { name: 'zveřejnit album' }).click()
    check(
      'publish: saved',
      await until(async () => fieldValue((await getDoc(`albums/${albumId}`)).published) === true),
    )
    check(
      'publish: status shown',
      (await page.getByTestId('album-status').innerText()).includes('zveřejněné'),
    )
    await parent.page.goto(`${APP_URL}/clenove/fotky`, { waitUntil: 'load' })
    await parent.page.getByTestId('album-card').first().waitFor()
    check(
      'publish: the parent sees the album',
      (await parent.page
        .getByTestId('album-card')
        .filter({ hasText: 'Testovací album' })
        .count()) === 1,
    )

    await page.getByRole('button', { name: 'upravit' }).click()
    const form = page.getByRole('form', { name: 'Upravit album' })
    check(
      'grouping: the photo is under its day',
      (await page.getByTestId('photo-day').getByRole('heading').count()) === 1,
    )
    await form.getByLabel('Název alba').fill('Testovací album (upraveno)')
    await form.getByLabel('fotky rozdělit po dnech').uncheck()
    await form.getByRole('button', { name: 'uložit změny' }).click()
    check(
      'edit: title and grouping saved',
      await until(async () => {
        const f = await getDoc(`albums/${albumId}`)
        return (
          fieldValue(f.title) === 'Testovací album (upraveno)' && fieldValue(f.groupByDay) === false
        )
      }),
    )
    check(
      'grouping off: no day headings',
      await until(
        async () => (await page.getByTestId('photo-day').getByRole('heading').count()) === 0,
      ),
    )
  }

  // mobile widths
  for (const width of [360, 390]) {
    const m = await signIn(browser, 'vedouci@zare.test', /\/vedouci$/, {
      width,
      height: 780,
      mobile: true,
    })
    for (const path of [
      '/vedouci/fotky',
      `/vedouci/fotky/${albumId}`,
      '/clenove/fotky/seed-album-brdy',
    ]) {
      await m.page.goto(APP_URL + path, { waitUntil: 'load' })
      await m.page
        .getByTestId(path.endsWith('fotky') ? 'album-card' : 'photo-tile')
        .first()
        .waitFor()
      check(`${width}px ${path}: no horizontal overflow`, (await horizontalOverflow(m.page)) === 0)
    }
    const problems = await gridIsJustified(m.page)
    check(`${width}px: grid justified`, !problems.length, problems.join())
    await m.page.screenshot({ path: `${SCREENSHOTS}photos-album-${width}.png`, fullPage: true })
    check(`${width}px: no console errors`, !m.errors.length, m.errors.join(' | '))
    await m.ctx.close()
  }

  // big photos: asked first, shrunk in the browser with the date kept
  {
    // 5000×3500 rotated by EXIF (upright 3500×5000), ~14 MB
    const raw = await sharp({
      create: {
        width: 5000,
        height: 3500,
        channels: 3,
        noise: { type: 'gaussian', mean: 128, sigma: 8 },
      },
    })
      .raw()
      .toBuffer({ resolveWithObject: true })
    const big = await sharp(raw.data, { raw: raw.info })
      .jpeg({ quality: 100 })
      .withExif({ IFD2: { DateTimeOriginal: '2026:09:21 18:30:00' } })
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const small = await jpeg(800, 600, '#3a6b8c')
    const files = [
      { name: 'velka.jpg', mimeType: 'image/jpeg', buffer: big },
      { name: 'mala.jpg', mimeType: 'image/jpeg', buffer: small },
    ]
    const before = (await storageFiles(`originals/${albumId}/`)).length
    const dialog = page.getByTestId('big-photos')

    await page.getByTestId('photo-input').setInputFiles(files)
    await dialog.waitFor()
    const text = await dialog.innerText()
    check(
      'big photos: asked before uploading',
      text.includes('Jedna fotka je zbytečně velká') && text.includes('přes 7 MB'),
      text,
    )
    await page.setViewportSize({ width: 360, height: 780 })
    const boxes = await dialog
      .locator('button, h2, p')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))
    check(
      'big photos: dialog fits 360px',
      boxes.every((b) => b.left >= 0 && b.right <= 360),
      JSON.stringify(boxes.map((b) => [b.left, b.right])),
    )
    await page.screenshot({ path: `${SCREENSHOTS}photos-big-360.png` })
    await page.setViewportSize({ width: 1280, height: 900 })
    await dialog.getByRole('button', { name: 'zrušit, zmenším si ji sám' }).click()
    await dialog.waitFor({ state: 'detached' })
    await page.waitForTimeout(1500)
    check(
      'big photos: cancel uploads nothing',
      (await storageFiles(`originals/${albumId}/`)).length === before,
    )

    await page.getByTestId('photo-input').setInputFiles(files)
    await dialog.getByRole('button', { name: 'zmenšit a nahrát' }).click()
    const uploaded = (docs) =>
      Object.fromEntries(
        docs
          .map((d) => d.fields)
          .filter((f) => ['velka.jpg', 'mala.jpg'].includes(fieldValue(f.originalFilename)))
          .map((f) => [fieldValue(f.originalFilename), f]),
      )
    let photos = {}
    await until(async () => {
      photos = uploaded(await listDocs(`albums/${albumId}/photos`))
      return Object.values(photos).filter((f) => fieldValue(f.status) === 'ready').length === 2
    }, 60000)
    const shrunk = photos['velka.jpg']
    check(
      'big photos: shrunk to 4000 px, upright, date taken kept',
      fieldValue(shrunk?.width) === '2800' &&
        fieldValue(shrunk?.height) === '4000' &&
        fieldValue(shrunk?.takenAt) === '2026-09-21T16:30:00Z',
      JSON.stringify(shrunk),
    )
    const bigMeta = await storageMeta(fieldValue(shrunk?.originalPath))
    const smallMeta = await storageMeta(fieldValue(photos['mala.jpg']?.originalPath))
    check(
      'big photos: stored JPEG under 7 MB, small one untouched',
      Number(bigMeta?.size) < 7 * 1024 * 1024 &&
        bigMeta.contentType === 'image/jpeg' &&
        Number(smallMeta?.size) === small.length,
      `${bigMeta?.size} / ${smallMeta?.size} (${small.length})`,
    )
  }

  // delete the album
  {
    await page.getByRole('button', { name: 'smazat celé album' }).click()
    await page.getByRole('button', { name: 'ano, smazat album' }).click()
    await page.waitForURL(/\/vedouci\/fotky$/)
    check('delete album: document gone', (await getDoc(`albums/${albumId}`)) === null)
    const files = await Promise.all(
      ['originals', 'previews', 'thumbs'].map((f) => storageFiles(`${f}/${albumId}/`)),
    )
    check(
      'delete album: files gone',
      files.every((f) => !f.length),
    )
    check('leader: no console errors', !leader.errors.length, leader.errors.join(' | '))
  }

  await parent.ctx.close()
  await leader.ctx.close()
}
