import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { isTrip, meetingStats, tripCount } from '@shared/attendance'
import { canJoin, isOpenForSignUp } from '@shared/events'
import { troopDay } from '@shared/meetingDays'
import { listEvents, listParticipants } from '@/services/events'
import { listMeetings } from '@/services/meetings'
import { listMembers } from '@/services/members'
import { listLeaders } from '@/services/skautisPeople'
import { getAppSettings } from '@/services/settings'
import { useLeaderTroopStore } from '@/stores/leaderTroop'

// Data of the leader home (SPEC §4.1). The troop-dependent parts (today card,
// attendance summary) follow the troop picked in the leader header.
export function useLeaderHome() {
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)
  const leaderTroop = useLeaderTroopStore()
  const troop = computed(() => leaderTroop.troop)

  const loading = ref(true)
  const loadError = ref(false)
  const members = ref([])
  const settings = ref({ campMinTrips: 4, campMinMeetingPct: 60 })
  const events = ref([])
  const meetings = ref([])
  const leaders = ref({}) // skautisPeople by id
  const participants = ref({}) // { eventId: { memberId: doc } }

  let left = false
  onUnmounted(() => (left = true))

  onMounted(async () => {
    try {
      const [, memberList, appSettings, eventList, people, ...meetingLists] = await Promise.all([
        leaderTroop.init(),
        listMembers(),
        getAppSettings(),
        listEvents({ fromDate: schoolYear.from }),
        listLeaders({ activeOnly: false }),
        ...['vlc', 'ss'].map((t) =>
          listMeetings({ troop: t, fromDate: schoolYear.from, toDate: today }),
        ),
      ])
      members.value = memberList
      if (appSettings) settings.value = appSettings
      events.value = eventList
      leaders.value = Object.fromEntries(people.map((p) => [p.id, p]))
      meetings.value = meetingLists.flat()
      participants.value = await loadParticipants(eventList)
    } catch (e) {
      if (left) return
      console.error('Loading the leader home failed', e)
      loadError.value = true
    } finally {
      loading.value = false
    }
  })

  // Sign-ups and attendance of every event with registration.
  async function loadParticipants(eventList) {
    const withRegistration = eventList.filter((e) => e.registrationOpen)
    const lists = await Promise.all(withRegistration.map((e) => listParticipants(e.id)))
    return Object.fromEntries(
      withRegistration.map((e, i) => [e.id, Object.fromEntries(lists[i].map((p) => [p.id, p]))]),
    )
  }

  const participantOf = (eventId, memberId) => participants.value[eventId]?.[memberId] ?? null
  const organizersOf = (event) =>
    (event.organizerIds ?? []).map((id) => leaders.value[id]).filter(Boolean)

  // ---- derived ----

  const todayPlan = computed(() => troopDay(troop.value, today, events.value))

  // Upcoming events with registration: signed up / eligible children.
  const upcomingEvents = computed(() =>
    events.value
      .filter((e) => isOpenForSignUp(e, today))
      .map((event) => {
        const eligible = members.value.filter((m) => canJoin(event, m))
        const signedUp = eligible.filter((m) => participantOf(event.id, m.id)?.signedUp).length
        return { event, organizers: organizersOf(event), signedUp, eligible: eligible.length }
      }),
  )

  // Children of the chosen troop with their meeting % and trips, by nickname.
  const troopStats = computed(() => {
    const pastTrips = events.value.filter((e) => e.startDate <= today && isTrip(e))
    return members.value
      .filter((m) => m.troop === troop.value)
      .map((member) => ({
        member,
        percent: meetingStats(member, meetings.value).percent,
        trips: tripCount(member, pastTrips, participantOf),
      }))
      .sort((a, b) =>
        (a.member.nickname || a.member.firstName).localeCompare(
          b.member.nickname || b.member.firstName,
          'cs',
        ),
      )
  })

  return {
    today,
    loading,
    loadError,
    person: computed(() => leaderTroop.person),
    troop,
    settings,
    todayPlan,
    upcomingEvents,
    troopStats,
  }
}
