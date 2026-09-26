// Czech texts of the attendance page (SPEC §4.2).

export const WEEKDAY_NAMES = { mon: 'pondělí', tue: 'úterý', wed: 'středa', thu: 'čtvrtek' }

export const TABS = [
  { value: 'meetings', label: 'schůzky' },
  { value: 'trips', label: 'výpravy' },
  { value: 'overview', label: 'přehled dětí' },
]

// Tooltip of a dot in the overview.
export const DOT_STATES = {
  present: 'na schůzce',
  absent: 'chyběl(a)',
  cancelled: 'schůzka nebyla',
  unrecorded: 'nezapsáno',
}

// „1 050 Kč“
export const formatCzk = (amount) => `${amount.toLocaleString('cs-CZ')} Kč`
