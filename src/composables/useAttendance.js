import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { campRequirements, isTrip, meetingDots, meetingStats, tripCount } from '@shared/attendance'
import { canJoin } from '@shared/events'
import { meetingDates, meetingTimeShort, noMeetingOn, weekdayOf } from '@shared/meetingDays'
import { listEvents, setAttendance, setSignedUp, subscribeParticipants } from '@/services/events'
import {
  clearMeeting,
  meetingId,
  setCancelled,
  setPresence,
  setPresent,
  subscribeMeetings,
} from '@/services/meetings'
import { listMembers } from '@/services/members'
import { getAppSettings } from '@/services/settings'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'
import { nicknameOf } from '@shared/names'

const byNickname = (a, b) => nicknameOf(a).localeCompare(nicknameOf(b), 'cs')

// Data and autosaving writes of the attendance page (SPEC §4.2) for the troop
// chosen on the page. Meetings and trip sign-ups are followed live, so leaders
// recording at the same time see each other's changes.
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
  const participants = ref({}) // { eventId: { memberId: doc } }
  const settings = ref(campRequirements(null)) // camp requirement per troop

  const unsubscribes = []
  let left = false
  onUnmounted(() => {
    left = true
    unsubscribes.forEach((u) => u())
  })

  function failed(e) {
    if (left) return
    console.error('Loading attendance failed', e)
    loadError.value = true
  }

  onMounted(async () => {
    try {
      const [, , memberList, eventList, appSettings] = await Promise.all([
        leaderTroop.init(),
        scheduleStore.load(),
        listMembers(),
        listEvents({ fromDate: schoolYear.from }),
        getAppSettings(),
      ])
      members.value = memberList.sort(byNickname)
      settings.value = campRequirements(appSettings)
      events.value = eventList
      // Resolves with the first snapshot, so the page shows once everything is in.
      const follow = (subscribe, apply) =>
        new Promise((resolve, reject) => {
          unsubscribes.push(
            subscribe(
              (data) => {
                apply(data)
                resolve()
              },
              (e) => {
                failed(e)
                reject(e)
              },
            ),
          )
        })
      await Promise.all([
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
        ...eventList.filter(isTrip).map((event) =>
          follow(
            (next, error) => subscribeParticipants(event.id, next, error),
            (list) =>
              (participants.value = {
                ...participants.value,
                [event.id]: Object.fromEntries(list.map((p) => [p.id, p])),
              }),
          ),
        ),
      ])
    } catch (e) {
      failed(e)
    } finally {
      loading.value = false
    }
  })

  // Surfaces a failed autosave; the live listeners bring back the saved state.
  async function save(write) {
    saveError.value = false
    try {
      await write()
    } catch (e) {
      console.error('Saving attendance failed', e)
      saveError.value = true
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

  // ---- trips ----

  // The troop's trips this school year (troop + all), newest first.
  const trips = computed(() =>
    events.value
      .filter((e) => isTrip(e) && (e.audience === 'all' || e.audience === troop.value))
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
  )

  // The trip that started last, else the nearest upcoming one.
  const defaultTrip = () =>
    trips.value.find((e) => e.startDate <= today) ?? trips.value.at(-1) ?? null

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

  // ---- camp requirement (SPEC §4.2) ----

  // Children of the troop with their meeting % and trips, and a dot per
  // meeting date of their day.
  const troopStats = computed(() => {
    const pastTrips = events.value.filter((e) => e.startDate <= today && isTrip(e))
    return troopMembers.value.map((member) => ({
      member,
      percent: meetingStats(member, meetings.value).percent,
      trips: tripCount(member, pastTrips, participantOf),
      dots: meetingDots(member, meetings.value, schedule.value, schoolYear.from, today),
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
    // trips
    trips,
    defaultTrip,
    tripChildren,
    participantOf,
    tripSummary,
    setTripFields,
    setTripSignedUp,
    // camp requirement
    troopStats,
    requirement,
  }
}
