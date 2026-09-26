// Czech texts of the events & posters page (SPEC §4.3).

import { registrationState } from '@shared/events'
import { formatDay } from '@/components/parent/parentText'

export const POSTER_STATUS = {
  published: 'plakátek zveřejněný',
  draft: 'plakátek rozepsaný',
  missing: 'plakátek chybí',
  none: 'bez plakátku',
}

// Registration chip; null for the camp (no registration on the web).
export function registrationLabel(event, today) {
  if (event.posterStatus === 'none') return null
  const state = registrationState(event, today)
  if (state === 'none') return 'přihlašování nespuštěné'
  if (state === 'open') return `přihlašování do ${formatDay(event.registrationDeadline)}`
  return 'přihlašování skončilo'
}

export const AUDIENCE_OPTIONS = [
  { value: 'vlc', label: 'vlčušky' },
  { value: 'ss', label: 'skauti a skautky' },
  { value: 'all', label: 'všichni' },
]

export const MONTHS = [
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

export const WEEKDAY_HEADERS = ['po', 'út', 'st', 'čt', 'pá', 'so', 'ne']

export const UNSAVED_CONFIRM = 'Plakátek má neuložené změny. Opravdu odejít bez uložení?'
