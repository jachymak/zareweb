// Photo albums — SPEC §4.9 and §5 (Storage). Shared by the upload in the web
// and the processing Cloud Function. Dependency-free.

// Accepted originals and the extension they are stored with.
export const PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
export const MAX_PHOTO_BYTES = 30 * 1024 * 1024

// Originals bigger than this are offered to be shrunk in the browser before
// uploading (long edge SHRUNK_EDGE, JPEG) — still enough to print an A4 photo.
export const SHRINK_ABOVE_BYTES = 7 * 1024 * 1024
export const SHRUNK_EDGE = 4000
export const SHRUNK_QUALITY = 0.9

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

// The EXIF block (APP1) of a JPEG, or null. The parts are bytes (Uint8Array).
function exifSegment(jpeg) {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return null
  let i = 2
  while (i + 4 <= jpeg.length && jpeg[i] === 0xff) {
    const marker = jpeg[i + 1]
    if (marker === 0xda) return null // image data starts, no more metadata
    const end = i + 2 + ((jpeg[i + 2] << 8) | jpeg[i + 3])
    const isExif =
      marker === 0xe1 && String.fromCharCode(...jpeg.subarray(i + 4, i + 10)) === 'Exif\0\0'
    if (isExif) return jpeg.slice(i, end)
    i = end
  }
  return null
}

// Sets the EXIF orientation of an APP1 segment to 1 (upright), in place.
function resetOrientation(segment) {
  const tiff = 10 // marker, length, "Exif\0\0"
  const view = new DataView(segment.buffer, segment.byteOffset, segment.byteLength)
  const little = view.getUint16(tiff) === 0x4949
  const ifd = tiff + view.getUint32(tiff + 4, little)
  const count = view.getUint16(ifd, little)
  for (let k = 0; k < count; k++) {
    const entry = ifd + 2 + k * 12
    if (view.getUint16(entry, little) === 0x0112) view.setUint16(entry + 8, 1, little)
  }
}

// A JPEG re-encoded in the browser (no metadata) with the EXIF of the
// original (date taken, camera) put back; the pixels are already upright, so
// the orientation is reset. Returns `target` unchanged when there's no EXIF.
export function withExifOf(original, target) {
  const segment = exifSegment(original)
  if (!segment || target[0] !== 0xff || target[1] !== 0xd8) return target
  try {
    resetOrientation(segment)
  } catch {
    return target // malformed EXIF, leave it out
  }
  // EXIF goes right after the start marker, replacing the encoder's JFIF header.
  let rest = 2
  if (target[2] === 0xff && target[3] === 0xe0) rest = 4 + ((target[4] << 8) | target[5])
  const out = new Uint8Array(2 + segment.length + target.length - rest)
  out.set(target.subarray(0, 2))
  out.set(segment, 2)
  out.set(target.subarray(rest), 2 + segment.length)
  return out
}
