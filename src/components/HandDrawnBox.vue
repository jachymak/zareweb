<script setup>
// A box with a wobbly, hand-drawn outline. The outline stretches with the content.
defineProps({
  stroke: { type: String, default: 'var(--color-green)' },
  fill: { type: String, default: 'var(--color-paper)' },
})
</script>

<template>
  <div class="relative">
    <svg
      viewBox="0 0 720 300"
      preserveAspectRatio="none"
      aria-hidden="true"
      class="absolute inset-0 block size-full"
    >
      <path
        d="M10 16 C180 8 420 22 706 10 C714 90 700 190 710 288 C480 296 240 282 14 292 C6 200 18 104 10 16 Z"
        :fill="fill"
        :stroke="stroke"
        stroke-width="2.6"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div class="relative">
      <slot />
    </div>
  </div>
</template>
