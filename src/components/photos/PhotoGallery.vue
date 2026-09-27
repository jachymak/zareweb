<script setup>
import JustifiedGrid from './JustifiedGrid.vue'
import { photoCount } from './photosText'

// Photos of an album by day (photoGroups), each day a justified grid. Leaders
// can select photos, a whole day at once too.
const props = defineProps({
  groups: { type: Array, required: true }, // photoGroups(…)
  selectable: { type: Boolean, default: false },
  selecting: { type: Boolean, default: false },
  selected: { type: Set, default: () => new Set() },
  coverId: { type: String, default: null },
})
const emit = defineEmits(['open', 'toggle', 'toggle-day']) // toggle-day(photos, select)

const allSelected = (photos) => photos.every((p) => props.selected.has(p.id))
</script>

<template>
  <div class="flex flex-col gap-6">
    <section
      v-for="group in groups"
      :key="group.key"
      :aria-label="group.label || 'Fotky'"
      data-testid="photo-day"
    >
      <div v-if="group.label" class="mb-2 flex flex-wrap items-baseline gap-x-3 px-3 sm:px-0">
        <h2 class="m-0 font-hand text-[25px] leading-tight font-bold text-ink">
          {{ group.label }}
        </h2>
        <span class="text-[14px] text-muted-2">{{ photoCount(group.photos.length) }}</span>
        <button
          v-if="selectable"
          type="button"
          class="btn-link py-0 text-[14px]"
          @click="emit('toggle-day', group.photos, !allSelected(group.photos))"
        >
          {{ allSelected(group.photos) ? 'zrušit výběr dne' : 'vybrat celý den' }}
        </button>
      </div>
      <JustifiedGrid
        :photos="group.photos"
        :selectable="selectable"
        :selecting="selecting"
        :selected="selected"
        :cover-id="coverId"
        @open="emit('open', $event)"
        @toggle="(photo, opts) => emit('toggle', photo, opts)"
      />
    </section>
  </div>
</template>
