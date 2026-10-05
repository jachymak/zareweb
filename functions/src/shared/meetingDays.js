// Meeting schedule of the troops and what a leader's troop has on a given day — SPEC §1, §4.1, §4.8.
// Dates are `YYYY-MM-DD` strings in Europe/Prague.

import { isTrip } from './attendance.js'

// Weekdays a troop can meet on, in week order.
export const MEETING_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri']

// Used until (or unless) `settings/meetings` is saved in Administration.
export const DEFAULT_MEETING_SCHEDULE = {
  vlc: { days: ['mon', 'thu'], start: '17:00', end: '19:00' },
  ss: { days: ['tue', 'wed'], start: '17:00', end: '19:00' },
  noMeetings: [], // [{ from, to, troop: 'vlc' | 'ss' | 'all', reason }]
}

// Stored `settings/meetings` (possibly missing or partial) → a complete schedule.
export function meetingSchedule(stored) {
  const troop = (code) => {
    const t = { ...DEFAULT_MEETING_SCHEDULE[code], ...stored?.[code] }
    return { days: sortWeekdays(t.days), start: t.start, end: t.end }
  }
  return {
    vlc: troop('vlc'),
    ss: troop('ss'),
    noMeetings: (stored?.noMeetings ?? [])
      .map(({ from, to, troop, reason }) => ({ from, to, troop, reason: reason ?? '' }))
      .sort((a, b) => a.from.localeCompare(b.from)),
  }
}

export const sortWeekdays = (days) =>
  [...days].sort((a, b) => MEETING_WEEKDAYS.indexOf(a) - MEETING_WEEKDAYS.indexOf(b))

// `17:00` → `17`, `17:30` → `17.30` (as in „17–19 h“).
const shortTime = (time) =>
  time.endsWith(':00') ? String(Number(time.slice(0, 2))) : time.replace(':', '.').replace(/^0/, '')

// „17–19 h“
export const meetingTimeShort = ({ start, end }) => `${shortTime(start)}–${shortTime(end)} h`

// „17:00–19:00“
export const meetingTimeLong = ({ start, end }) => `${start}–${end}`

// The no-meeting range covering the troop's date (troop or both), or null.
export const noMeetingOn = (schedule, troop, date) =>
  schedule.noMeetings.find(
    (r) => (r.troop === 'all' || r.troop === troop) && r.from <= date && date <= r.to,
  ) ?? null

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// `2026-09-24` → `thu`
export function weekdayOf(isoDate) {
  return WEEKDAYS[new Date(`${isoDate}T12:00:00Z`).getUTCDay()]
}

// Dates (`YYYY-MM-DD`) of the weekday between two dates (inclusive), oldest first.
// `skip(date)` leaves dates out (e.g. those without meetings).
export function meetingDates(weekday, fromDate, toDate, skip = () => false) {
  const dates = []
  const d = new Date(`${fromDate}T12:00:00Z`)
  while (weekdayOf(d.toISOString().slice(0, 10)) !== weekday) d.setUTCDate(d.getUTCDate() + 1)
  for (let iso = d.toISOString().slice(0, 10); iso <= toDate;) {
    if (!skip(iso)) dates.push(iso)
    d.setUTCDate(d.getUTCDate() + 7)
    iso = d.toISOString().slice(0, 10)
  }
  return dates
}

// Whether the troop meets on the date: one of its days and not in a no-meeting range.
export const meetsOn = (schedule, troop, date) =>
  schedule[troop].days.includes(weekdayOf(date)) && !noMeetingOn(schedule, troop, date)

// The troop's programme on the day, in the order of SPEC §4.1:
// { kind: 'meeting' } | { kind: 'trip', event } | { kind: 'noMeeting', reason } |
// { kind: 'otherTroop' } | { kind: 'free' }.
// A trip is an event with registration (not the camp) for the troop or everyone, starting that day.
// `noMeeting` = a meeting day of the troop that falls into a no-meeting range.
export function troopDay(troop, date, events, schedule = DEFAULT_MEETING_SCHEDULE) {
  if (meetsOn(schedule, troop, date)) return { kind: 'meeting' }
  const trip = events.find(
    (e) =>
      e.startDate === date &&
      isTrip(e) &&
      !e.deleted &&
      (e.audience === 'all' || e.audience === troop),
  )
  if (trip) return { kind: 'trip', event: trip }
  const range = noMeetingOn(schedule, troop, date)
  if (range && schedule[troop].days.includes(weekdayOf(date))) {
    return { kind: 'noMeeting', reason: range.reason ?? '' }
  }
  const otherMeets = ['vlc', 'ss'].some((code) => code !== troop && meetsOn(schedule, code, date))
  return { kind: otherMeets ? 'otherTroop' : 'free' }
}

// Stored `settings/recorders` (possibly missing) → { vlc: { weekday: [personId] }, ss: … }:
// the leaders (`skautisPeople` ids) who record attendance on each meeting day of the troop
// (SPEC §4.8 Meetings); they get the reminder when it isn't recorded in time.
export const meetingRecorders = (stored) => ({
  vlc: { ...stored?.vlc },
  ss: { ...stored?.ss },
})

// The reminder about unrecorded attendance is sent this long after the meeting ends.
export const REMINDER_DELAY_MINUTES = 60

// `19:00` + 60 → `20:00`; null past midnight (no reminder that day).
export function timeAfter(time, minutes) {
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + minutes
  if (total >= 24 * 60) return null
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
