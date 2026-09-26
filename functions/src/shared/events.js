// Relevance of events and news, event registration — SPEC §6.4, §6.5.
// Dates are `YYYY-MM-DD` strings in Europe/Prague.

// Audience `all` or one of the given troops.
export function isRelevant(audience, troops) {
  return audience === 'all' || troops.includes(audience)
}

// Whether the child may be signed up for the event.
export function canJoin(event, member) {
  return event.audience === 'all' || event.audience === member.troop
}

// 'none' (registration not started) | 'open' (parents can sign up) | 'ended' (after the deadline).
export function registrationState(event, today) {
  if (!event.registrationOpen || !event.registrationDeadline) return 'none'
  return today <= event.registrationDeadline ? 'open' : 'ended'
}

// Listed under „Nejbližší akce“: registration started, not cancelled, not started yet.
export function isOpenForSignUp(event, today) {
  return registrationState(event, today) !== 'none' && !event.cancelled && event.startDate > today
}
