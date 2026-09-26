// Attendance and the camp requirement — SPEC §6.3.
// Callers pass only meetings and events of the current school year.

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
