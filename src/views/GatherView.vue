<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isTrip } from '@shared/attendance'
import { useAttendance } from '@/composables/useAttendance'
import AreaFooter from '@/components/AreaFooter.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import TripGather from '@/components/attendance/TripGather.vue'
import TripStrip from '@/components/attendance/TripStrip.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import LeaderPageTitle from '@/components/leader/LeaderPageTitle.vue'
import { tripLink } from '@/components/leader/leaderText'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// At the meeting point — SPEC §4.2 „na srazu“: on the days of a trip it opens
// right away, otherwise the leader picks one. With a trip open the page shows
// only that trip, nothing to switch by mistake. The selection lives in the URL
// (?oddil=vlc&vyprava={id}).
const route = useRoute()
const router = useRouter()
const a = reactive(useAttendance())

const query = route.query
if (['vlc', 'ss'].includes(query.oddil)) a.troop = query.oddil
const tripId = ref(null)
const trip = computed(() => a.trips.find((e) => e.id === tripId.value) ?? null)

// Once loaded: the linked trip (switching to its troop), else the one going on today.
const stopInit = watch(
  () => a.loading,
  (loading) => {
    if (loading) return
    stopInit()
    const linked = a.events.find((e) => e.id === query.vyprava && isTrip(e))
    if (linked && linked.audience !== 'all') a.troop = linked.audience
    tripId.value = linked?.id ?? a.runningTrip()?.id ?? null
  },
  { immediate: true },
)

watch([tripId, () => a.troop], () => {
  if (a.loading) return
  router.replace({ query: { oddil: a.troop, ...(tripId.value && { vyprava: tripId.value }) } })
})

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div v-if="!trip" :class="section" class="pt-[22px]">
      <LeaderPageTitle
        v-model:troop="a.troop"
        kicker="kdo přijel a kdo zaplatil"
        title="Na srazu"
      />
    </div>

    <p v-if="a.loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="a.loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else-if="trip" :class="section" class="pt-3.5">
      <p v-if="a.saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">{{ SAVE_ERROR }}</p>
      <HandDrawnBox shape="tall" class="px-3.5 pt-4 pb-5 sm:px-8 sm:pt-7 sm:pb-7">
        <section :aria-label="trip.title">
          <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              class="cursor-pointer rounded-full border-[1.5px] border-[#c9bfa6] bg-transparent px-3.5 py-1.5 text-[14.5px] text-muted"
              @click="tripId = null"
            >
              ← jiná výprava
            </button>
            <h2 class="m-0 text-[21px] font-medium tracking-[-0.03em] text-ink">
              {{ trip.title }}
            </h2>
            <AudienceTag :audience="trip.audience" />
          </div>
          <TripGather :attendance="a" :trip="trip" />
        </section>
      </HandDrawnBox>
      <p class="m-0 mt-5 text-[15px]">
        <RouterLink :to="tripLink(a.troop, trip.id)" class="py-1">
          přehled výpravy a plakátek →
        </RouterLink>
      </p>
    </div>
    <div v-else :class="section" class="pt-5">
      <p v-if="a.saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">{{ SAVE_ERROR }}</p>
      <p v-if="!a.trips.length" class="m-0 py-4 text-[16px] text-muted">
        Letos zatím nejsou žádné výpravy s přihlašováním.
      </p>
      <template v-else>
        <p class="m-0 mb-2 font-hand text-[22px] text-brown">vyber výpravu:</p>
        <TripStrip v-model="tripId" :trips="a.trips" />
      </template>
    </div>
  </main>
  <AreaFooter />
</template>
