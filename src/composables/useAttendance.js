import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { campRequirements, isTrip, meetingDots, meetingStats, tripCount } from '@shared/attendance'
import { canJoin } from '@shared/events'
import { meetingDates, meetingTimeShort, noMeetingOn, weekdayOf } from '@shared/meetingDays'
import {
  setAttendance,
  setSignedUp,
  subscribeEvents,
  subscribeParticipants,
} from '@/services/events'
import {
  clearMeeting,
  meetingId,
  setCancelled,
  setPresence,
  setPresent,
  subscribeMeetings,
} from '@/services/meetings'
import { cancelExcuse, excuse, subscribeExcuses } from '@/services/excuses'
import { listMembers } from '@/services/members'
import { getAppSettings } from '@/services/settings'
import { getPerson } from '@/services/skautisPeople'
import { getUser } from '@/services/users'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'
import { nicknameOf } from '@shared/names'

const byNickname = (a, b) => nicknameOf(a).localeCompare(nicknameOf(b), 'cs')

// Data and autosaving writes of the meetings, attendance overview, trips and
// meeting-point pages (SPEC §4.2) for the troop chosen on the page. Events,
// meetings and trip sign-ups are followed live, so leaders recording at the
// same time see each other's changes.
export function useAttendance() {
  const leaderTroop = useLeaderTroopStore()
  const scheduleStore = useMeetingScheduleStore()
  const troop = computed({
    get: () => leaderTroop.troop,
    set: (value) => (leaderTroop.troop = value),
  })
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)

  const loading = ref(true)
  const loadError = ref(false)
  const saveError = ref(false)
  const members = ref([])
  const events = ref([])
  const meetingsByTroop = ref({ vlc: [], ss: [] })
  const excusesByTroop = ref({ vlc: [], ss: [] })
  const participants = ref({}) // { eventId: { memberId: doc } }
  const settings = ref(campRequirements(null)) // camp requirement per troop

  const unsubscribes = []
  const participantUnsubscribes = new Map() // eventId → unsubscribe
  let left = false
  onUnmounted(() => {
    left = true
    unsubscribes.forEach((u) => u())
    participantUnsubscribes.forEach((u) => u())
  })

  function failed(e) {
    if (left) return
    console.error('Loading attendance failed', e)
    loadError.value = true
  }

  // Subscribes; resolves with the first snapshot, so the page shows once everything is in.
  const follow = (subscribe, apply, keep = (u) => unsubscribes.push(u)) =>
    new Promise((resolve, reject) => {
      const unsubscribe = subscribe(
        (data) => {
          apply(data)
          resolve()
        },
        (e) => {
          failed(e)
          reject(e)
        },
      )
      if (left) unsubscribe()
      else keep(unsubscribe)
    })

  // Sign-ups of every trip — also one whose registration was just started.
  const followParticipants = (list) =>
    Promise.all(
      list
        .filter((event) => isTrip(event) && !participantUnsubscribes.has(event.id))
        .map((event) =>
          follow(
            (next, error) => subscribeParticipants(event.id, next, error),
            (docs) =>
              (participants.value = {
                ...participants.value,
                [event.id]: Object.fromEntries(docs.map((p) => [p.id, p])),
              }),
            (u) => participantUnsubscribes.set(event.id, u),
          ),
        ),
    )

  let firstParticipants = null
  onMounted(async () => {
    try {
      const [, , memberList, appSettings] = await Promise.all([
        leaderTroop.init(),
        scheduleStore.load(),
        listMembers(),
        getAppSettings(),
      ])
      members.value = memberList.sort(byNickname)
      settings.value = campRequirements(appSettings)
      await Promise.all([
        follow(
          (next, error) => subscribeEvents({ fromDate: schoolYear.from }, next, error),
          (list) => {
            events.value = list
            const loaded = followParticipants(list)
            loaded.catch(() => {}) // reported by failed()
            firstParticipants ??= loaded
          },
        ),
        ...['vlc', 'ss'].map((code) =>
          follow(
            (next, error) =>
              subscribeMeetings(
                { troop: code, fromDate: schoolYear.from, toDate: today },
                next,
                error,
              ),
            (list) => (meetingsByTroop.value = { ...meetingsByTroop.value, [code]: list }),
          ),
        ),
        ...['vlc', 'ss'].map((code) =>
          follow(
            (next, error) =>
              subscribeExcuses(
                { troop: code, fromDate: schoolYear.from, toDate: today },
                next,
                error,
              ),
            (list) => (excusesByTroop.value = { ...excusesByTroop.value, [code]: list }),
          ),
        ),
      ])
      // The page shows once the sign-ups of the first snapshot's trips are in too.
      await firstParticipants
    } catch (e) {
      failed(e)
    } finally {
      loading.value = false
    }
  })

  // Autosave state for the page: a write counts as saved once the server
  // confirmed it (Firestore resolves then); a write still pending after a few
  // seconds, or while offline, is shown as waiting for the connection.
  const pending = ref(0)
  const savedAt = ref(null) // Date of the last confirmed write
  const slow = ref(false)
  const online = ref(navigator.onLine)
  const setOnline = () => (online.value = navigator.onLine)
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
  onUnmounted(() => {
    window.removeEventListener('online', setOnline)
    window.removeEventListener('offline', setOnline)
  })
  let slowTimer = null
  const saveState = computed(() => {
    if (pending.value) return slow.value || !online.value ? 'waiting' : 'saving'
    if (saveError.value) return 'error'
    return savedAt.value ? 'saved' : 'idle'
  })

  // Surfaces a failed autosave; the live listeners bring back the saved state.
  async function save(write) {
    saveError.value = false
    pending.value++
    clearTimeout(slowTimer)
    slowTimer = setTimeout(() => (slow.value = pending.value > 0), 4000)
    try {
      await write()
      savedAt.value = new Date()
    } catch (e) {
      console.error('Saving attendance failed', e)
      saveError.value = true
    } finally {
      if (--pending.value === 0) {
        clearTimeout(slowTimer)
        slow.value = false
      }
    }
  }

  const participantOf = (eventId, memberId) => participants.value[eventId]?.[memberId] ?? null
  const troopMembers = computed(() => members.value.filter((m) => m.troop === troop.value))
  const meetings = computed(() => meetingsByTroop.value[troop.value])
  const meetingOn = (date) =>
    meetings.value.find((m) => m.id === meetingId(troop.value, date)) ?? null

  // ---- meetings ----

  const schedule = computed(() => scheduleStore.schedule)
  const weekdays = computed(() => schedule.value[troop.value].days)
  const meetingTime = computed(() => meetingTimeShort(schedule.value[troop.value]))

  // Dates without meetings (Administration) are left out unless recorded anyway.
  const skipDate = (date) => !!noMeetingOn(schedule.value, troop.value, date) && !meetingOn(date)
  const pastDates = (weekday) => meetingDates(weekday, schoolYear.from, today, skipDate)

  // Past (and today's) meeting dates of the weekday this school year, newest first.
  const datesOf = (weekday) => pastDates(weekday).reverse()

  // Today, or the most recent meeting date of the troop.
  function defaultMeeting() {
    const latest = weekdays.value
      .map((weekday) => ({ weekday, date: datesOf(weekday)[0] }))
      .filter((m) => m.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    return latest ?? { weekday: weekdays.value[0], date: null }
  }

  // State of a meeting date: 'cancelled' | 'recorded' | 'unrecorded'.
  function meetingState(date) {
    const meeting = meetingOn(date)
    if (!meeting) return 'unrecorded'
    return meeting.cancelled ? 'cancelled' : 'recorded'
  }

  // A day the troop no longer meets on counts as no day (the admin re-assigns it).
  const hasMeetingDay = (m) => weekdays.value.includes(m.meetingDay)
  const childrenOn = (weekday) => troopMembers.value.filter((m) => m.meetingDay === weekday)
  const withoutMeetingDay = computed(() => troopMembers.value.filter((m) => !hasMeetingDay(m)))

  const meetingKey = (date) => ({ troop: troop.value, date, weekday: weekdayOf(date) })
  const isPresent = (date, memberId) => !!meetingOn(date)?.presentIds?.includes(memberId)
  const togglePresent = (date, memberId) =>
    save(() => setPresent(meetingKey(date), memberId, !isPresent(date, memberId)))
  const setAllPresent = (date, memberIds) => save(() => setPresence(meetingKey(date), memberIds))
  const setMeetingCancelled = (date, cancelled) =>
    save(() => setCancelled(meetingKey(date), cancelled))
  const unrecordMeeting = (date) => save(() => clearMeeting(meetingKey(date)))

  // Excuses (parents' on the day, leaders' any time); an excused child still counts as absent.
  const excuses = computed(() => excusesByTroop.value[troop.value])
  const excuseOf = (date, memberId) =>
    excuses.value.find((e) => e.date === date && e.memberId === memberId) ?? null
  const excuseChild = (date, memberId, reason) =>
    save(() => excuse({ troop: troop.value, date, memberId, reason, by: 'leader' }))
  const unexcuseChild = (date, memberId) =>
    save(() => cancelExcuse({ troop: troop.value, date, memberId }))

  // ---- trips ----

  const ofTroop = (e) => e.audience === 'all' || e.audience === troop.value
  const newestFirst = (a, b) => b.startDate.localeCompare(a.startDate)

  // The troop's trips this school year (troop + all), newest first.
  const trips = computed(() =>
    events.value.filter((e) => isTrip(e) && ofTroop(e)).sort(newestFirst),
  )
  // Events with a poster (they all get registration, SPEC §4.3), also before
  // registration started and cancelled ones — the trips page edits their posters.
  const posterEvents = computed(() =>
    events.value.filter((e) => e.posterStatus !== 'none' && ofTroop(e)).sort(newestFirst),
  )

  // The one that started last, else the nearest upcoming one.
  const latestOf = (list) => list.find((e) => e.startDate <= today) ?? list.at(-1) ?? null
  const defaultTrip = () => latestOf(trips.value)
  const defaultPosterEvent = () => latestOf(posterEvents.value)
  // The troop's trip going on today, if any.
  const runningTrip = () =>
    trips.value.find((e) => e.startDate <= today && today <= e.endDate) ?? null

  // Everyone who can join: for trips of both troops (usually one leader records
  // them for everybody) the children of both troops.
  const tripChildren = (event) => members.value.filter((m) => canJoin(event, m))

  // What was paid: the amount entered, else the event's price.
  const paidAmount = (event, p) => p.amountPaid ?? event.price ?? 0

  function tripSummary(event) {
    const rows = tripChildren(event).map((m) => participantOf(event.id, m.id) ?? {})
    return {
      signedUp: rows.filter((p) => p.signedUp).length,
      attended: rows.filter((p) => p.attended === true).length,
      paid: rows.filter((p) => p.paid).length,
      cash: rows.filter((p) => p.paid).reduce((sum, p) => sum + paidAmount(event, p), 0),
    }
  }

  const setTripFields = (event, memberId, fields) =>
    save(() => setAttendance(event.id, memberId, fields))
  // Leaders sign children up or off any time, also after the deadline.
  const setTripSignedUp = (event, memberId, signedUp) =>
    save(() => setSignedUp(event.id, memberId, signedUp))

  // ---- who recorded ----

  // Nickname of each leader who recorded the shown meetings and trips
  // (users/{uid} → skautisPeople, else the account name), loaded once per uid.
  const recorders = ref({})
  const requested = new Set()
  async function loadRecorder(uid) {
    requested.add(uid)
    try {
      const user = await getUser(uid)
      const person = user?.personId ? await getPerson(user.personId) : null
      recorders.value = { ...recorders.value, [uid]: nicknameOf(person) || user?.displayName || '' }
    } catch (e) {
      console.error('Loading who recorded failed', e)
    }
  }
  watch(
    () => [
      ...meetings.value.map((m) => m.updatedBy),
      ...trips.value.flatMap((e) =>
        Object.values(participants.value[e.id] ?? {}).map((p) => p.recordedBy),
      ),
    ],
    (uids) => uids.filter((uid) => uid && !requested.has(uid)).forEach(loadRecorder),
    { immediate: true },
  )

  // The leader who last changed the meeting's record.
  const meetingRecorder = (date) => recorders.value[meetingOn(date)?.updatedBy] ?? ''
  // Everyone who recorded attendance or payments of the trip.
  const tripRecorders = (event) => [
    ...new Set(
      Object.values(participants.value[event.id] ?? {})
        .map((p) => recorders.value[p.recordedBy])
        .filter(Boolean),
    ),
  ]

  // ---- camp requirement (SPEC §4.2) ----

  // Children of the troop with their meeting % and trips, and a dot per
  // meeting date of their day.
  const troopStats = computed(() => {
    const pastTrips = events.value.filter((e) => e.startDate <= today && isTrip(e))
    return troopMembers.value.map((member) => ({
      member,
      percent: meetingStats(member, meetings.value).percent,
      trips: tripCount(member, pastTrips, participantOf),
      dots: meetingDots(
        member,
        meetings.value,
        schedule.value,
        schoolYear.from,
        today,
        excuses.value,
      ),
      hasMeetingDay: schedule.value[member.troop].days.includes(member.meetingDay),
    }))
  })
  const requirement = computed(() => settings.value[troop.value])

  return {
    today,
    troop,
    loading,
    loadError,
    saveError,
    saveState,
    savedAt,
    // meetings
    weekdays,
    meetingTime,
    datesOf,
    defaultMeeting,
    meetingState,
    childrenOn,
    withoutMeetingDay,
    isPresent,
    togglePresent,
    setAllPresent,
    setMeetingCancelled,
    unrecordMeeting,
    excuseOf,
    excuseChild,
    unexcuseChild,
    meetingRecorder,
    // trips
    events,
    trips,
    posterEvents,
    defaultTrip,
    defaultPosterEvent,
    runningTrip,
    tripChildren,
    participantOf,
    tripSummary,
    setTripFields,
    setTripSignedUp,
    tripRecorders,
    // camp requirement
    troopStats,
    requirement,
  }
}
