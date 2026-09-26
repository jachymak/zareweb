<script setup>
import { computed } from 'vue'
import { useScrollToSelected } from '@/composables/useScrollToSelected'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatDay, formatRange } from '@/components/parent/parentText'
import { formatCzk } from './attendanceText'
import TripChildRow from './TripChildRow.vue'

// Trips: who came and who paid how much; signed-up children first, then the
// others in case someone came anyway. Every change saves at once.
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
})
const tripId = defineModel('tripId', { type: String, default: null })

const a = props.attendance
const strip = useScrollToSelected(tripId)
const trip = computed(() => a.trips.find((e) => e.id === tripId.value) ?? null)
const children = computed(() => (trip.value ? a.tripChildren(trip.value) : []))
const participant = (m) => a.participantOf(trip.value.id, m.id)
const signedUp = computed(() => children.value.filter((m) => participant(m)?.signedUp))
const others = computed(() => children.value.filter((m) => !participant(m)?.signedUp))
const summary = computed(() => a.tripSummary(trip.value))

const label = 'm-0 mb-2 text-[12.5px] tracking-[.1em] text-[#8a7b5e] uppercase'
</script>

<template>
  <div>
    <p v-if="!a.trips.length" class="m-0 py-4 text-[16px] text-muted">
      Letos zatím nejsou žádné výpravy s přihlašováním.
    </p>
    <template v-else>
      <div
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

      <HandDrawnBox v-if="trip" shape="tall" class="mt-1.5 px-4 pt-5 pb-[22px] sm:px-6">
        <section :aria-label="trip.title">
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
          <p class="m-0 mb-4 font-hand text-[22px] text-green" data-testid="trip-summary">
            přijelo {{ summary.attended }} · zaplaceno {{ summary.paidSignedUp }} z přihlášených
            {{ summary.signedUp }} · máš mít u sebe
            <b data-testid="trip-cash">{{ formatCzk(summary.cash) }}</b>
          </p>
          <p
            v-if="trip.registrationDeadline && trip.startDate > a.today"
            class="m-0 mb-3 text-[14.5px] text-[#8a7b5e]"
          >
            Výprava teprve bude — přihlášky do {{ formatDay(trip.registrationDeadline) }}.
          </p>

          <p :class="label">Přihlášení</p>
          <p
            v-if="!signedUp.length"
            class="m-0 border-t border-[#ede5d3] py-2.5 text-[15px] text-muted"
          >
            Nikdo se nepřihlásil.
          </p>
          <TripChildRow
            v-for="m in signedUp"
            :key="m.id"
            class="border-t border-[#ede5d3]"
            :member="m"
            :participant="participant(m)"
            :price="trip.price ?? null"
            :show-troop="trip.audience === 'all'"
            signed-up
            @update="(fields) => a.setTripFields(trip, m.id, fields)"
          />

          <template v-if="others.length">
            <p :class="label" class="mt-6">Nepřihlášení — kdyby někdo přišel</p>
            <div class="opacity-80">
              <TripChildRow
                v-for="m in others"
                :key="m.id"
                class="border-t border-dashed border-[#e2d9c2]"
                :member="m"
                :participant="participant(m)"
                :price="trip.price ?? null"
                :show-troop="trip.audience === 'all'"
                @update="(fields) => a.setTripFields(trip, m.id, fields)"
              />
            </div>
          </template>
        </section>
      </HandDrawnBox>
    </template>
  </div>
</template>
