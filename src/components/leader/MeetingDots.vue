<script setup>
import { formatDay } from '@/components/parent/parentText'
import { DOT_STATES, excuseText } from './leaderText'

// A dot per meeting date of a child's day this school year (SPEC §4.1).
defineProps({
  dots: { type: Array, required: true }, // [{ date, state, excuse? }], oldest first
})

const label = (dot) =>
  `${formatDay(dot.date)} — ${dot.excuse ? excuseText(dot.excuse) : DOT_STATES[dot.state]}`

const DOT_CLASSES = {
  present: 'border-green bg-green',
  absent: 'border-green bg-transparent',
  excused: 'border-gold bg-gold',
  cancelled:
    'border-[#c9bfa6] bg-[repeating-linear-gradient(45deg,#c9bfa6_0_2px,transparent_2px_5px)]',
  unrecorded: 'border-dashed border-[#c9bfa6] bg-transparent',
}
</script>

<template>
  <span class="flex flex-wrap gap-[5px]" data-testid="dots">
    <span
      v-for="dot in dots"
      :key="dot.date"
      role="img"
      class="size-[15px] rounded-full border-2"
      :class="DOT_CLASSES[dot.state]"
      :title="label(dot)"
      :aria-label="label(dot)"
      :data-state="dot.state"
    />
  </span>
</template>
