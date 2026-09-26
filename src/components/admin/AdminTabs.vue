<script setup>
// Administration tabs (SPEC §4.8). Only implemented tabs are listed.
const model = defineModel({ type: String, required: true })
defineProps({
  tabs: { type: Array, required: true }, // [{ id, label }]
})
</script>

<template>
  <div
    class="flex w-fit max-w-full overflow-x-auto rounded-full border-2 border-ink"
    role="tablist"
    aria-label="Administrace"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="model === tab.id"
      class="cursor-pointer border-0 px-[17px] py-[9px] text-[15px] font-medium whitespace-nowrap"
      :class="model === tab.id ? 'bg-ink text-cream' : 'bg-transparent text-text'"
      @click="model = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
