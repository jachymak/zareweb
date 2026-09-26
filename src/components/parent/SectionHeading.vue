<script setup>
// Handwritten kicker + section title; the slot holds controls on the right.
defineProps({
  id: { type: String, required: true }, // for aria-labelledby of the section
  kicker: { type: String, required: true },
  title: { type: String, required: true },
})
</script>

<template>
  <div class="mb-4 flex flex-wrap items-end gap-x-[18px] gap-y-2.5">
    <div class="mr-auto">
      <p class="kicker m-0 -mb-0.5">{{ kicker }}</p>
      <h2 :id="id" class="m-0 text-[27px] font-medium tracking-[-0.03em] text-ink">
        {{ title }}
      </h2>
    </div>
    <slot />
  </div>
</template>
