<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TROOP_MEETING_DAYS, weekdayOf } from '@shared/meetingDays'
import { useAttendance } from '@/composables/useAttendance'
import AreaFooter from '@/components/AreaFooter.vue'
import MeetingsTab from '@/components/attendance/MeetingsTab.vue'
import OverviewTab from '@/components/attendance/OverviewTab.vue'
import TripsTab from '@/components/attendance/TripsTab.vue'
import { TABS } from '@/components/attendance/attendanceText'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import TroopSwitch from '@/components/leader/TroopSwitch.vue'
import PillSwitch from '@/components/parent/PillSwitch.vue'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// Attendance — SPEC §4.2. The selection lives in the URL, so links from the
// leader home open a meeting (?oddil=vlc&schuzka=2026-09-24) or a trip
// (?oddil=vlc&vyprava=…), and a reload keeps the place.
const route = useRoute()
const router = useRouter()
const a = reactive(useAttendance())

const query = route.query
if (TROOP_MEETING_DAYS[query.oddil]) a.troop = query.oddil
const tab = ref(query.vyprava ? 'trips' : 'prehled' in query ? 'overview' : 'meetings')
const weekday = ref(null)
const date = ref(null)
const tripId = ref(null)

function selectDefaults({ meeting = null, trip = null } = {}) {
  const days = TROOP_MEETING_DAYS[a.troop]
  if (
    meeting &&
    days.includes(weekdayOf(meeting)) &&
    a.datesOf(weekdayOf(meeting)).includes(meeting)
  ) {
    weekday.value = weekdayOf(meeting)
    date.value = meeting
  } else {
    ;({ weekday: weekday.value, date: date.value } = a.defaultMeeting())
  }
  tripId.value = a.trips.some((e) => e.id === trip) ? trip : (a.defaultTrip()?.id ?? null)
}

// Once loaded: the linked meeting / trip, else the defaults; again on a troop switch.
const stopInit = watch(
  () => a.loading,
  (loading) => {
    if (loading) return
    selectDefaults({ meeting: query.schuzka, trip: query.vyprava })
    stopInit()
  },
  { immediate: true },
)
watch(
  () => a.troop,
  () => !a.loading && selectDefaults(),
)

watch([tab, date, tripId, () => a.troop], () => {
  if (a.loading) return
  const selection = { meetings: { schuzka: date.value }, trips: { vyprava: tripId.value } }[
    tab.value
  ] ?? { prehled: null }
  router.replace({ query: { oddil: a.troop, ...selection } })
})

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-[22px]">
      <div class="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div class="mr-auto">
          <p class="m-0 mb-2 text-[15px]">
            <RouterLink to="/vedouci" class="inline-block py-1">
              ← zpět na vedoucovskou stránku
            </RouterLink>
          </p>
          <p class="kicker m-0 -mb-0.5">kdo byl a kdo ne</p>
          <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
            Docházka
          </h1>
        </div>
        <TroopSwitch v-model="a.troop" />
      </div>
      <PillSwitch v-model="tab" :options="TABS" label="Část docházky" class="mt-[18px]" />
    </div>

    <p v-if="a.loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="a.loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else :class="section" class="pt-5">
      <p v-if="a.saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">{{ SAVE_ERROR }}</p>
      <MeetingsTab
        v-if="tab === 'meetings' && weekday"
        v-model:weekday="weekday"
        v-model:date="date"
        :attendance="a"
      />
      <TripsTab v-else-if="tab === 'trips'" v-model:trip-id="tripId" :attendance="a" />
      <OverviewTab v-else-if="tab === 'overview'" :attendance="a" />
    </div>
  </main>
  <AreaFooter>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >zpět na vedoucovskou stránku →</RouterLink
      >
    </p>
  </AreaFooter>
</template>
