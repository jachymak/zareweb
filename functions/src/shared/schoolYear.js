// School and recruitment years — SPEC §6.1.
// All dates are evaluated in the Europe/Prague time zone.

const pragueDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Prague',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// Today in Prague as `YYYY-MM-DD`.
export function pragueToday(now = new Date()) {
  return pragueDate.format(now)
}

function yearMonth(isoDate) {
  const [year, month] = isoDate.split('-').map(Number)
  return { year, month }
}

// Start year of the school year containing the date (September starts a new one).
export function schoolYearStart(isoDate) {
  const { year, month } = yearMonth(isoDate)
  return month >= 9 ? year : year - 1
}

// `2026` → `2026/27`
export function formatSchoolYear(startYear) {
  return `${startYear}/${String(startYear + 1).slice(-2)}`
}

// doneYear: school year whose newcomers are already chosen (from the last waitlist reset).
// nextYear: school year new sign-ups are considered for.
export function recruitmentYears(lastWaitlistReset, today = pragueToday()) {
  const reset = yearMonth(lastWaitlistReset)
  const doneYear = reset.month >= 7 ? reset.year : reset.year - 1
  const nextYear = Math.max(doneYear + 1, schoolYearStart(today) + 1)
  return { doneYear, nextYear }
}

// School year that waitlist grades refer to: the next recruitment year,
// or the upcoming school year when no reset has happened yet.
export function gradeSchoolYear(lastWaitlistReset, today = pragueToday()) {
  if (lastWaitlistReset) return recruitmentYears(lastWaitlistReset, today).nextYear
  return schoolYearStart(today) + 1
}
