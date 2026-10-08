import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { canJoin, isOpenForSignUp } from '@shared/events'
import { meetingTimeShort, troopDay } from '@shared/meetingDays'
import { listEvents, listParticipants } from '@/services/events'
import { subscribeExcuses } from '@/services/excuses'
import { listMembers } from '@/services/members'
import { listNews } from '@/services/news'
import { listAlbums } from '@/services/photos'
import { listLeaders } from '@/services/skautisPeople'
import { pinnedFirst } from '@/composables/useParentArea'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'
import { nicknameOf } from '@shared/names'

// Data of the leader home (SPEC §4.1). The today card follows the troop picked
// on the page (shared with attendance); news, the calendar and photos are of
// both troops, as the parents get them.
export function useLeaderHome() {
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)
  const leaderTroop = useLeaderTroopStore()
  const scheduleStore = useMeetingScheduleStore()
  const troop = computed({
    get: () => leaderTroop.troop,
    set: (value) => (leaderTroop.troop = value),
  })

  const loading = ref(true)
  const loadError = ref(false)
  const members = ref([])
  const events = ref([])
  const news = ref([])
  const albums = ref([]) // published, newest first
  const leaders = ref({}) // skautisPeople by id
  const participants = ref({}) // { eventId: { memberId: doc } }
  const excuses = ref({ vlc: [], ss: [] }) // today's, followed live

  let left = false
  const unsubscribes = []
  onUnmounted(() => {
    left = true
    unsubscribes.forEach((u) => u())
  })

  onMounted(async () => {
    try {
      const [, , memberList, eventList, newsList, albumList, people] = await Promise.all([
        leaderTroop.init(),
        scheduleStore.load(),
        listMembers(),
        listEvents({ fromDate: schoolYear.from }),
        listNews(),
        listAlbums({ publishedOnly: true }),
        listLeaders({ activeOnly: false }),
      ])
      members.value = memberList
      events.value = eventList
      news.value = newsList
      albums.value = albumList
      leaders.value = Object.fromEntries(people.map((p) => [p.id, p]))
      participants.value = await loadParticipants(eventList)
      for (const code of ['vlc', 'ss']) {
        unsubscribes.push(
          subscribeExcuses(
            { troop: code, fromDate: today, toDate: today },
            (list) => (excuses.value = { ...excuses.value, [code]: list }),
            (e) => console.error('Following excuses failed', e),
          ),
        )
      }
    } catch (e) {
      if (left) return
      console.error('Loading the leader home failed', e)
      loadError.value = true
    } finally {
      loading.value = false
    }
  })

  // Sign-ups of every event with registration.
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

  const todayPlan = computed(() =>
    troopDay(troop.value, today, events.value, scheduleStore.schedule),
  )
  // Children of the troop excused from today's meeting: [{ nickname, reason }].
  const todayExcuses = computed(() =>
    excuses.value[troop.value]
      .map((e) => ({ member: members.value.find((m) => m.id === e.memberId), reason: e.reason }))
      .filter((e) => e.member)
      .map(({ member, reason }) => ({ nickname: nicknameOf(member), reason }))
      .sort((a, b) => a.nickname.localeCompare(b.nickname, 'cs')),
  )
  const meetingTime = computed(() => meetingTimeShort(scheduleStore.schedule[troop.value]))

  // Upcoming events with registration: signed up / eligible children, and who.
  const upcomingEvents = computed(() =>
    events.value
      .filter((e) => isOpenForSignUp(e, today))
      .map((event) => {
        const eligible = members.value.filter((m) => canJoin(event, m))
        const signedUp = eligible
          .filter((m) => participantOf(event.id, m.id)?.signedUp)
          .sort((a, b) => nicknameOf(a).localeCompare(nicknameOf(b), 'cs'))
        return {
          event,
          organizers: organizersOf(event),
          signedUp: signedUp.length,
          signedUpNames: signedUp.map(nicknameOf),
          eligible: eligible.length,
        }
      }),
  )

  // Album of an event, for the „fotky“ link of past events in the calendar.
  const albumOf = (event) => albums.value.find((a) => a.eventId === event.id) ?? null

  return {
    today,
    loading,
    loadError,
    person: computed(() => leaderTroop.person),
    troop,
    todayPlan,
    todayExcuses,
    meetingTime,
    upcomingEvents,
    events,
    news: computed(() => pinnedFirst(news.value)),
    albums: computed(() => albums.value.slice(0, 4)),
    albumOf,
    organizersOf,
    participantOf,
  }
}
