import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { originalPath } from '@shared/photos'
import { auth, db, functions, getDoc, getDocs, storage } from './firebase'
import { fromDoc, fromQuery } from './utils'

// Photo albums — SPEC §4.9. Photo documents are written by the `processPhoto`
// Cloud Function after an original is uploaded; deleting goes through callables.

const albums = collection(db, 'albums')
const photos = (albumId) => collection(db, 'albums', albumId, 'photos')

// ---- albums ----

// Newest first. Parents may read published albums only.
export async function listAlbums({ publishedOnly = false } = {}) {
  const filters = publishedOnly ? [where('published', '==', true)] : []
  return fromQuery(await getDocs(query(albums, ...filters, orderBy('startDate', 'desc'))))
}

// All albums, newest first, followed live (leaders' photos page).
export function subscribeAlbums(callback, onError) {
  return onSnapshot(
    query(albums, orderBy('startDate', 'desc')),
    (snap) => callback(fromQuery(snap)),
    onError,
  )
}

export async function getAlbum(albumId) {
  return fromDoc(await getDoc(doc(albums, albumId)))
}

export function subscribeAlbum(albumId, callback, onError) {
  return onSnapshot(doc(albums, albumId), (snap) => callback(fromDoc(snap)), onError)
}

// A new album starts hidden from parents.
export async function createAlbum({ title, audience, eventId, startDate, endDate, groupByDay }) {
  const ref = await addDoc(albums, {
    title,
    audience,
    eventId: eventId ?? null,
    startDate,
    endDate,
    groupByDay,
    published: false,
    photoCount: 0,
    coverPhotoId: null,
    coverUrl: null,
    coverColor: null,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export function updateAlbum(albumId, fields) {
  return updateDoc(doc(albums, albumId), fields)
}

export function setAlbumCover(albumId, photo) {
  return updateAlbum(albumId, {
    coverPhotoId: photo.id,
    coverUrl: photo.thumbUrl,
    coverColor: photo.dominantColor,
  })
}

// Deletes the album with all photos and files.
export async function deleteAlbum(albumId) {
  await httpsCallable(functions, 'deleteAlbum')({ albumId })
}

// ---- photos ----

// In the order they were taken. Parents get only the processed ones.
export async function listPhotos(albumId, { readyOnly = false } = {}) {
  const filters = readyOnly ? [where('status', '==', 'ready')] : []
  return fromQuery(await getDocs(query(photos(albumId), ...filters, orderBy('sortAt'))))
}

// All photos incl. failed ones, followed live (leaders see uploads appear).
export function subscribePhotos(albumId, callback, onError) {
  return onSnapshot(
    query(photos(albumId), orderBy('sortAt')),
    (snap) => callback(fromQuery(snap)),
    onError,
  )
}

export async function deletePhotos(albumId, photoIds) {
  await httpsCallable(functions, 'deletePhotos')({ albumId, photoIds })
}

// A fresh photo id (the document itself is created by the Cloud Function).
export const newPhotoId = (albumId) => doc(photos(albumId)).id

// `attachment` makes the original download instead of opening; filename* keeps diacritics.
function attachment(filename) {
  const ascii = filename
    .normalize('NFD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/["\\]/g, '_')
  return `attachment; filename="${ascii || 'foto'}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

// Uploads an original: `data` is its content read into memory (Uint8Array),
// `name` and `type` its file name and type; `onProgress(bytesTransferred)`.
// Returns { done, cancel }.
export function uploadPhoto(albumId, photoId, { name, type, data }, onProgress) {
  const task = uploadBytesResumable(
    storageRef(storage, originalPath(albumId, photoId, type)),
    data,
    {
      contentType: type,
      contentDisposition: attachment(name),
      customMetadata: {
        albumId,
        uploadedBy: auth.currentUser.uid,
        originalFilename: name,
      },
    },
  )
  const done = new Promise((resolve, reject) => {
    task.on('state_changed', (s) => onProgress?.(s.bytesTransferred), reject, resolve)
  })
  return { done, cancel: () => task.cancel() }
}

// Download URL of the original (checked by the Storage rules).
export function originalUrl(photo) {
  return getDownloadURL(storageRef(storage, photo.originalPath))
}
