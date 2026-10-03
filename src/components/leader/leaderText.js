// Links and Czech texts of the leader area (SPEC §4).

// Tools on the leader home; Administrace is added for admins. `disabled` shows
// a tool greyed out and not clickable.
export const TOOLS = [
  { to: '/vedouci/dochazka', label: 'Docházka' },
  { to: '/vedouci/akce', label: 'Akce a plakátky' },
  { to: '/vedouci/aktuality', label: 'Aktuality' },
  { to: '/vedouci/fotky', label: 'Fotky' },
  { to: '/vedouci/klubovna', label: 'Klubovna', disabled: true },
  { to: '/vedouci/cekaci-listina', label: 'Čekací listina' },
]
export const ADMIN_TOOL = { to: '/vedouci/administrace', label: 'Administrace' }

// Tooltip of a meeting dot in the troop attendance.
export const DOT_STATES = {
  present: 'na schůzce',
  absent: 'chyběl(a)',
  excused: 'omluveno',
  cancelled: 'schůzka nebyla',
  unrecorded: 'nezapsáno',
}

// Who wrote an excuse.
export const EXCUSED_BY = { parent: 'rodiče', leader: 'vedoucí' }

// „omluveno (rodiče: nemoc)“
export const excuseText = ({ by, reason }) =>
  `omluveno (${EXCUSED_BY[by] ?? by}${reason ? `: ${reason}` : ''})`

// Attendance page opened on a meeting or a trip (query understood by §4.2).
export const meetingLink = (troop, date) => ({
  path: '/vedouci/dochazka',
  query: { oddil: troop, schuzka: date },
})
export const tripLink = (troop, eventId) => ({
  path: '/vedouci/dochazka',
  query: { oddil: troop, vyprava: eventId },
})
export const eventEditorLink = (eventId) => ({ path: '/vedouci/akce', query: { akce: eventId } })

const WEEKDAY_SHORT = {
  sun: 'ne',
  mon: 'po',
  tue: 'út',
  wed: 'st',
  thu: 'čt',
  fri: 'pá',
  sat: 'so',
}

// „čt 19. 3.“
export function formatShortDay(iso, weekday) {
  const [, m, d] = iso.split('-').map(Number)
  return `${WEEKDAY_SHORT[weekday]} ${d}. ${m}.`
}
