<script setup>
// Greys out a finished-looking but not yet working part of a page (inert, so
// nothing inside can be clicked or focused) and says it is coming.
defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true },
})
</script>

<template>
  <div class="relative">
    <div inert class="opacity-45 grayscale select-none">
      <slot />
    </div>
    <div class="absolute inset-0 px-4 pt-10 sm:pt-16">
      <div
        role="note"
        class="sticky top-24 mx-auto max-w-[420px] -rotate-1 rounded-[4px] border-2 border-ink bg-paper px-6 py-5 text-center shadow-[4px_5px_0_rgba(34,48,31,.15)]"
      >
        <p class="m-0 font-hand text-[30px] leading-tight font-bold text-ink">{{ title }}</p>
        <p class="m-0 mt-1.5 text-[15.5px] leading-[1.5] text-muted">{{ text }}</p>
      </div>
    </div>
  </div>
</template>
