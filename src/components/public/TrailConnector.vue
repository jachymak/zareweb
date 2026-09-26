<script setup>
import { computed } from 'vue'

// Short piece of the dashed trail between two stacked blocks (mobile layout).
const props = defineProps({
  from: { type: String, default: 'left' }, // side it enters from the block above
  to: { type: String, default: 'right' }, // side it leaves towards the block below
})

const X = { left: 56, right: 298 }

const d = computed(() => {
  const a = X[props.from]
  const b = X[props.to]
  if (a === b) {
    // Same side: a small wiggle towards the middle and back.
    const bow = a < 177 ? a + 60 : a - 60
    return `M${a} -4 C${a} 20 ${bow} 26 ${bow} 38 C${bow} 52 ${a} 56 ${a} 80`
  }
  return `M${a} -4 C${a} 24 ${b} 26 ${b} 50 C${b} 64 ${b} 72 ${b} 80`
})
</script>

<template>
  <svg
    viewBox="0 0 354 76"
    preserveAspectRatio="none"
    aria-hidden="true"
    class="block h-[60px] w-full"
    fill="none"
    stroke="var(--color-trail)"
    stroke-width="2.8"
    stroke-linecap="round"
  >
    <path :d="d" stroke-dasharray="2 12" vector-effect="non-scaling-stroke" />
  </svg>
</template>
