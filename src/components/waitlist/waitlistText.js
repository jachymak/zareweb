// Czech texts shared by the waiting-list sign-up and renewal forms.
import { MAX_AGE_ABSOLUTE } from '@shared/waitlistRules'

export const FIELD_MESSAGES = {
  firstName: 'Doplňte jméno.',
  lastName: 'Doplňte příjmení.',
  gender: 'Vyberte jednu z možností.',
  birthDate: 'Zadejte platné datum narození ve tvaru DD. MM. RRRR.',
  grade: 'Vyberte třídu.',
  parentName: 'Doplňte jméno i příjmení rodiče.',
  email: 'Zadejte platný e-mail.',
  phone: 'Zadejte telefon — 9 číslic, případně s předvolbou.',
  knowsSomeone: 'Vyberte ano, nebo ne.',
  knowsWhom: 'Napište, koho znáte.',
}

export const GENDER_LABELS = { girl: 'dívka', boy: 'chlapec', other: 'jiné' }

export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)

// { years, months } → „je jí 8 let a 6 měsíců“
export function formatAge(age, gender) {
  if (!age || age.years > MAX_AGE_ABSOLUTE) return ''
  const lead = { girl: 'je jí', boy: 'je mu' }[gender] ?? 'věk:'
  const parts = []
  if (age.years) parts.push(`${age.years} ${plural(age.years, 'rok', 'roky', 'let')}`)
  if (age.months || !age.years) {
    parts.push(`${age.months} ${plural(age.months, 'měsíc', 'měsíce', 'měsíců')}`)
  }
  return `${lead} ${parts.join(' a ')}`
}

export function ageWarningText(warnAge, gender) {
  const whom = { girl: 'ji', boy: 'ho' }[gender] ?? 'dítě'
  return `Děti od ${warnAge} let standardně už nenabíráme, ale zapíšeme ${whom} i tak — občas se stane, že potřebujeme oddíl doplnit.`
}

// `2018-03-14` → `14. 3. 2018`
export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}

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

// ISO timestamp → „od března 2024“ (Prague time zone)
export function sinceMonth(isoTimestamp) {
  const [year, month] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date(isoTimestamp))
    .split('-')
    .map(Number)
  return `od ${MONTHS_GENITIVE[month - 1]} ${year}`
}
