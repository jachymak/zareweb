<script setup>
import { computed, watch } from 'vue'
import { useScrollToSelected } from '@/composables/useScrollToSelected'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import PillSwitch from '@/components/parent/PillSwitch.vue'
import { formatDay, formatRange } from '@/components/parent/parentText'
import { formatCzk, TRIP_MODES } from './attendanceText'
import TripChildPicker from './TripChildPicker.vue'
import TripChildRow from './TripChildRow.vue'
import TripGatherCard from './TripGatherCard.vue'

// Trips in two modes: „přehled“ at home (who goes, sign-ups, settling the money)
// and „na srazu“ in the crowd at the meeting point (one tap: came, one tap:
// paid; the page hides everything else then). Only children on the list are shown — signed up, or came anyway;
// the others are added through a picker. Every change saves at once.
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
})
const tripId = defineModel('tripId', { type: String, default: null })

const a = props.attendance
const strip = useScrollToSelected(tripId)
const trip = computed(() => a.trips.find((e) => e.id === tripId.value) ?? null)
const children = computed(() => (trip.value ? a.tripChildren(trip.value) : []))
const participant = (m) => a.participantOf(trip.value.id, m.id)
const onList = (m) => {
  const p = participant(m)
  return !!p && (p.signedUp || p.attended === true || p.paid)
}
// Signed-up children first, then those who came without signing up.
const listed = computed(() =>
  children.value
    .filter(onList)
    .sort((x, y) => Number(!participant(x).signedUp) - Number(!participant(y).signedUp)),
)
const others = computed(() => children.value.filter((m) => !onList(m)))
const summary = computed(() => a.tripSummary(trip.value))
const showTroop = computed(() => trip.value?.audience === 'all')

// „na srazu“ on the days of the trip, else „přehled“.
const onTripDays = (e) => !!e && e.startDate <= a.today && a.today <= e.endDate
const mode = defineModel('mode', { type: String, default: 'overview' })
watch(tripId, () => (mode.value = onTripDays(trip.value) ? 'gather' : 'overview'), {
  immediate: true,
})

const update = (m, fields) => a.setTripFields(trip.value, m.id, fields)
const signUp = (memberId, value) => a.setTripSignedUp(trip.value, memberId, value)
const cameAnyway = (memberId) => a.setTripFields(trip.value, memberId, { attended: true })
</script>

<template>
  <div>
    <p v-if="!a.trips.length" class="m-0 py-4 text-[16px] text-muted">
      Letos zatím nejsou žádné výpravy s přihlašováním.
    </p>
    <template v-else>
      <div
        v-show="mode !== 'gather'"
        role="group"
        ref="strip"
        aria-label="Výprava"
        class="flex gap-2 overflow-x-auto px-0.5 pt-1 pb-3 [scrollbar-color:#c9bfa6_transparent] [scrollbar-width:thin]"
      >
        <button
          v-for="e in a.trips"
          :key="e.id"
          type="button"
          :aria-pressed="tripId === e.id"
          class="flex-none cursor-pointer rounded-[3px] border-[1.5px] px-3.5 py-2 text-left whitespace-nowrap"
          :class="
            tripId === e.id
              ? 'border-ink bg-ink text-cream'
              : 'border-[#d6ccb4] bg-transparent text-text'
          "
          @click="tripId = e.id"
        >
          <span class="block font-hand text-[19px] leading-[1.1] font-bold">
            {{ formatRange(e.startDate, e.endDate) }}
          </span>
          <span class="block text-[13px] opacity-85">{{ e.title }}</span>
        </button>
      </div>

      <HandDrawnBox
        v-if="trip"
        shape="tall"
        class="mt-1.5 sm:px-8 sm:pt-7 sm:pb-7"
        :class="mode === 'gather' ? 'px-3.5 pt-4 pb-5' : 'px-5 pt-6 pb-6'"
      >
        <section :aria-label="trip.title">
          <div v-if="mode === 'gather'" class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              class="cursor-pointer rounded-full border-[1.5px] border-[#c9bfa6] bg-transparent px-3.5 py-1.5 text-[14.5px] text-muted"
              @click="mode = 'overview'"
            >
              ← přehled
            </button>
            <h2 class="m-0 text-[21px] font-medium tracking-[-0.03em] text-ink">
              {{ trip.title }}
            </h2>
            <AudienceTag :audience="trip.audience" />
          </div>
          <template v-else>
            <div class="mb-1.5 flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
              <h2 class="m-0 text-[23px] font-medium tracking-[-0.03em] text-ink sm:text-[25px]">
                {{ trip.title }}
              </h2>
              <AudienceTag :audience="trip.audience" />
              <span class="text-[15.5px] text-muted">
                {{ formatRange(trip.startDate, trip.endDate) }} ·
                {{ trip.price == null ? 'cena zatím není' : formatCzk(trip.price) }}
              </span>
              <span class="font-hand text-[20px] text-brown sm:ml-auto">ukládá se samo</span>
            </div>
            <PillSwitch v-model="mode" :options="TRIP_MODES" label="Režim" class="mt-3 mb-4" />
          </template>

          <template v-if="mode === 'gather'">
            <p class="m-0 mb-4 font-hand text-[26px] leading-[1.2] font-bold text-green">
              <span data-testid="gather-count"
                >přijelo {{ summary.attended }} z {{ listed.length }}</span
              >
              · máš u sebe
              <span data-testid="gather-cash">{{ formatCzk(summary.cash) }}</span>
            </p>
            <p v-if="!listed.length" class="m-0 text-[15px] text-muted">Nikdo se nepřihlásil.</p>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-2">
              <TripGatherCard
                v-for="m in listed"
                :key="m.id"
                :member="m"
                :participant="participant(m)"
                :price="trip.price ?? null"
                :show-troop="showTroop"
                @update="(fields) => update(m, fields)"
              />
            </div>
            <TripChildPicker
              :children="others"
              label="přišel někdo nepřihlášený"
              :show-troop="showTroop"
              @pick="cameAnyway"
            />
          </template>

          <template v-else>
            <p class="m-0 mb-4 font-hand text-[22px] text-green" data-testid="trip-summary">
              přihlášeno {{ summary.signedUp }} · přijelo {{ summary.attended }} · zaplaceno
              {{ summary.paid }} · máš mít u sebe
              <b data-testid="trip-cash">{{ formatCzk(summary.cash) }}</b>
            </p>
            <p
              v-if="trip.registrationDeadline && trip.startDate > a.today"
              class="m-0 mb-3 text-[14.5px] text-[#8a7b5e]"
            >
              Výprava teprve bude — přihlášky do {{ formatDay(trip.registrationDeadline) }}.
            </p>
            <p
              v-if="!listed.length"
              class="m-0 border-t border-[#ede5d3] py-2.5 text-[15px] text-muted"
            >
              Nikdo se nepřihlásil.
            </p>
            <TripChildRow
              v-for="m in listed"
              :key="m.id"
              :member="m"
              :participant="participant(m)"
              :price="trip.price ?? null"
              :show-troop="showTroop"
              @update="(fields) => update(m, fields)"
              @sign-up="(value) => signUp(m.id, value)"
            />
            <TripChildPicker
              :children="others"
              label="přihlásit dítě"
              :show-troop="showTroop"
              @pick="(id) => signUp(id, true)"
            />
            <p
              v-if="a.tripRecorders(trip).length"
              class="m-0 mt-4 text-right text-[12px] text-[#a39781]"
              data-testid="recorded-by"
            >
              zapsal(a) {{ a.tripRecorders(trip).join(', ') }}
            </p>
          </template>
        </section>
      </HandDrawnBox>
    </template>
  </div>
</template>
