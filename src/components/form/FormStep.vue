<script setup>
// Numbered heading of a form section.
defineProps({
  number: { type: Number, required: true },
  title: { type: String, required: true },
})
</script>

<template>
  <div class="flex items-center gap-3">
    <span
      class="grid size-[38px] flex-none -rotate-4 place-items-center rounded-full bg-ink font-hand text-[26px] leading-none font-bold text-cream"
      aria-hidden="true"
    >
      {{ number }}
    </span>
    <h2 class="m-0 text-[23px] font-medium text-ink">{{ title }}</h2>
  </div>
</template>
