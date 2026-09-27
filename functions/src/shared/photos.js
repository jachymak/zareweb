// Photo albums — SPEC §4.9 and §5 (Storage). Shared by the upload in the web
// and the processing Cloud Function. Dependency-free.

// Accepted originals and the extension they are stored with.
export const PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
export const MAX_PHOTO_BYTES = 30 * 1024 * 1024

// Long edge in px of the generated JPEGs.
export const PREVIEW_EDGE = 2048
export const THUMB_EDGE = 640

// Why a file can't be uploaded, or null: 'heic' | 'type' | 'size' | 'empty'.
// Some browsers report an empty type for HEIC, so the extension counts too.
export function photoFileProblem({ name = '', type = '', size = 0 }) {
  const ext = name.split('.').pop().toLowerCase()
  if (/^image\/hei[cf]/.test(type) || ext === 'heic' || ext === 'heif') return 'heic'
  if (!PHOTO_TYPES[type]) return 'type'
  if (size > MAX_PHOTO_BYTES) return 'size'
  if (size === 0) return 'empty'
  return null
}

export const originalPath = (albumId, photoId, type) =>
  `originals/${albumId}/${photoId}.${PHOTO_TYPES[type]}`
export const previewPath = (albumId, photoId) => `previews/${albumId}/${photoId}.jpg`
export const thumbPath = (albumId, photoId) => `thumbs/${albumId}/${photoId}.jpg`
export const PHOTO_FOLDERS = ['originals', 'previews', 'thumbs']

// `originals/{albumId}/{photoId}.{ext}` → { folder, albumId, photoId }, else null.
export function parsePhotoPath(path) {
  const match = /^(originals|previews|thumbs)\/([^/]+)\/([^/.]+)\.[a-z]+$/.exec(path ?? '')
  return match ? { folder: match[1], albumId: match[2], photoId: match[3] } : null
}

// Size of the image scaled down to fit `edge` (never enlarged).
export function fitWithin(width, height, edge) {
  const scale = Math.min(1, edge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
