// Czech texts and formatting of the leaders' waiting list (SPEC §4.6).
import { GRADE_NONE, GRADE_SECONDARY } from '@shared/waitlistRules'
import { formatDate, GENDER_LABELS, plural } from '@/components/waitlist/waitlistText'

export { formatDate, GENDER_LABELS }

// Dot colours and chip labels by gender.
export const GENDER_DOTS = { girl: '#D7765A', boy: '#5E8FAE', other: '#C9A84A' }
export const GENDER_CHIPS = [
  { value: '', label: 'všichni', dot: '#A08A5C' },
  { value: 'girl', label: 'holky', dot: GENDER_DOTS.girl },
  { value: 'boy', label: 'kluci', dot: GENDER_DOTS.boy },
  { value: 'other', label: 'jiné', dot: GENDER_DOTS.other },
]
export const AGE_OPTIONS = [
  { value: '', label: 'všechny' },
  { value: '0-6', label: 'do 6 let' },
  { value: '7-9', label: '7–9 let' },
  { value: '10-11', label: '10–11 let' },
  { value: '12+', label: '12 a víc' },
]
export const GRADE_OPTIONS = [
  { value: '', label: 'všechny' },
  { value: '0', label: 'nechodí do školy' },
  ...Array.from({ length: 9 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}.` })),
  { value: '10', label: 'střední' },
]

// { years, months } → „8 let 6 měs.“, „4 měs.“
export function formatYearsMonths({ years, months }) {
  const parts = []
  if (years) parts.push(`${years} ${plural(years, 'rok', 'roky', 'let')}`)
  if (months || !years) parts.push(`${months} měs.`)
  return parts.join(' ')
}

// `2024-03-11` → „3/2024“
export function formatMonthYear(iso) {
  const [y, m] = iso.split('-').map(Number)
  return `${m}/${y}`
}

// 5 → „5.“, 0 → „✕“, 10 → „SŠ“
export const gradeShort = (grade) =>
  grade === GRADE_NONE ? '✕' : grade === GRADE_SECONDARY ? 'SŠ' : `${grade}.`

export const gradeLong = (grade) =>
  grade === GRADE_NONE
    ? 'nechodí do školy'
    : grade === GRADE_SECONDARY
      ? 'střední škola'
      : `${grade}. třída`

export const renewalTip = (n) =>
  `Zájem obnoven ${n}× — při každoroční aktualizaci listiny rodiče potvrdili, že chtějí zůstat zapsaní.`

// Average age → „8,4“
export const formatAverage = (years) => years.toFixed(1).replace('.', ',')

export const freshText = (fresh) =>
  `z toho ${fresh} ${plural(fresh, 'nové', 'nové', 'nových')} od poslední obnovy`

export const EMPTY_LIST = 'Listina je teď prázdná — děti se vrátí, až rodiče potvrdí zájem.'
export const NO_MATCH = 'Filtrům neodpovídá žádné dítě.'
export const NOTE_PLACEHOLDER = 'např. známí Kuby — do výběru nováčků nezařazovat'
export const SAVE_FAILED = 'Nepodařilo se uložit, zkuste to prosím znovu.'
export const DELETE_FAILED = 'Nepodařilo se smazat, zkuste to prosím znovu.'

export const CSV_COLUMNS = [
  ['Zapsáno', (r) => formatDate(r.signedUp)],
  ['Jméno dítěte', (r) => r.name],
  ['Pohlaví', (r) => GENDER_LABELS[r.gender]],
  ['Datum narození', (r) => formatDate(r.birthDate)],
  ['Věk', (r) => r.age.years],
  [
    'Třída',
    (r) =>
      r.grade === GRADE_NONE ? 'nechodí do školy' : r.grade === GRADE_SECONDARY ? 'SŠ' : r.grade,
  ],
  ['Zná někoho', (r) => r.knowsWhom],
  ['Rodič', (r) => r.parentName],
  ['E-mail', (r) => r.email],
  ['Telefon', (r) => r.phone],
  ['Obnoveno', (r) => r.renewals],
  ['Poznámka', (r) => r.note],
]

// Banner after a reset.
export const resetDoneText = ({ date, emailedCount }) =>
  `Listina resetována ${formatDate(date)} · e-mail s odkazem odešel ${emailedCount} ${plural(emailedCount, 'rodiči', 'rodičům', 'rodičům')}. Děti se vracejí na svá původní místa, jak rodiče potvrzují zájem.`

export const RESET_STEPS = ['Jak to funguje', 'Nabrané děti', 'E-mail rodičům']

export const emailsLabel = (n) => `${n} ${plural(n, 'e-mail', 'e-maily', 'e-mailů')}`
