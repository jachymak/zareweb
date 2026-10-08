// Links and Czech texts of the leader area (SPEC §4).

// Tools on the leader home in groups, each in a frame of its colour (`tone`);
// the Administrace group only for admins.
// `disabled` shows a tool greyed out and not clickable.
export const TOOL_GROUPS = [
  {
    title: 'schůzky',
    tone: 'green',
    tools: [
      { to: '/vedouci/schuzky', label: 'Schůzky' },
      { to: '/vedouci/dochazka', label: 'Přehled docházky' },
    ],
  },
  {
    title: 'výpravy',
    tone: 'gold',
    tools: [
      { to: '/vedouci/vypravy', label: 'Výpravy' },
      { to: '/vedouci/na-srazu', label: 'Na srazu' },
      { to: '/vedouci/vypravnik', label: 'Výpravník' },
    ],
  },
  {
    title: 'pro rodiče',
    tone: 'teal',
    tools: [
      { to: '/vedouci/aktuality', label: 'Aktuality' },
      { to: '/vedouci/fotky', label: 'Fotky' },
    ],
  },
  {
    title: 'oddíl',
    tone: 'sand',
    tools: [
      { to: '/vedouci/kontakty', label: 'Kontakty' },
      { to: '/vedouci/klubovna', label: 'Klubovna', disabled: true },
      { to: '/vedouci/cekaci-listina', label: 'Čekací listina' },
    ],
  },
  {
    title: 'správa',
    tone: 'red',
    adminOnly: true,
    tools: [{ to: '/vedouci/administrace', label: 'Administrace' }],
  },
]

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

// Pages opened on a meeting or a trip (query understood by §4.2 / §4.3).
export const meetingLink = (troop, date) => ({
  path: '/vedouci/schuzky',
  query: { oddil: troop, schuzka: date },
})
export const tripLink = (troop, eventId) => ({
  path: '/vedouci/vypravy',
  query: { ...(troop && { oddil: troop }), vyprava: eventId },
})
export const gatherLink = (troop, eventId) => ({
  path: '/vedouci/na-srazu',
  query: { oddil: troop, vyprava: eventId },
})
export const plannerLink = (eventId) => ({ path: '/vedouci/vypravnik', query: { akce: eventId } })

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
