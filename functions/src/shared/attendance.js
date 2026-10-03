// Attendance and the camp requirement — SPEC §6.3.
// Callers pass only meetings and events of the current school year.
import { meetingDates, noMeetingOn } from './meetingDays.js'

// Meeting attendance of a child: recorded (not cancelled) meetings of their
// troop on their meeting day. `percent` is null when none was recorded yet.
export function meetingStats(member, meetings) {
  const recorded = meetings.filter(
    (m) => m.troop === member.troop && m.weekday === member.meetingDay && !m.cancelled,
  )
  const present = recorded.filter((m) => m.presentIds?.includes(member.id)).length
  const percent = recorded.length ? Math.round((present * 100) / recorded.length) : null
  return { present, recorded: recorded.length, percent }
}

// A dot per meeting date of the child's day between two dates, oldest first:
// 'present' | 'absent' | 'cancelled' | 'unrecorded'. Dates without meetings
// (Administration) are left out unless a meeting was recorded on them anyway.
// [] when the child has no meeting day of the troop.
export function meetingDots(member, meetings, schedule, fromDate, toDate) {
  const { troop, meetingDay } = member
  if (!schedule[troop]?.days.includes(meetingDay)) return []
  const byDate = new Map(meetings.filter((m) => m.troop === troop).map((m) => [m.date, m]))
  const skip = (date) => !!noMeetingOn(schedule, troop, date) && !byDate.has(date)
  return meetingDates(meetingDay, fromDate, toDate, skip).map((date) => {
    const meeting = byDate.get(date)
    const state = !meeting
      ? 'unrecorded'
      : meeting.cancelled
        ? 'cancelled'
        : meeting.presentIds?.includes(member.id)
          ? 'present'
          : 'absent'
    return { date, state }
  })
}

// Events whose attendance counts as a trip: registration enabled, not the camp.
export function isTrip(event) {
  return event.registrationOpen === true && event.posterStatus !== 'none' && !event.cancelled
}

// Trips the child attended; participantOf(eventId, memberId) → participant doc or null.
export function tripCount(member, events, participantOf) {
  return events.filter((e) => isTrip(e) && participantOf(e.id, member.id)?.attended === true).length
}

// Camp requirement per troop (settings/app.campRequirements): minimum trips and
// meeting %, each null when the troop doesn't require it.
export const DEFAULT_CAMP_REQUIREMENTS = {
  vlc: { trips: 4, meetingPct: 60 },
  ss: { trips: 4, meetingPct: 60 },
}

// settings/app (possibly missing or partial) → { vlc: { trips, meetingPct }, ss: … }.
export function campRequirements(appSettings) {
  const stored = appSettings?.campRequirements
  const troop = (code) => {
    const t = { ...DEFAULT_CAMP_REQUIREMENTS[code], ...stored?.[code] }
    return { trips: t.trips ?? null, meetingPct: t.meetingPct ?? null }
  }
  return { vlc: troop('vlc'), ss: troop('ss') }
}

// Each part holds when it isn't required.
export const tripsOk = ({ trips }, req) => req.trips === null || trips >= req.trips
export const meetingsOk = ({ percent }, req) =>
  req.meetingPct === null || (percent ?? 0) >= req.meetingPct

// req = the child's troop requirement (campRequirements(…)[troop]).
export const meetsCampRequirement = (row, req) => tripsOk(row, req) && meetingsOk(row, req)
