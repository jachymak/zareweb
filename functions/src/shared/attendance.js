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

export function meetsCampRequirement({ percent, trips }, { campMinTrips, campMinMeetingPct }) {
  return trips >= campMinTrips && (percent ?? 0) >= campMinMeetingPct
}
