<script setup>
import { useScrollToSelected } from '@/composables/useScrollToSelected'
import { formatRange } from '@/components/parent/parentText'

// Horizontally scrollable list of trips to choose from, the selected one kept
// in view. A cancelled one is struck through.
defineProps({
  trips: { type: Array, required: true }, // newest first
})
const tripId = defineModel({ type: String, default: null })
const strip = useScrollToSelected(tripId)
</script>

<template>
  <div
    ref="strip"
    role="group"
    aria-label="Výprava"
    class="flex gap-2 overflow-x-auto px-0.5 pt-1 pb-3 [scrollbar-color:#c9bfa6_transparent] [scrollbar-width:thin]"
  >
    <button
      v-for="e in trips"
      :key="e.id"
      type="button"
      :aria-pressed="tripId === e.id"
      class="flex-none cursor-pointer rounded-[3px] border-[1.5px] px-3.5 py-2 text-left whitespace-nowrap"
      :class="
        tripId === e.id
          ? 'border-ink bg-ink text-cream'
          : 'border-[#d6ccb4] bg-transparent text-text'
      "
      @click="tripId = e.id"
    >
      <span class="block font-hand text-[19px] leading-[1.1] font-bold">
        {{ formatRange(e.startDate, e.endDate) }}
      </span>
      <span
        class="block text-[13px] opacity-85"
        :class="e.cancelled && 'line-through decoration-red'"
      >
        {{ e.title }}
      </span>
    </button>
  </div>
</template>
