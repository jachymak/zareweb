<script setup>
// Segmented switch of a few options (calendar mode, leader groups).
const model = defineModel({ type: String, required: true })
defineProps({
  options: { type: Array, required: true }, // [{ value, label }]
  label: { type: String, required: true },
})
</script>

<template>
  <div
    class="flex w-fit max-w-full overflow-x-auto rounded-full border-[1.5px] border-ink"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value"
      class="cursor-pointer border-0 px-[15px] py-[7px] text-[14.5px] font-medium whitespace-nowrap"
      :class="model === option.value ? 'bg-ink text-cream' : 'bg-transparent text-text'"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
