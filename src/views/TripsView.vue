<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { isTrip } from '@shared/attendance'
import { useAttendance } from '@/composables/useAttendance'
import SaveStatus from '@/components/attendance/SaveStatus.vue'
import { listPackingTemplates } from '@/services/packingTemplates'
import AreaFooter from '@/components/AreaFooter.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { formatCzk } from '@/components/attendance/attendanceText'
import TripOverview from '@/components/attendance/TripOverview.vue'
import TripStrip from '@/components/attendance/TripStrip.vue'
import EventChips from '@/components/events/EventChips.vue'
import PosterEditor from '@/components/events/PosterEditor.vue'
import RegistrationSettings from '@/components/events/RegistrationSettings.vue'
import { UNSAVED_CONFIRM } from '@/components/events/eventsText'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import LeaderPageTitle from '@/components/leader/LeaderPageTitle.vue'
import { gatherLink, plannerLink } from '@/components/leader/leaderText'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatRange, LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// Trips — SPEC §4.3: every event with a poster of the troop; the chosen one
// with who goes and the money, its registration and its poster. The selection
// lives in the URL (?oddil=vlc&vyprava={id}), so links from the leader home
// open a trip and a reload keeps the place.
const route = useRoute()
const router = useRouter()
const a = reactive(useAttendance())

const templates = ref([])
const templatesError = ref(false)
onMounted(async () => {
  try {
    templates.value = (await listPackingTemplates()).sort((x, y) =>
      x.name.localeCompare(y.name, 'cs'),
    )
  } catch (e) {
    console.error('Loading packing templates failed', e)
    templatesError.value = true
  }
})

const query = route.query
if (['vlc', 'ss'].includes(query.oddil)) a.troop = query.oddil
const tripId = ref(null)
const trip = computed(() => a.posterEvents.find((e) => e.id === tripId.value) ?? null)

// Unsaved poster changes: ask before switching to another trip, troop or page.
const dirty = ref(false)
const leaveOk = () => !dirty.value || window.confirm(UNSAVED_CONFIRM)
function choose(id) {
  if (id === tripId.value || !leaveOk()) return
  dirty.value = false
  tripId.value = id
}
const troop = computed({
  get: () => a.troop,
  set: (value) => {
    if (value === a.troop || !leaveOk()) return
    dirty.value = false
    a.troop = value
  },
})
onBeforeRouteLeave(() => leaveOk())
const beforeUnload = (e) => dirty.value && e.preventDefault()
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

// Once loaded: the linked trip (switching to its troop), else the default.
// After a troop switch the default, unless the trip is of both troops.
const stopInit = watch(
  () => a.loading,
  (loading) => {
    if (loading) return
    stopInit()
    const linked = a.events.find((e) => e.id === query.vyprava && e.posterStatus !== 'none')
    if (linked && !a.posterEvents.includes(linked)) a.troop = linked.audience
    tripId.value = linked?.id ?? a.defaultPosterEvent()?.id ?? null
  },
  { immediate: true },
)
watch(
  () => a.troop,
  () => !a.loading && !trip.value && (tripId.value = a.defaultPosterEvent()?.id ?? null),
)
// The trip was deleted or lost its poster (here or by another leader): open another.
watch(trip, (now, before) => {
  if (before && !now && tripId.value === before.id) {
    dirty.value = false
    tripId.value = a.defaultPosterEvent()?.id ?? null
  }
})

watch([tripId, () => a.troop], () => {
  if (a.loading) return
  router.replace({ query: { oddil: a.troop, ...(tripId.value && { vyprava: tripId.value }) } })
})

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-[22px]">
      <LeaderPageTitle
        v-model:troop="troop"
        kicker="přihlášky, platby a plakátek"
        title="Výpravy"
      />
    </div>

    <p v-if="a.loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="a.loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else :class="section" class="pt-5">
      <p v-if="a.saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">{{ SAVE_ERROR }}</p>
      <p v-if="!a.posterEvents.length" class="m-0 py-4 text-[16px] text-muted">
        Letos zatím nejsou žádné výpravy s plakátkem.
        <RouterLink to="/vedouci/vypravnik">Přidej je ve výpravníku.</RouterLink>
      </p>
      <template v-else>
        <TripStrip :model-value="tripId" :trips="a.posterEvents" @update:model-value="choose" />

        <HandDrawnBox
          v-if="trip"
          shape="tall"
          class="mt-1.5 px-5 pt-6 pb-6 sm:px-8 sm:pt-7 sm:pb-7"
        >
          <article :aria-label="trip.title">
            <div class="mb-1.5 flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
              <h2
                class="m-0 text-[23px] font-medium tracking-[-0.03em] text-ink sm:text-[25px]"
                :class="trip.cancelled && 'line-through decoration-red'"
              >
                {{ trip.title }}
              </h2>
              <AudienceTag :audience="trip.audience" />
              <span class="text-[15.5px] text-muted">
                {{ formatRange(trip.startDate, trip.endDate) }} ·
                {{ trip.price == null ? 'cena zatím není' : formatCzk(trip.price) }}
              </span>
            </div>
            <div class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <EventChips :event="trip" :today="a.today" />
              <span class="flex flex-wrap items-center gap-x-4 gap-y-1 sm:ml-auto">
                <RouterLink :to="plannerLink(trip.id)" class="py-1 text-[15px]">
                  upravit údaje ve výpravníku
                </RouterLink>
                <RouterLink
                  v-if="isTrip(trip)"
                  :to="gatherLink(a.troop, trip.id)"
                  class="rounded-full bg-green px-5 py-1.5 font-hand text-[20px] font-bold text-cream no-underline hover:bg-green-hover hover:text-cream"
                >
                  na sraz →
                </RouterLink>
              </span>
            </div>
            <p v-if="trip.cancelled" class="note-warm m-0 mb-4">
              Výprava je zrušená — rodiče ji ve výpravníku vidí přeškrtnutou.
            </p>

            <div class="flex flex-col gap-6">
              <TripOverview v-if="isTrip(trip)" :attendance="a" :trip="trip" />
              <RegistrationSettings :event="trip" :today="a.today" />
              <p v-if="templatesError" role="alert" class="m-0 text-red">{{ LOAD_ERROR }}</p>
              <PosterEditor
                v-else
                v-model:dirty="dirty"
                :event="trip"
                :templates="templates"
                :today="a.today"
              />
            </div>
          </article>
        </HandDrawnBox>
      </template>
    </div>
  </main>
  <SaveStatus :state="a.saveState" :saved-at="a.savedAt" floating />
  <AreaFooter />
</template>
