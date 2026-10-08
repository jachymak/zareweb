<script setup>
import { toRef } from 'vue'
import { useTripList } from '@/composables/useTripList'
import { formatCzk } from './attendanceText'
import TripChildPicker from './TripChildPicker.vue'
import TripGatherCard from './TripGatherCard.vue'

// At the meeting point, in the crowd (SPEC §4.2 „na srazu“): one tap — came,
// one tap — paid. Every change saves at once.
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
  trip: { type: Object, required: true },
})

const a = props.attendance
const { participant, listed, others, summary, showTroop, update } = useTripList(
  a,
  toRef(props, 'trip'),
)
const cameAnyway = (memberId) => a.setTripFields(props.trip, memberId, { attended: true })
</script>

<template>
  <div>
    <p class="m-0 mb-4 font-hand text-[26px] leading-[1.2] font-bold text-green">
      <span data-testid="gather-count">přijelo {{ summary.attended }} z {{ listed.length }}</span>
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
  </div>
</template>
