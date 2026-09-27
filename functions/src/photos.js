import { randomUUID } from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { logger } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/https'
import { onObjectFinalized } from 'firebase-functions/storage'
import exifReader from 'exif-reader'
import sharp from 'sharp'
import { db } from './admin.js'
import { BASE_OPTIONS } from './options.js'

// gRPC status codes of Firestore errors.
const NOT_FOUND = 5
const ALREADY_EXISTS = 6
import {
  PHOTO_FOLDERS,
  PREVIEW_EDGE,
  THUMB_EDGE,
  parsePhotoPath,
  previewPath,
  thumbPath,
} from './shared/photos.js'

// Photo albums — SPEC §4.9. Leaders upload originals straight to Storage;
// `processPhoto` makes the preview and the thumbnail and writes the photo
// document. Deleting goes through callables, clients can't touch the files.

// Token download URL of a file — works in <img> without signing in. The photo
// documents holding them are protected by the Firestore rules.
function downloadUrl(bucket, path, token) {
  const emulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  const base = emulator ? `http://${emulator}` : 'https://firebasestorage.googleapis.com'
  return `${base}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}

const PRAGUE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Prague',
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})
// Offset of Prague from UTC at the instant, in ms.
function pragueOffset(ms) {
  const p = Object.fromEntries(PRAGUE.formatToParts(ms).map((x) => [x.type, Number(x.value)]))
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wall - Math.floor(ms / 1000) * 1000
}

// When the photo was taken: EXIF DateTimeOriginal is the camera's wall time
// (exif-reader returns it as if it were UTC); without an explicit offset it is
// taken as Prague time. Unset camera clocks (before 1990, future) → null.
function takenAt(exif) {
  let tags
  try {
    tags = exif ? exifReader(exif) : null
  } catch {
    return null
  }
  const wall = tags?.Photo?.DateTimeOriginal
  if (!(wall instanceof Date) || Number.isNaN(wall.getTime())) return null
  const offset = /^([+-])(\d\d):(\d\d)$/.exec(tags.Photo.OffsetTimeOriginal ?? '')
  let ms
  if (offset) {
    const sign = offset[1] === '-' ? -1 : 1
    ms = wall.getTime() - sign * (Number(offset[2]) * 60 + Number(offset[3])) * 60000
  } else {
    ms = wall.getTime() - pragueOffset(wall.getTime())
    ms = wall.getTime() - pragueOffset(ms) // settles around DST changes
  }
  if (ms < Date.UTC(1990, 0, 1) || ms > Date.now() + 86400000) return null
  return Timestamp.fromMillis(ms)
}

const hex = ({ r, g, b }) => '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')

// Preview, thumbnail (EXIF orientation applied, metadata incl. GPS stripped)
// and what the gallery needs to lay out the photo before it loads.
async function renderPhoto(original) {
  const image = sharp(original, { failOn: 'none' })
  const meta = await image.metadata()
  const resized = (edge, quality) =>
    image
      .clone()
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
  const [preview, thumb] = await Promise.all([resized(PREVIEW_EDGE, 82), resized(THUMB_EDGE, 75)])
  const { dominant } = await sharp(thumb).stats()
  const { width, height } = meta.autoOrient ?? meta
  return {
    preview,
    thumb,
    width,
    height,
    dominantColor: hex(dominant),
    takenAt: takenAt(meta.exif),
  }
}

async function deleteFiles(bucket, paths) {
  await Promise.all(paths.map((p) => p && bucket.file(p).delete({ ignoreNotFound: true })))
}

export const processPhoto = onObjectFinalized(
  { ...BASE_OPTIONS, memory: '1GiB', timeoutSeconds: 120 },
  async (event) => {
    const object = event.data
    const parsed = parsePhotoPath(object.name)
    // Only originals — the function's own outputs must not trigger it again.
    if (parsed?.folder !== 'originals') return
    const { albumId, photoId } = parsed
    const bucket = getStorage().bucket(object.bucket)
    const albumRef = db.doc(`albums/${albumId}`)
    const photoRef = albumRef.collection('photos').doc(photoId)

    if ((await photoRef.get()).get('status') === 'ready') return
    const album = await albumRef.get()
    if (!album.exists) {
      // The album was deleted while the photo was uploading.
      await deleteFiles(bucket, [object.name])
      return
    }

    const custom = object.metadata ?? {}
    const uploadedAt = Timestamp.fromDate(new Date(object.timeCreated))
    const base = {
      originalPath: object.name,
      originalFilename: custom.originalFilename || object.name.split('/').pop(),
      uploadedBy: custom.uploadedBy ?? null,
      uploadedAt,
      sizeBytes: Number(object.size),
    }
    const paths = { preview: previewPath(albumId, photoId), thumb: thumbPath(albumId, photoId) }

    let doc
    try {
      const [original] = await retry(() => bucket.file(object.name).download())
      const photo = await renderPhoto(original)
      const token = randomUUID()
      const save = (path, data) =>
        retry(() =>
          bucket.file(path).save(data, {
            resumable: false,
            metadata: {
              contentType: 'image/jpeg',
              cacheControl: 'private, max-age=31536000, immutable',
              metadata: { firebaseStorageDownloadTokens: token },
            },
          }),
        )
      await Promise.all([save(paths.preview, photo.preview), save(paths.thumb, photo.thumb)])
      doc = {
        ...base,
        status: 'ready',
        previewPath: paths.preview,
        thumbPath: paths.thumb,
        previewUrl: downloadUrl(object.bucket, paths.preview, token),
        thumbUrl: downloadUrl(object.bucket, paths.thumb, token),
        width: photo.width,
        height: photo.height,
        dominantColor: photo.dominantColor,
        takenAt: photo.takenAt,
        sortAt: photo.takenAt ?? uploadedAt,
        error: null,
      }
    } catch (e) {
      logger.error('Processing a photo failed', { path: object.name, error: e.message })
      // Leaders see the failed photo and can delete it and upload it again.
      await photoRef.set({
        ...base,
        status: 'error',
        error: e.message,
        sortAt: uploadedAt,
        takenAt: null,
      })
      return
    }

    // No transaction on the album: many photos of one album are processed at
    // once. create() keeps a repeated trigger from counting the photo twice.
    try {
      await photoRef.create(doc)
    } catch (e) {
      if (e.code !== ALREADY_EXISTS) throw e
      if ((await photoRef.get()).get('status') === 'ready') return
      await photoRef.set(doc) // replaces a failed attempt
    }
    try {
      await albumRef.update({ photoCount: FieldValue.increment(1) })
    } catch (e) {
      if (e.code !== NOT_FOUND) throw e
      // Deleted meanwhile.
      await photoRef.delete()
      await deleteFiles(bucket, [object.name, paths.preview, paths.thumb])
      return
    }
    if (!album.get('coverPhotoId')) await setFirstCover(albumRef, photoId, doc)
  },
)

// The first processed photo becomes the cover. Several photos may try at
// once; a failure only leaves the cover for the next photo.
async function setFirstCover(albumRef, photoId, doc) {
  try {
    await db.runTransaction(async (tx) => {
      const album = await tx.get(albumRef)
      if (!album.exists || album.get('coverPhotoId')) return
      tx.update(albumRef, {
        coverPhotoId: photoId,
        coverUrl: doc.thumbUrl,
        coverColor: doc.dominantColor,
      })
    })
  } catch (e) {
    logger.warn('Setting the album cover failed', { albumId: albumRef.id, error: e.message })
  }
}

// Storage calls sometimes fail on a dropped connection; try a few times.
async function retry(fn, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i >= attempts) throw e
      await new Promise((r) => setTimeout(r, 500 * i))
    }
  }
}

async function requireLeader(request) {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.')
  const role = (await db.doc(`users/${uid}`).get()).get('role')
  if (!['leader', 'admin'].includes(role))
    throw new HttpsError('permission-denied', 'Leaders only.')
  return uid
}

const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id)

// Deletes photos of an album (documents first, so the gallery never shows a
// missing file) and moves the cover to the first remaining photo if needed.
export const deletePhotos = onCall(BASE_OPTIONS, async (request) => {
  const uid = await requireLeader(request)
  const { albumId, photoIds } = request.data ?? {}
  if (!validId(albumId) || !Array.isArray(photoIds) || !photoIds.length || photoIds.length > 500) {
    throw new HttpsError('invalid-argument', 'Invalid photos.')
  }
  if (!photoIds.every(validId)) throw new HttpsError('invalid-argument', 'Invalid photos.')
  const albumRef = db.doc(`albums/${albumId}`)
  const photos = albumRef.collection('photos')
  const deleted = new Set(photoIds)

  const docs = await db.runTransaction(async (tx) => {
    const album = await tx.get(albumRef)
    if (!album.exists) throw new HttpsError('not-found', 'No such album.')
    const snaps = await tx.getAll(...photoIds.map((id) => photos.doc(id)))
    const existing = snaps.filter((s) => s.exists)
    const update = {
      photoCount: FieldValue.increment(-existing.filter((s) => s.get('status') === 'ready').length),
    }
    if (deleted.has(album.get('coverPhotoId'))) {
      const next = (
        await tx.get(
          photos
            .where('status', '==', 'ready')
            .orderBy('sortAt')
            .limit(photoIds.length + 1),
        )
      ).docs.find((d) => !deleted.has(d.id))
      Object.assign(update, {
        coverPhotoId: next?.id ?? null,
        coverUrl: next?.get('thumbUrl') ?? null,
        coverColor: next?.get('dominantColor') ?? null,
      })
    }
    existing.forEach((s) => tx.delete(s.ref))
    tx.update(albumRef, update)
    return existing.map((s) => s.data())
  })

  const bucket = getStorage().bucket()
  await deleteFiles(
    bucket,
    docs.flatMap((d) => [d.originalPath, d.previewPath, d.thumbPath]),
  )
  logger.info('Photos deleted', { albumId, count: docs.length, by: uid })
  return { deleted: docs.length }
})

// Deletes an album with all its photos and files.
export const deleteAlbum = onCall(BASE_OPTIONS, async (request) => {
  const uid = await requireLeader(request)
  const { albumId } = request.data ?? {}
  if (!validId(albumId)) throw new HttpsError('invalid-argument', 'Invalid album.')
  const albumRef = db.doc(`albums/${albumId}`)
  if (!(await albumRef.get()).exists) throw new HttpsError('not-found', 'No such album.')

  // Firestore first: photos still being processed then find no album and clean up.
  await db.recursiveDelete(albumRef)
  const bucket = getStorage().bucket()
  await Promise.all(PHOTO_FOLDERS.map((f) => bucket.deleteFiles({ prefix: `${f}/${albumId}/` })))
  logger.info('Album deleted', { albumId, by: uid })
  return { deleted: true }
})
