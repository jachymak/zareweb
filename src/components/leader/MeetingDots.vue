<script setup>
import { formatDay } from '@/components/parent/parentText'
import { DOT_STATES } from './leaderText'

// A dot per meeting date of a child's day this school year (SPEC §4.1).
defineProps({
  dots: { type: Array, required: true }, // [{ date, state }], oldest first
})

const DOT_CLASSES = {
  present: 'border-green bg-green',
  absent: 'border-green bg-transparent',
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
      :title="`${formatDay(dot.date)} — ${DOT_STATES[dot.state]}`"
      :aria-label="`${formatDay(dot.date)} — ${DOT_STATES[dot.state]}`"
      :data-state="dot.state"
    />
  </span>
</template>
