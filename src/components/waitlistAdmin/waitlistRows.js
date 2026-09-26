// Leaders' waiting list (SPEC §4.6): table rows derived from `waitlist`
// entries, stats, filters, sorting and the CSV export. Pure functions; dates
// are `YYYY-MM-DD` strings in Prague time.
import { pragueToday } from '@shared/schoolYear'
import { ageOn, formatPhone, gradeInYear } from '@shared/waitlistRules'

const months = (age) => age.years * 12 + age.months

// Firestore entries → rows (with the grade in the school year `schoolYear`).
export function toRows(entries, { today, schoolYear, lastReset }) {
  return entries.map((e) => {
    const signedUp = pragueToday(e.firstSignedUpAt.toDate())
    const age = ageOn(e.birthDate, today) ?? { years: 0, months: 0 }
    const waited = ageOn(signedUp, today) ?? { years: 0, months: 0 }
    return {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      gender: e.gender,
      birthDate: e.birthDate,
      age,
      ageMonths: months(age),
      signedUp,
      waited,
      waitedMonths: months(waited),
      isNew: !lastReset || signedUp > lastReset,
      grade: gradeInYear(e, schoolYear),
      renewals: e.renewalDates?.length ?? 0,
      knowsWhom: e.knowsSomeone ? e.knowsWhom : '',
      parentName: e.parentName,
      email: e.email,
      phone: formatPhone(e.phone ?? ''),
      note: e.leaderNote?.trim() ?? '',
    }
  })
}

// Stats row above the table; null values when the list is empty.
export function waitlistStats(rows) {
  const count = (gender) => rows.filter((r) => r.gender === gender).length
  const youngest = rows.reduce((a, b) => (!a || b.ageMonths < a.ageMonths ? b : a), null)
  const longest = rows.reduce((a, b) => (!a || b.signedUp < a.signedUp ? b : a), null)
  return {
    total: rows.length,
    fresh: rows.filter((r) => r.isNew).length,
    girls: count('girl'),
    boys: count('boy'),
    other: count('other'),
    averageAge: rows.length ? rows.reduce((s, r) => s + r.ageMonths, 0) / rows.length / 12 : null,
    youngest,
    longest,
  }
}

export const EMPTY_FILTERS = { gender: '', age: '', grade: '', noteOnly: false }

// Age buckets of the filter: value → [from, to] in completed years.
export const AGE_BUCKETS = { '0-6': [0, 6], '7-9': [7, 9], '10-11': [10, 11], '12+': [12, 99] }

export function hasFilters(filters) {
  return Object.entries(EMPTY_FILTERS).some(([k, v]) => filters[k] !== v)
}

export function filterRows(rows, filters) {
  const [from, to] = AGE_BUCKETS[filters.age] ?? [0, 99]
  return rows.filter(
    (r) =>
      (!filters.gender || r.gender === filters.gender) &&
      r.age.years >= from &&
      r.age.years <= to &&
      (filters.grade === '' || r.grade === Number(filters.grade)) &&
      (!filters.noteOnly || r.note),
  )
}

const SORT_KEYS = {
  signedUp: (r) => r.signedUp,
  age: (r) => r.ageMonths,
  grade: (r) => r.grade,
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

// sort: { key: 'signedUp' | 'age' | 'grade', dir: 1 | -1 }; ties by sign-up date.
export function sortRows(rows, { key, dir }) {
  const value = SORT_KEYS[key]
  return [...rows].sort(
    (a, b) => compare(value(a), value(b)) * dir || compare(a.signedUp, b.signedUp),
  )
}

// A repeated click on the active column reverses it; another column starts ascending.
export const nextSort = (sort, key) => ({ key, dir: sort.key === key ? -sort.dir : 1 })

// Lower-case without diacritics, for searching names.
export const searchable = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

// CSV of the rows: `;` separated, UTF-8 with BOM (Excel), CRLF lines.
// columns: [[header, row → value], …]
export function toCsv(rows, columns) {
  const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const lines = [
    columns.map(([header]) => cell(header)).join(';'),
    ...rows.map((r) => columns.map(([, value]) => cell(value(r))).join(';')),
  ]
  return '﻿' + lines.join('\r\n')
}
