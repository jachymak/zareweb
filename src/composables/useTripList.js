import { computed } from 'vue'

// Children of a trip as both trip views show them (SPEC §4.2): only those on the
// list — signed up, or came / paid anyway (signed-up first) — the others are
// added through a picker. `a` is reactive(useAttendance()), `trip` a ref.
export function useTripList(a, trip) {
  const children = computed(() => (trip.value ? a.tripChildren(trip.value) : []))
  const participant = (m) => a.participantOf(trip.value.id, m.id)
  const onList = (m) => {
    const p = participant(m)
    return !!p && (p.signedUp || p.attended === true || p.paid)
  }
  const listed = computed(() =>
    children.value
      .filter(onList)
      .sort((x, y) => Number(!participant(x).signedUp) - Number(!participant(y).signedUp)),
  )
  const others = computed(() => children.value.filter((m) => !onList(m)))
  const summary = computed(() => a.tripSummary(trip.value))
  // Trips of both troops list the children of both, with their troop tag.
  const showTroop = computed(() => trip.value?.audience === 'all')

  const update = (m, fields) => a.setTripFields(trip.value, m.id, fields)
  return { participant, listed, others, summary, showTroop, update }
}
