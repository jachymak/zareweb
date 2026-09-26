<script setup>
import { computed } from 'vue'

// A box with a wobbly, hand-drawn outline. The outline stretches with the content,
// so pick the shape closest to the box's proportions: the wobble scales too.
const props = defineProps({
  stroke: { type: String, default: 'var(--color-green)' },
  fill: { type: String, default: 'var(--color-paper)' },
  shape: { type: String, default: 'card' }, // 'card' (wide) | 'tall' (long forms)
})

const SHAPES = {
  card: {
    viewBox: '0 0 720 300',
    d: 'M10 16 C180 8 420 22 706 10 C714 90 700 190 710 288 C480 296 240 282 14 292 C6 200 18 104 10 16 Z',
  },
  tall: {
    viewBox: '0 0 720 1000',
    d: 'M10 8 C200 4 460 11 708 5 C714 300 702 640 712 995 C470 998 230 992 12 997 C4 660 16 320 10 8 Z',
  },
}
const shapeDef = computed(() => SHAPES[props.shape] ?? SHAPES.card)
</script>

<template>
  <div class="relative">
    <svg
      :viewBox="shapeDef.viewBox"
      preserveAspectRatio="none"
      aria-hidden="true"
      class="absolute inset-0 block size-full"
    >
      <path
        :d="shapeDef.d"
        :fill="fill"
        :stroke="stroke"
        stroke-width="2.4"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div class="relative">
      <slot />
    </div>
  </div>
</template>
