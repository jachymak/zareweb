<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { weekdayOf } from '@shared/meetingDays'
import { useAttendance } from '@/composables/useAttendance'
import AreaFooter from '@/components/AreaFooter.vue'
import MeetingRecord from '@/components/attendance/MeetingRecord.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import LeaderPageTitle from '@/components/leader/LeaderPageTitle.vue'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// Meetings — SPEC §4.2. The selection lives in the URL, so links from the
// leader home and the reminder e-mail open a meeting (?oddil=vlc&schuzka=2026-09-24),
// and a reload keeps the place.
const route = useRoute()
const router = useRouter()
const a = reactive(useAttendance())

const query = route.query
if (['vlc', 'ss'].includes(query.oddil)) a.troop = query.oddil
const weekday = ref(null)
const date = ref(null)

function selectDefaults(meeting = null) {
  if (
    meeting &&
    a.weekdays.includes(weekdayOf(meeting)) &&
    a.datesOf(weekdayOf(meeting)).includes(meeting)
  ) {
    weekday.value = weekdayOf(meeting)
    date.value = meeting
  } else {
    ;({ weekday: weekday.value, date: date.value } = a.defaultMeeting())
  }
}

// Once loaded: the linked meeting, else the default; again on a troop switch.
const stopInit = watch(
  () => a.loading,
  (loading) => {
    if (loading) return
    selectDefaults(query.schuzka)
    stopInit()
  },
  { immediate: true },
)
watch(
  () => a.troop,
  () => !a.loading && selectDefaults(),
)

watch([date, () => a.troop], () => {
  if (a.loading) return
  router.replace({ query: { oddil: a.troop, schuzka: date.value } })
})

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-[22px]">
      <LeaderPageTitle v-model:troop="a.troop" kicker="kdo byl a kdo ne" title="Schůzky" />
    </div>

    <p v-if="a.loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="a.loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else :class="section" class="pt-5">
      <p v-if="a.saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">{{ SAVE_ERROR }}</p>
      <MeetingRecord v-if="weekday" v-model:weekday="weekday" v-model:date="date" :attendance="a" />
      <p class="m-0 mt-6 text-[15.5px]">
        <RouterLink :to="{ path: '/vedouci/dochazka', query: { oddil: a.troop } }" class="py-1">
          přehled docházky a podmínka na tábor →
        </RouterLink>
      </p>
    </div>
  </main>
  <AreaFooter />
</template>
