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

export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)

// „na tábor je potřeba 4 výpravy a 60 % schůzek“
export function campRequirementText({ campMinTrips, campMinMeetingPct }) {
  const trips = plural(campMinTrips, 'výprava', 'výpravy', 'výprav')
  return `na tábor je potřeba ${campMinTrips} ${trips} a ${campMinMeetingPct} % schůzek`
}

// Nickname of a leader, or of each organizer joined by commas.
export const organizerNames = (organizers) => organizers.map((o) => o.nickname).join(', ')

// Shown when a parent clicks a child after the sign-up deadline (SPEC §3.1).
export function lateSignUpText(nickname, organizer) {
  const reach = [organizer?.phone, organizer?.email].filter(Boolean).join(', ')
  const whom = organizer
    ? `organizátorovi akce — ${organizer.nickname}${reach ? ` (${reach})` : ''}`
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
