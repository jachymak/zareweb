// Czech texts of the attendance page (SPEC §4.2).

export { WEEKDAY_NAMES } from '@/constants/troops'

export const TABS = [
  { value: 'meetings', label: 'schůzky' },
  { value: 'trips', label: 'výpravy' },
]

// Modes of a trip sheet: at home / at the meeting point.
export const TRIP_MODES = [
  { value: 'overview', label: 'přehled' },
  { value: 'gather', label: 'na srazu' },
]

// „1 050 Kč“
export const formatCzk = (amount) => `${amount.toLocaleString('cs-CZ')} Kč`
