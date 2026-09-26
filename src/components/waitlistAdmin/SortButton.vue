<script setup>
import { computed } from 'vue'

// Column header that sorts the table: ↕ when inactive, ↑ / ↓ when active.
const props = defineProps({
  label: { type: String, required: true },
  column: { type: String, required: true },
  sort: { type: Object, required: true }, // { key, dir }
})
defineEmits(['sort'])

const active = computed(() => props.sort.key === props.column)
const arrow = computed(() => (!active.value ? '↕' : props.sort.dir > 0 ? '↑' : '↓'))
</script>

<template>
  <button
    type="button"
    title="Seřadit"
    :aria-pressed="active"
    class="flex min-h-9 cursor-pointer items-center gap-1.5 justify-self-start rounded-lg border px-2 py-1 text-left tracking-[inherit] uppercase hover:border-trail"
    :class="
      active ? 'border-gold bg-gold-light text-ink' : 'border-line-soft bg-cream text-muted-2'
    "
    @click="$emit('sort', column)"
  >
    {{ label }}<span class="text-[14px] tracking-normal" aria-hidden="true">{{ arrow }}</span>
  </button>
</template>
