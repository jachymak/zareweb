<script setup>
import { computed, ref } from 'vue'
import { formatRange, plural } from '@/components/parent/parentText'
import { MONTHS, WEEKDAY_HEADERS } from './eventsText'

// Month calendar: click the first day, then the last one (a one-day event:
// the same day twice, or just the first). Dates are `YYYY-MM-DD`.
const start = defineModel('start', { type: String, default: null })
const end = defineModel('end', { type: String, default: null })
const props = defineProps({
  today: { type: String, required: true },
  invalid: { type: Boolean, default: false },
})

const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
const initial = (start.value ?? props.today).split('-').map(Number)
const month = ref({ year: initial[0], month: initial[1] - 1 }) // month 0–11

function shift(delta) {
  const d = new Date(Date.UTC(month.value.year, month.value.month + delta, 1))
  month.value = { year: d.getUTCFullYear(), month: d.getUTCMonth() }
}

// Days of the shown month, padded to start on Monday.
const days = computed(() => {
  const { year, month: m } = month.value
  const first = new Date(Date.UTC(year, m, 1))
  const pad = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate()
  return [
    ...Array.from({ length: pad }, () => null),
    ...Array.from({ length: count }, (_, i) => iso(year, m, i + 1)),
  ]
})

function pick(date) {
  if (!start.value || (end.value && end.value !== start.value) || date < start.value) {
    start.value = date
    end.value = date
  } else {
    end.value = date
  }
}

const inRange = (date) => start.value && date >= start.value && date <= (end.value ?? start.value)
const dayCount = computed(() =>
  start.value
    ? Math.round((Date.parse(end.value ?? start.value) - Date.parse(start.value)) / 86400000) + 1
    : 0,
)
const label = (date) => {
  const [y, m, d] = date.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}
</script>

<template>
  <div>
    <div
      class="rounded-[10px] border-[1.5px] bg-cream px-2.5 pt-3 pb-3.5 sm:px-3.5"
      :class="invalid ? 'border-red' : 'border-[#c9bfa6]'"
    >
      <div class="mb-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          class="size-9 cursor-pointer rounded-full border-[1.5px] border-[#c9bfa6] bg-transparent text-[18px] text-ink"
          aria-label="předchozí měsíc"
          @click="shift(-1)"
        >
          ‹
        </button>
        <span class="font-hand text-[22px] font-bold text-ink" aria-live="polite">
          {{ MONTHS[month.month] }} {{ month.year }}
        </span>
        <button
          type="button"
          class="size-9 cursor-pointer rounded-full border-[1.5px] border-[#c9bfa6] bg-transparent text-[18px] text-ink"
          aria-label="další měsíc"
          @click="shift(1)"
        >
          ›
        </button>
      </div>
      <div class="mb-1 grid grid-cols-7 gap-[3px]" aria-hidden="true">
        <span
          v-for="h in WEEKDAY_HEADERS"
          :key="h"
          class="text-center text-[12.5px] font-medium text-[#8a7b5e]"
        >
          {{ h }}
        </span>
      </div>
      <div class="grid grid-cols-7 gap-[3px]" role="group" aria-label="Termín akce">
        <template v-for="(date, i) in days" :key="date ?? `pad-${i}`">
          <span v-if="!date" />
          <button
            v-else
            type="button"
            :aria-label="label(date)"
            :aria-pressed="!!inRange(date)"
            class="h-9 min-w-0 cursor-pointer rounded-md border-0 text-[14.5px]"
            :class="[
              date === start || date === end
                ? 'bg-green font-semibold text-cream'
                : inRange(date)
                  ? 'bg-green-light text-ink'
                  : 'bg-transparent text-text hover:bg-sand',
              date === today && 'ring-1 ring-gold ring-inset',
            ]"
            @click="pick(date)"
          >
            {{ Number(date.slice(8)) }}
          </button>
        </template>
      </div>
    </div>
    <p class="m-0 mt-2 font-hand text-[20px] text-green" data-testid="term">
      <template v-if="start">
        {{ formatRange(start, end ?? start) }}
        ({{ dayCount }} {{ plural(dayCount, 'den', 'dny', 'dní') }})
      </template>
      <template v-else>termín zatím není vybraný</template>
    </p>
    <p class="m-0 mt-0.5 text-[13.5px] text-[#8a7b5e]">
      klikni na první den, pak na poslední (víkendovka)
    </p>
  </div>
</template>
