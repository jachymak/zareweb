// Waiting-list sign-up rules — SPEC §2.2, §6.2.
// Shared by the web form and the `submitWaitlist` Cloud Function, so both
// validate identically. Pure functions only; dates are `YYYY-MM-DD` strings.

export const GENDERS = ['girl', 'boy', 'other']
export const GRADE_NONE = 0 // not in school yet
export const GRADE_SECONDARY = 10
export const MAX_AGE_ABSOLUTE = 25 // older = certainly a typo
export const DEFAULT_WARN_AGE = 12
export const DEFAULT_MAX_AGE = 15

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const pad = (n, len = 2) => String(n).padStart(len, '0')

// DD / MM / YYYY field values → `YYYY-MM-DD`, or null when not a real date.
export function parseBirthDate(dd, mm, yyyy) {
  if (!/^\d{1,2}$/.test(dd) || !/^\d{1,2}$/.test(mm) || !/^\d{4}$/.test(yyyy)) return null
  const [d, m, y] = [Number(dd), Number(mm), Number(yyyy)]
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null
  }
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`
}

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-')
  return parseBirthDate(d, m, y) === value
}

// Completed years and months between two ISO dates; null if birth is after today.
export function ageOn(birthDate, today) {
  if (birthDate > today) return null
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  let months = (ty - by) * 12 + (tm - bm)
  if (td < bd) months--
  return { years: Math.floor(months / 12), months: months % 12 }
}

// §6.2 — grade in the school year starting in `schoolYearStart`, clamped to 0–10.
export function suggestGrade(birthDate, schoolYearStart) {
  const [year, month] = birthDate.split('-').map(Number)
  const grade = schoolYearStart - (year + (month >= 9 ? 1 : 0)) - 5
  return Math.min(GRADE_SECONDARY, Math.max(GRADE_NONE, grade))
}

// Formats phone input as it is typed: `123 456 789` or `+420 123 456 789`.
export function formatPhone(input) {
  const plus = input.trim().startsWith('+')
  const digits = input.replace(/\D/g, '')
  const code = plus ? digits.slice(0, 3) : ''
  const rest = (plus ? digits.slice(3) : digits).slice(0, 9)
  const groups = (rest.match(/.{1,3}/g) ?? []).join(' ')
  return plus ? `+${code}${rest ? ' ' + groups : ''}` : groups
}

// Normalised phone (`+420123456789`), or null when invalid:
// 9 digits (Czech number), or `+` country code and 9 digits.
export function normalizePhone(input) {
  if (typeof input !== 'string') return null
  const digits = input.replace(/\D/g, '')
  if (input.trim().startsWith('+')) return digits.length === 12 ? `+${digits}` : null
  return digits.length === 9 ? `+420${digits}` : null
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean)

/**
 * Validates a sign-up. Returns an object of failed checks (empty = valid).
 * `tooOld` means the child is past the age limit — not a typo, but no sign-up.
 *
 * entry: { firstName, lastName, gender, birthDate, grade, parentName, email,
 *          phone, knowsSomeone, knowsWhom }
 */
export function validateWaitlistEntry(entry, { today, maxAge = DEFAULT_MAX_AGE }) {
  const errors = {}
  const str = (v) => (typeof v === 'string' ? v : '')

  if (!str(entry.firstName).trim()) errors.firstName = true
  if (!str(entry.lastName).trim()) errors.lastName = true
  if (!GENDERS.includes(entry.gender)) errors.gender = true

  const age = isIsoDate(entry.birthDate) ? ageOn(entry.birthDate, today) : null
  if (!age || age.years > MAX_AGE_ABSOLUTE) errors.birthDate = true
  else if (age.years >= maxAge) errors.tooOld = true

  if (!Number.isInteger(entry.grade) || entry.grade < GRADE_NONE || entry.grade > GRADE_SECONDARY) {
    errors.grade = true
  }
  if (words(str(entry.parentName)).length < 2) errors.parentName = true
  if (!EMAIL_RE.test(str(entry.email).trim())) errors.email = true
  if (!normalizePhone(entry.phone)) errors.phone = true
  if (typeof entry.knowsSomeone !== 'boolean') errors.knowsSomeone = true
  else if (entry.knowsSomeone && !str(entry.knowsWhom).trim()) errors.knowsWhom = true

  return errors
}

// Identity of a child on the list: name + date of birth, ignoring case,
// diacritics and extra spaces.
export function dedupeKey({ firstName, lastName, birthDate }) {
  const norm = (s) =>
    words(
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase(),
    ).join(' ')
  return `${norm(firstName)}|${norm(lastName)}|${birthDate}`
}

// Grade in the school year starting in `schoolYearStart`, moved on from the
// grade the parent gave for `entry.gradeSchoolYear`. A child not in school yet
// gets the suggestion from the date of birth.
export function gradeInYear({ grade, gradeSchoolYear, birthDate }, schoolYearStart) {
  const years = schoolYearStart - gradeSchoolYear
  if (years <= 0) return grade
  if (grade === GRADE_NONE) return suggestGrade(birthDate, schoolYearStart)
  return Math.min(GRADE_SECONDARY, grade + years)
}
