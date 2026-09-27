// Czech texts and date formats of the photo albums (SPEC §3.3, §4.9).
import { schoolYearStart } from '@shared/schoolYear'
import { MAX_PHOTO_BYTES } from '@shared/photos'
import { formatRange, plural } from '@/components/parent/parentText'

const MONTHS = [
  'leden',
  'únor',
  'březen',
  'duben',
  'květen',
  'červen',
  'červenec',
  'srpen',
  'září',
  'říjen',
  'listopad',
  'prosinec',
]
const MONTHS_GENITIVE = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
]
const WEEKDAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']

export const photoCount = (n) => `${n} ${plural(n, 'fotka', 'fotky', 'fotek')}`

// „14.–16. 3. 2026“
export function albumDates(album) {
  return `${formatRange(album.startDate, album.endDate)} ${album.startDate.slice(0, 4)}`
}

// Card detail as in the design: „březen · 31 fotek“ (with the year when it isn't this one).
export function albumDetail(album, thisYear) {
  const [y, m] = album.startDate.split('-').map(Number)
  const month = y === thisYear ? MONTHS[m - 1] : `${MONTHS[m - 1]} ${y}`
  return `${month} · ${photoCount(album.photoCount ?? 0)}`
}

// Albums grouped by school year, newest first: [{ year: 2025, label: '2025/26', albums }].
export function bySchoolYear(albums) {
  const groups = []
  for (const album of albums) {
    const year = schoolYearStart(album.startDate)
    if (groups.at(-1)?.year !== year) {
      groups.push({ year, label: `${year}/${String(year + 1).slice(-2)}`, albums: [] })
    }
    groups.at(-1).albums.push(album)
  }
  return groups
}

const pragueParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Prague',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
function prague(ts) {
  const date = ts?.toDate?.()
  if (!date) return null
  const p = Object.fromEntries(pragueParts.formatToParts(date).map((x) => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${Number(p.hour)}:${p.minute}` }
}

// Day (`YYYY-MM-DD`, Prague) the photo was taken, or null when unknown.
export const takenDay = (photo) => (photo.takenAt ? prague(photo.takenAt).day : null)

// „sobota 14. března“ (+ year when it isn't `thisYear`)
export function formatLongDay(iso, thisYear) {
  const [y, m, d] = iso.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday} ${d}. ${MONTHS_GENITIVE[m - 1]}${y === thisYear ? '' : ` ${y}`}`
}

// Lightbox caption: „sobota 14. března 2026 · 10:42“, or '' when unknown.
export function takenText(photo) {
  const t = prague(photo.takenAt)
  return t ? `${formatLongDay(t.day, null)} · ${t.time}` : ''
}

// Why a file was not uploaded (photoFileProblem).
export const FILE_PROBLEMS = {
  heic: 'Fotky ve formátu HEIC (iPhone) nejsou podporované. Exportujte je prosím jako JPEG.',
  type: 'Tohle není fotka ve formátu JPEG, PNG ani WebP.',
  size: `Soubor je větší než ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`,
  empty: 'Soubor je prázdný.',
}

export const DELETE_ERROR = 'Smazání se nepovedlo. Zkus to prosím znovu.'

// Display order (SPEC §3.3): by the time taken, photos without a date last;
// ties and undated photos by file name, numbers compared as numbers
// („IMG_9“ before „IMG_10“), so naming files 01, 02, … sets their order.
const byName = new Intl.Collator('cs', { numeric: true, sensitivity: 'base' })
const takenMs = (p) => p.takenAt?.toMillis?.() ?? Infinity
export function sortPhotos(photos) {
  return [...photos].sort(
    (a, b) =>
      takenMs(a) - takenMs(b) ||
      byName.compare(a.originalFilename ?? '', b.originalFilename ?? '') ||
      a.id.localeCompare(b.id),
  )
}

// Photos in display order, grouped by the day they were taken as Google Photos
// does: [{ key, label, photos }], photos without a date last. One group without
// a label for one-day albums, albums without dates, or when the leader turned
// grouping off (`groupByDay: false`; missing = on).
export function photoGroups(photos, album) {
  const sorted = sortPhotos(photos)
  const byDay =
    album.groupByDay !== false && album.startDate !== album.endDate && sorted.some((p) => p.takenAt)
  if (!byDay) return [{ key: 'all', label: '', photos: sorted }]
  const groups = new Map()
  for (const photo of sorted) {
    const day = takenDay(photo) ?? 'unknown'
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push(photo)
  }
  const thisYear = Number(album.startDate.slice(0, 4))
  return [...groups].map(([key, list]) => ({
    key,
    label: key === 'unknown' ? 'bez data pořízení' : formatLongDay(key, thisYear),
    photos: list,
  }))
}
