<script setup>
import { toRef } from 'vue'
import { useTripList } from '@/composables/useTripList'
import { formatDay } from '@/components/parent/parentText'
import { formatCzk } from './attendanceText'
import TripChildPicker from './TripChildPicker.vue'
import TripChildRow from './TripChildRow.vue'

// Who goes and settling the money, at home (SPEC §4.2 „přihlášky a platby“):
// a row per child on the list, the others are signed up through a picker.
// Every change saves at once.
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
  trip: { type: Object, required: true },
})

const a = props.attendance
const { participant, listed, others, summary, showTroop, update } = useTripList(
  a,
  toRef(props, 'trip'),
)
const signUp = (memberId, value) => a.setTripSignedUp(props.trip, memberId, value)
</script>

<template>
  <section aria-labelledby="trip-overview-title">
    <div class="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h3 id="trip-overview-title" class="m-0 text-[19px] font-medium tracking-[-0.02em] text-ink">
        Přihlášky a platby
      </h3>
      <span class="font-hand text-[20px] text-brown sm:ml-auto">ukládá se samo</span>
    </div>
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
    <p v-if="!listed.length" class="m-0 border-t border-[#ede5d3] py-2.5 text-[15px] text-muted">
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
  </section>
</template>
