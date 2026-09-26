<script setup>
import { FILTERS } from './accounts'

// Account status filter with counts.
const model = defineModel({ type: String, required: true })
defineProps({
  counts: { type: Object, required: true }, // { filterId: number }
})
</script>

<template>
  <div class="flex flex-wrap gap-2" role="group" aria-label="Filtr účtů">
    <button
      v-for="f in FILTERS"
      :key="f.id"
      type="button"
      :aria-pressed="model === f.id"
      class="cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[15px] transition-colors"
      :class="
        model === f.id
          ? 'border-ink bg-ink text-cream'
          : 'border-line bg-transparent text-text hover:border-ink'
      "
      @click="model = f.id"
    >
      {{ f.label }} <span class="opacity-70">{{ counts[f.id] ?? 0 }}</span>
    </button>
  </div>
</template>
