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

// Parents get e-mails about the event (registration, poster) only until it starts.
export function sendsEventEmails(event, today) {
  return !event.deleted && !event.cancelled && event.startDate >= today
}

// What saving a change that announces the event (registration, poster) does:
// 'send' | 'cancelled' | 'started' | 'sent' (already announced) | 'off' (Administration).
export function eventEmailState(event, today, { notified, enabled }) {
  if (event.cancelled) return 'cancelled'
  if (!sendsEventEmails(event, today)) return 'started'
  if (notified) return 'sent'
  return enabled ? 'send' : 'off'
}

// Listed under „Nejbližší akce“: registration started, not cancelled, not started yet.
export function isOpenForSignUp(event, today) {
  return registrationState(event, today) !== 'none' && !event.cancelled && event.startDate > today
}

// `2027-03-12` → „12. 3.“
const shortDay = (iso) => `${Number(iso.slice(8))}. ${Number(iso.slice(5, 7))}.`

// „12. 3. 2027“, „12.–14. 3. 2027“, „30. 3.–1. 4. 2027“ (e-mails).
export function formatEventDates(start, end = start) {
  const year = end.slice(0, 4)
  if (start === end) return `${shortDay(start)} ${year}`
  const from =
    start.slice(5, 7) === end.slice(5, 7) ? `${Number(start.slice(8))}.` : shortDay(start)
  return `${from}–${shortDay(end)} ${year}`
}
