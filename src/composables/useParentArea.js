import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { campRequirements, meetingStats, tripCount } from '@shared/attendance'
import { canJoin, isOpenForSignUp, isRelevant } from '@shared/events'
import { contactCard } from '@shared/contacts'
import { getParticipant, listEvents, setSignedUp } from '@/services/events'
import { listMeetings } from '@/services/meetings'
import { listNews } from '@/services/news'
import { listAlbums } from '@/services/photos'
import { listContacts } from '@/services/contacts'
import { listLeaders } from '@/services/skautisPeople'
import { getAppSettings } from '@/services/settings'
import { TROOPS } from '@/constants/troops'

// News, newest first, with the pinned important item (if any) moved to the top.
export function pinnedFirst(list) {
  const first = list.find((n) => n.important) ?? list[0]
  return first ? [first, ...list.filter((n) => n !== first)] : []
}

// Data of the parent home (SPEC §3.1) for the given children.
// `loadChildren` resolves to their `members` docs — the signed-in parent's
// children, or (later) the child a leader previews (§4.7).
export function useParentArea(loadChildren) {
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)

  const loading = ref(true)
  const loadError = ref(false)
  const children = ref([])
  const settings = ref(campRequirements(null)) // camp requirement per troop
  const events = ref([])
  const news = ref([])
  const albums = ref([]) // published, newest first
  const meetings = ref([])
  const contacts = ref([])
  const leaders = ref({}) // skautisPeople by id
  const participants = ref({}) // { eventId: { memberId: doc | null } }

  const childTroops = computed(() => [...new Set(children.value.map((c) => c.troop))])
  // Troops whose events, news and albums are shown: the children's, or both
  // for a parent without children (e.g. the child moved on to the leaders).
  const troops = computed(() =>
    childTroops.value.length ? childTroops.value : TROOPS.map((t) => t.code),
  )

  // Access can be revoked while loading; the page is left then, so the
  // failed reads are not an error worth reporting.
  let left = false
  onUnmounted(() => (left = true))

  onMounted(async () => {
    try {
      children.value = (await loadChildren()).filter((c) => c.active)
      const [appSettings, eventList, newsList, albumList, contactList, people, ...meetingLists] =
        await Promise.all([
          getAppSettings(),
          listEvents({ fromDate: schoolYear.from }),
          listNews(),
          listAlbums({ publishedOnly: true }),
          listContacts(),
          listLeaders({ activeOnly: false }),
          ...childTroops.value.map((troop) =>
            listMeetings({ troop, fromDate: schoolYear.from, toDate: today }),
          ),
        ])
      settings.value = campRequirements(appSettings)
      events.value = eventList
      news.value = newsList
      albums.value = albumList
      contacts.value = contactList
      leaders.value = Object.fromEntries(people.map((p) => [p.id, p]))
      meetings.value = meetingLists.flat()
      participants.value = await loadParticipants(eventList)
    } catch (e) {
      if (left) return
      console.error('Loading the parent area failed', e)
      loadError.value = true
    } finally {
      loading.value = false
    }
  })

  // Sign-ups and attendance of the children, for events with registration.
  async function loadParticipants(eventList) {
    const pairs = eventList
      .filter((e) => e.registrationOpen)
      .flatMap((e) => children.value.filter((c) => canJoin(e, c)).map((c) => [e.id, c.id]))
    const docs = await Promise.all(pairs.map(([e, c]) => getParticipant(e, c)))
    const byEvent = {}
    pairs.forEach(([e, c], i) => ((byEvent[e] ??= {})[c] = docs[i]))
    return byEvent
  }

  const participantOf = (eventId, memberId) => participants.value[eventId]?.[memberId] ?? null

  // ---- derived ----

  const organizersOf = (event) =>
    (event.organizerIds ?? []).map((id) => leaders.value[id]).filter(Boolean)

  const relevantEvents = computed(() =>
    events.value.filter((e) => isRelevant(e.audience, troops.value)),
  )

  const nearestEvent = computed(() =>
    relevantEvents.value.find((e) => !e.cancelled && e.startDate >= today),
  )

  const childStats = computed(() => {
    const pastEvents = events.value.filter((e) => e.startDate <= today)
    return children.value.map((member) => ({
      member,
      percent: meetingStats(member, meetings.value).percent,
      trips: tripCount(member, pastEvents, participantOf),
    }))
  })

  const relevantNews = computed(() =>
    pinnedFirst(news.value.filter((n) => isRelevant(n.audience, troops.value))),
  )

  const relevantAlbums = computed(() =>
    albums.value.filter((a) => isRelevant(a.audience, troops.value)),
  )
  // Album of an event, for the „fotky“ link of past events.
  const albumOf = (event) => albums.value.find((a) => a.eventId === event.id) ?? null

  const signUpEvents = computed(() => relevantEvents.value.filter((e) => isOpenForSignUp(e, today)))

  // Contact cards with their leader's details, in the admin's order.
  const leaderContacts = computed(() =>
    contacts.value.map((c) => contactCard(c, leaders.value[c.personId])).filter(Boolean),
  )

  // ---- sign-up ----

  const saving = ref(new Set()) // `eventId/memberId`
  const signUpErrors = ref({}) // { eventId: message }

  // Saves at once; the state shows only once the server has it, read back with
  // the server time of the change, so the parent sees it really went through.
  async function toggleSignUp(event, member) {
    const key = `${event.id}/${member.id}`
    if (saving.value.has(key)) return
    const signedUp = !participantOf(event.id, member.id)?.signedUp
    saving.value = new Set(saving.value).add(key)
    signUpErrors.value = { ...signUpErrors.value, [event.id]: false }
    try {
      await setSignedUp(event.id, member.id, signedUp)
      const doc = await getParticipant(event.id, member.id)
      participants.value = {
        ...participants.value,
        [event.id]: { ...participants.value[event.id], [member.id]: doc },
      }
    } catch (e) {
      console.error('Saving the sign-up failed', e)
      signUpErrors.value = { ...signUpErrors.value, [event.id]: true }
    } finally {
      const next = new Set(saving.value)
      next.delete(key)
      saving.value = next
    }
  }

  return {
    today,
    loading,
    loadError,
    children,
    troops,
    settings,
    events,
    relevantNews,
    relevantAlbums,
    albumOf,
    signUpEvents,
    nearestEvent,
    childStats,
    leaderContacts,
    organizersOf,
    participantOf,
    saving,
    signUpErrors,
    toggleSignUp,
  }
}
