// Seeds photo albums (SPEC §4.9): replaces `albums` (incl. photos) and all
// files under originals/, previews/ and thumbs/ in the Storage emulator, then
// uploads generated sample photos (landscapes of various aspect ratios, EXIF
// dates, one rotated by EXIF orientation) and waits until the `processPhoto`
// function has processed them. Albums hang on the events of `seed-activity.js`
// (dated relative to today) plus last year's camp and a hidden album.
// Run after `seed-activity.js`. Usage: npm run seed:photos. Writes bypass security rules.

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { pragueToday } from '../functions/src/shared/schoolYear.js'
import { originalPath } from '../functions/src/shared/photos.js'

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET ?? `${PROJECT}.appspot.com`
process.env.GCLOUD_PROJECT ??= PROJECT // no credentials lookup against GCP
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199'

// firebase-admin and sharp are dependencies of the functions.
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const load = async (name) => import(pathToFileURL(require.resolve(name)).href)
let sharp, db, bucket, Timestamp

const today = pragueToday()
function day(offset) {
  const [y, m, d] = today.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10)
}
const lastYear = Number(today.slice(0, 4)) - (today.slice(5) >= '09' ? 0 : 1)

// Aspect ratios cycle through these (width × height).
const SHAPES = [
  [1800, 1200],
  [1200, 1800],
  [1600, 1200],
  [1800, 1013],
  [1400, 1400],
  [1800, 1200],
  [1200, 1600],
  [2400, 1000],
]
const PALETTES = [
  ['#8fb8d8', '#d9e8ef', '#4f7a4a', '#2f5a33', '#f2c14e'],
  ['#f0a868', '#f7d9b5', '#7a6b4a', '#4b3d28', '#fff1c1'],
  ['#6d8fb3', '#c8d6e5', '#3d6b57', '#23443a', '#f7f3e3'],
  ['#b9d3c2', '#eef4ea', '#a08a5c', '#6b5a36', '#e5a83c'],
  ['#35506e', '#8aa4c1', '#2b4b3a', '#152a20', '#f4e3a1'],
]

export const ALBUMS = [
  {
    id: 'seed-album-zahajovaci',
    eventId: 'seed-zahajovaci',
    title: 'Zahajovací výprava',
    audience: 'all',
    startDate: day(-12),
    endDate: day(-11),
    published: true,
    count: 16,
    days: 2,
  },
  {
    id: 'seed-album-brdy',
    eventId: 'seed-brdy',
    title: 'Výprava do Brd',
    audience: 'ss',
    startDate: day(-8),
    endDate: day(-7),
    published: true,
    count: 12,
    days: 2,
  },
  {
    id: 'seed-album-sarka',
    eventId: 'seed-sarka',
    title: 'Hry v Šárce',
    audience: 'vlc',
    startDate: day(-5),
    endDate: day(-5),
    published: true,
    count: 9,
    days: 1,
  },
  {
    id: 'seed-album-odpoledne',
    eventId: 'seed-odpoledne',
    title: 'Zahajovací odpoledne v klubovně',
    audience: 'all',
    startDate: day(-20),
    endDate: day(-20),
    published: true,
    count: 5,
    days: 0, // no EXIF dates
  },
  {
    id: 'seed-album-tabor',
    eventId: null,
    title: 'Letní tábor',
    audience: 'all',
    startDate: `${lastYear}-07-11`,
    endDate: `${lastYear}-07-25`,
    published: true,
    count: 14,
    days: 4,
  },
  {
    id: 'seed-album-schuzky',
    eventId: null,
    title: 'Schůzky v klubovně',
    audience: 'vlc',
    startDate: day(-3),
    endDate: day(-3),
    published: false,
    count: 4,
    days: 1,
  },
]

// A simple landscape: sky gradient, sun, two hills, a tent and a label.
function landscape(width, height, palette, label) {
  const [sky, haze, hill, hillDark, sun] = palette
  const h = height
  const w = width
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${haze}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <circle cx="${w * 0.72}" cy="${h * 0.28}" r="${Math.min(w, h) * 0.09}" fill="${sun}"/>
    <path d="M0 ${h * 0.62} C ${w * 0.25} ${h * 0.48}, ${w * 0.45} ${h * 0.58}, ${w * 0.6} ${h * 0.55} S ${w * 0.9} ${h * 0.5}, ${w} ${h * 0.58} V ${h} H 0 Z" fill="${hill}"/>
    <path d="M0 ${h * 0.78} C ${w * 0.3} ${h * 0.7}, ${w * 0.55} ${h * 0.82}, ${w} ${h * 0.72} V ${h} H 0 Z" fill="${hillDark}"/>
    <path d="M${w * 0.3} ${h * 0.8} L ${w * 0.36} ${h * 0.68} L ${w * 0.42} ${h * 0.8} Z" fill="${sun}" opacity=".85"/>
    <text x="${w * 0.05}" y="${h * 0.12}" font-family="sans-serif" font-size="${Math.min(w, h) * 0.06}" fill="#ffffff" opacity=".9">${label}</text>
  </svg>`)
}

const pad = (n) => String(n).padStart(2, '0')

async function samplePhoto(album, index) {
  // The third photo of the first album is stored sideways with EXIF
  // orientation 6, as phones do; processed, it is an upright portrait.
  const sideways = album.id === 'seed-album-zahajovaci' && index === 2
  const [w, h] = SHAPES[index % SHAPES.length]
  const [width, height] = sideways ? [h, w] : [w, h]
  const palette = PALETTES[(index + album.title.length) % PALETTES.length]
  let image = sharp(landscape(width, height, palette, `${album.title} · ${index + 1}`))
  if (sideways) image = image.rotate(270).withMetadata({ orientation: 6 })
  image = image.jpeg({ quality: 85 })
  const exif = { IFD0: { Make: 'Záře', Model: 'Ukázkový foťák' } }
  if (album.days) {
    // Spread over the album's days, from 9:00 in 25-minute steps.
    const dayIndex = Math.floor((index * album.days) / album.count)
    const [y, m, d] = album.startDate.split('-').map(Number)
    const date = new Date(
      Date.UTC(y, m - 1, d + dayIndex * Math.max(1, Math.floor(3 / album.days))),
    )
    const minutes = 9 * 60 + (index % Math.ceil(album.count / album.days)) * 25
    exif.IFD2 = {
      DateTimeOriginal: `${date.getUTCFullYear()}:${pad(date.getUTCMonth() + 1)}:${pad(date.getUTCDate())} ${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`,
    }
  }
  return image.withExif(exif).toBuffer()
}

async function leaderUid() {
  const snap = await db.collection('users').where('email', '==', 'vedouci@zare.test').limit(1).get()
  return snap.docs[0]?.id ?? 'seed'
}

async function main() {
  const { initializeApp } = await load('firebase-admin/app')
  const firestore = await load('firebase-admin/firestore')
  const { getStorage } = await load('firebase-admin/storage')
  sharp = (await load('sharp')).default
  initializeApp({ projectId: PROJECT, storageBucket: BUCKET })
  db = firestore.getFirestore()
  Timestamp = firestore.Timestamp
  bucket = getStorage().bucket()

  await db.recursiveDelete(db.collection('albums'))
  await Promise.all(
    ['originals', 'previews', 'thumbs'].map((prefix) =>
      bucket.deleteFiles({ prefix: `${prefix}/` }),
    ),
  )
  const uid = await leaderUid()

  for (const { count, days, ...album } of ALBUMS) {
    const { id, ...fields } = album
    await db.doc(`albums/${id}`).set({
      ...fields,
      groupByDay: true,
      photoCount: 0,
      coverPhotoId: null,
      coverUrl: null,
      coverColor: null,
      createdBy: uid,
      createdAt: Timestamp.now(),
    })
    for (let i = 0; i < count; i++) {
      const photoId = db.collection('albums').doc().id
      const filename = `IMG_${4100 + i}.jpg`
      await bucket
        .file(originalPath(id, photoId, 'image/jpeg'))
        .save(await samplePhoto({ ...album, count, days }, i), {
          resumable: false,
          metadata: {
            contentType: 'image/jpeg',
            contentDisposition: `attachment; filename="${filename}"`,
            metadata: { albumId: id, uploadedBy: uid, originalFilename: filename },
          },
        })
    }
  }

  // processPhoto runs in the Functions emulator; wait for it.
  const expected = ALBUMS.reduce((sum, a) => sum + a.count, 0)
  const end = Date.now() + 180000
  let done = 0
  while (Date.now() < end) {
    done = (await db.collectionGroup('photos').where('status', '==', 'ready').count().get()).data()
      .count
    if (done >= expected) break
    await new Promise((r) => setTimeout(r, 1000))
  }
  if (done < expected) {
    console.error(
      `Only ${done} of ${expected} photos processed — is the Functions emulator running?`,
    )
    process.exit(1)
  }
  console.log(`${ALBUMS.length} albums, ${expected} photos`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
