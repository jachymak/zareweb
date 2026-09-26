<script setup>
// Administration tabs (SPEC §4.8). Only implemented tabs are listed. Narrow
// screens wrap them as separate pills; from `lg` they form one joined bar.
const model = defineModel({ type: String, required: true })
defineProps({
  tabs: { type: Array, required: true }, // [{ id, label }]
})
</script>

<template>
  <div
    class="flex flex-wrap gap-1.5 lg:w-fit lg:flex-nowrap lg:gap-0 lg:overflow-hidden lg:rounded-full lg:border-2 lg:border-ink"
    role="tablist"
    aria-label="Administrace"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="model === tab.id"
      class="cursor-pointer rounded-full border-[1.5px] border-ink px-[15px] py-2 text-[15px] font-medium whitespace-nowrap lg:rounded-none lg:border-0 lg:px-[17px] lg:py-[9px]"
      :class="model === tab.id ? 'bg-ink text-cream' : 'bg-transparent text-text'"
      @click="model = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
