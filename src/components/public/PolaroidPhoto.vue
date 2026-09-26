<script setup>
// Tilted photo print with a handwritten caption. Without `src` it shows an empty frame.
defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  caption: { type: String, required: true },
  tilt: { type: Number, default: -1.6 },
  maxWidth: { type: Number, default: 340 },
  // Intrinsic size of `src` — reserves space so lazy loading doesn't shift the page.
  width: { type: Number, default: undefined },
  height: { type: Number, default: undefined },
})
</script>

<template>
  <figure
    class="m-0 w-full bg-paper px-3 pt-3 pb-2 shadow-[0_10px_26px_rgba(34,48,31,.13)]"
    :style="{ maxWidth: `${maxWidth}px`, transform: `rotate(${tilt}deg)` }"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      loading="lazy"
      class="block h-auto w-full"
    />
    <div v-else class="grid aspect-[4/3] w-full place-items-center bg-sand" aria-hidden="true">
      <svg
        viewBox="0 0 48 40"
        class="w-12 text-line-strong"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      >
        <path d="M4 12 H14 L18 6 H30 L34 12 H44 V36 H4 Z" />
        <circle cx="24" cy="23" r="8" />
      </svg>
    </div>
    <figcaption class="mt-2 text-center font-hand text-[23px] leading-tight text-muted">
      {{ caption }}
    </figcaption>
  </figure>
</template>
