import { nicknameOf } from '@shared/names'
// Czech texts and date formats of the parent area (SPEC §3.1).
// Dates are `YYYY-MM-DD` strings in Europe/Prague.

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

export const MEETING_DAYS = {
  mon: 'v pondělí',
  tue: 'v úterý',
  wed: 've středu',
  thu: 've čtvrtek',
  fri: 'v pátek',
}

const parts = (iso) => iso.split('-').map(Number)

// „sobota 26. září“
export function formatToday(iso) {
  const [y, m, d] = parts(iso)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday} ${d}. ${MONTHS_GENITIVE[m - 1]}`
}

// „17. 3.“
export function formatDay(iso) {
  const [, m, d] = parts(iso)
  return `${d}. ${m}.`
}

// „17. 3.“, „26.–28. 4.“, „28. 3.–1. 4.“
export function formatRange(start, end) {
  if (!end || start === end) return formatDay(start)
  const [, sm, sd] = parts(start)
  const [, em] = parts(end)
  return sm === em ? `${sd}.–${formatDay(end)}` : `${formatDay(start)}–${formatDay(end)}`
}

// Whole days from `today` to `iso` (negative when it is past).
export function daysUntil(iso, today) {
  const utc = (date) => {
    const [y, m, d] = parts(date)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(iso) - utc(today)) / 86_400_000)
}

// Calendar month heading: „Říjen“, with the year when it isn't this year.
export function formatMonth(yearMonth, thisYear) {
  const [y, m] = parts(yearMonth)
  const name = MONTHS[m - 1][0].toUpperCase() + MONTHS[m - 1].slice(1)
  return y === thisYear ? name : `${name} ${y}`
}

const pragueDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' })

// Firestore Timestamp → „12. 3.“
export function formatTimestamp(ts) {
  const date = ts?.toDate?.()
  return date ? formatDay(pragueDate.format(date)) : ''
}

const pragueTime = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: 'Europe/Prague',
  hour: 'numeric',
  minute: '2-digit',
})

// Firestore Timestamp → „dnes v 14:05“, „12. 3. v 9:30“
export function formatTimestampTime(ts, today) {
  const date = ts?.toDate?.()
  if (!date) return ''
  const day = pragueDate.format(date)
  return `${day === today ? 'dnes' : formatDay(day)} v ${pragueTime.format(date)}`
}

export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)

// Time left to sign up: „ještě 5 dní“, „zítra poslední den“, „dnes poslední den“;
// '' after the deadline.
export function daysLeftText(deadline, today) {
  const days = daysUntil(deadline, today)
  if (days < 0) return ''
  if (days === 0) return 'dnes poslední den'
  if (days === 1) return 'zítra poslední den'
  return `ještě ${days} ${plural(days, 'den', 'dny', 'dní')}`
}

// „na tábor je potřeba 4 výpravy a 60 % schůzek“ — only the required parts;
// '' when the troop requires nothing. `req` = campRequirements(…)[troop].
export function campRequirementText({ trips, meetingPct }) {
  const parts = []
  if (trips !== null) parts.push(`${trips} ${plural(trips, 'výprava', 'výpravy', 'výprav')}`)
  if (meetingPct !== null) parts.push(`${meetingPct} % schůzek`)
  return parts.length ? `na tábor je potřeba ${parts.join(' a ')}` : ''
}

// Nickname of a leader, or of each organizer joined by commas.
export const organizerNames = (organizers) => organizers.map(nicknameOf).join(', ')

// Shown when a parent clicks a child after the sign-up deadline (SPEC §3.1).
export function lateSignUpText(nickname, organizer) {
  const reach = [organizer?.phone, organizer?.email].filter(Boolean).join(', ')
  const whom = organizer
    ? `organizátorovi akce — ${nicknameOf(organizer)}${reach ? ` (${reach})` : ''}`
    : 'organizátorovi akce'
  return (
    `Přihlašování už skončilo, takže tady ${nickname} přihlásit ani odhlásit nejde. ` +
    `Napište prosím ${whom}. Pokud to ještě půjde, změnu zařídí.`
  )
}

export const SAVE_ERROR = 'Nepodařilo se to uložit. Zkuste to prosím znovu.'
export const LOAD_ERROR = 'Stránku se nepodařilo načíst. Zkuste ji prosím obnovit.'

// Leaders' preview (SPEC §4.7): clicking a sign-up toggle saves nothing.
export const previewSignUpText = (nickname, signedUp) =>
  `Tohle je jen náhled, tady se nic neuloží. Rodič tímhle tlačítkem ${nickname} rovnou ` +
  `${signedUp ? 'odhlásí' : 'přihlásí'} — a vy to pak uvidíte v přihláškách akce.`

export const previewExcuseText = (nickname, excused) =>
  `Tohle je jen náhled, tady se nic neuloží. Rodič tímhle tlačítkem ${nickname} ` +
  `${excused ? 'omluvenku z dnešní schůzky zruší' : 'omluví z dnešní schůzky'} — a vy to pak uvidíte v docházce.`
