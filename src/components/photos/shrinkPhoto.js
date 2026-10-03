import { fitWithin, SHRUNK_EDGE, SHRUNK_QUALITY, withExifOf } from '@shared/photos'

// A big original shrunk in the browser before uploading (SPEC §4.9): long edge
// SHRUNK_EDGE, JPEG, with the original's EXIF (date taken) kept. Returns
// { name, type, data } like the upload expects, or null when the photo can't
// be decoded or wouldn't get smaller (then the original is uploaded).
// One photo at a time: a decoded 24 Mpx photo takes ~100 MB of memory.
let queue = Promise.resolve()

export function shrinkPhoto(file) {
  const result = queue.then(() => shrink(file))
  queue = result.catch(() => {})
  return result
}

async function shrink(file) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file) // turned upright by its EXIF orientation
  } catch {
    return null
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, SHRUNK_EDGE)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', SHRUNK_QUALITY))
  canvas.width = canvas.height = 0 // frees the canvas memory now (Safari keeps it otherwise)
  if (!blob || blob.size >= file.size) return null
  const original = file.type === 'image/jpeg' ? new Uint8Array(await file.arrayBuffer()) : null
  const shrunk = new Uint8Array(await blob.arrayBuffer())
  return {
    name: file.name.replace(/\.[^.]*$/, '') + '.jpg',
    type: 'image/jpeg',
    data: original ? withExifOf(original, shrunk) : shrunk,
  }
}
