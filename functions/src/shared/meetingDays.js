// Meeting days of the troops and what a leader's troop has on a given day — SPEC §1, §4.1.
// Dates are `YYYY-MM-DD` strings in Europe/Prague.

import { isTrip } from './attendance.js'

// Hardcoded until the meeting settings in Administration exist (SPEC §4.8 Meetings).
export const TROOP_MEETING_DAYS = { vlc: ['mon', 'thu'], ss: ['tue', 'wed'] }

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// `2026-09-24` → `thu`
export function weekdayOf(isoDate) {
  return WEEKDAYS[new Date(`${isoDate}T12:00:00Z`).getUTCDay()]
}

// Dates (`YYYY-MM-DD`) of the weekday between two dates (inclusive), oldest first.
export function meetingDates(weekday, fromDate, toDate) {
  const dates = []
  const d = new Date(`${fromDate}T12:00:00Z`)
  while (weekdayOf(d.toISOString().slice(0, 10)) !== weekday) d.setUTCDate(d.getUTCDate() + 1)
  for (let iso = d.toISOString().slice(0, 10); iso <= toDate;) {
    dates.push(iso)
    d.setUTCDate(d.getUTCDate() + 7)
    iso = d.toISOString().slice(0, 10)
  }
  return dates
}

// The troop's programme on the day, in the order of SPEC §4.1:
// { kind: 'meeting' } | { kind: 'trip', event } | { kind: 'otherTroop' } | { kind: 'free' }.
// A trip is an event with registration (not the camp) for the troop or everyone, starting that day.
export function troopDay(troop, date, events) {
  const weekday = weekdayOf(date)
  if (TROOP_MEETING_DAYS[troop].includes(weekday)) return { kind: 'meeting' }
  const trip = events.find(
    (e) =>
      e.startDate === date &&
      isTrip(e) &&
      !e.deleted &&
      (e.audience === 'all' || e.audience === troop),
  )
  if (trip) return { kind: 'trip', event: trip }
  const otherMeets = Object.entries(TROOP_MEETING_DAYS).some(
    ([code, days]) => code !== troop && days.includes(weekday),
  )
  return { kind: otherMeets ? 'otherTroop' : 'free' }
}
