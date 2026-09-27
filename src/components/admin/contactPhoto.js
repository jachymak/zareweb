import { photoFileProblem } from '@shared/photos'
import { CONTACT_PHOTO } from '@shared/contacts'

// Contact photo picked in Administration → a 3:4 JPEG cut from the middle of
// the image (portrait card on the parents' page), or the reason it can't be used.
const PROBLEMS = {
  heic: 'Fotky ve formátu HEIC (iPhone) nejsou podporované. Exportuj ji prosím jako JPEG.',
  type: 'Tohle není fotka — nahraj JPEG, PNG nebo WebP.',
  size: 'Fotka je moc velká (víc než 30 MB).',
  empty: 'Soubor je prázdný.',
  decode: 'Fotku se nepodařilo otevřít. Zkus ji uložit jako JPEG.',
}

export async function contactPhotoBlob(file) {
  const problem = photoFileProblem(file)
  if (problem) return { error: PROBLEMS[problem] }
  let bitmap
  try {
    bitmap = await createImageBitmap(file) // turned upright by its EXIF orientation
  } catch {
    return { error: PROBLEMS.decode }
  }
  const { width, height } = CONTACT_PHOTO
  const scale = Math.max(width / bitmap.width, height / bitmap.height)
  const w = width / scale
  const h = height / scale
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas
    .getContext('2d')
    .drawImage(bitmap, (bitmap.width - w) / 2, (bitmap.height - h) / 2, w, h, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  return blob ? { blob } : { error: PROBLEMS.decode }
}
