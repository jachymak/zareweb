<script setup>
// The top panel of the signed-in areas: a stripe in the area's colour, a light linen
// band with the header content, ending in a wavy line.
defineProps({
  stripe: { type: String, required: true }, // Tailwind background class of the stripe
})
</script>

<template>
  <div>
    <div class="h-[5px]" :class="stripe" />
    <div class="bg-[#f1eadf]">
      <slot />
    </div>
    <svg
      viewBox="0 0 1000 8"
      preserveAspectRatio="none"
      class="block h-2 w-full"
      aria-hidden="true"
    >
      <path d="M0 0 H1000 V3 C860 7 700 1 520 4 C320 8 180 1 0 5 Z" fill="#f1eadf" />
      <path
        d="M0 5 C180 1 320 8 520 4 C700 1 860 7 1000 3"
        fill="none"
        stroke="#d6cab4"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</template>
