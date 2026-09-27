<script setup>
import { computed, useId } from 'vue'
import { troopTag } from './accounts'
import { changeText } from './skautisText'

// What the skautIS sync changes in one group (children or leaders) — SPEC §4.8
// skautIS: new, changed (with the changed fields) and gone people, and how
// many stay as they are.
const props = defineProps({
  title: { type: String, required: true }, // „Děti“
  changes: { type: Object, required: true }, // { added, changed, removed, unchanged }
  removedNote: { type: String, required: true },
})
const id = useId()

const sections = computed(() =>
  [
    { key: 'added', label: 'noví', rows: props.changes.added },
    { key: 'changed', label: 'změnění', rows: props.changes.changed },
    { key: 'removed', label: 'odešlí', rows: props.changes.removed, note: props.removedNote },
  ].filter((s) => s.rows.length),
)
</script>

<template>
  <section
    class="rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3.5 sm:px-[18px]"
    :aria-labelledby="`${id}-title`"
  >
    <h3 :id="`${id}-title`" class="m-0 text-[17px] font-semibold text-ink">
      {{ title }}
      <span class="text-[14.5px] font-normal text-muted-2">
        · beze změny {{ changes.unchanged }}
      </span>
    </h3>
    <p v-if="!sections.length" class="m-0 mt-2 text-[15px] text-muted">Nic se nemění.</p>
    <div v-for="s in sections" :key="s.key" class="mt-3" :data-testid="`skautis-${s.key}`">
      <h4 class="m-0 text-[15px] font-medium text-brown">
        {{ s.label }} ({{ s.rows.length }})
        <span v-if="s.note" class="font-normal text-muted-2"> — {{ s.note }}</span>
      </h4>
      <ul class="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
        <li
          v-for="r in s.rows"
          :key="r.id"
          class="rounded-[3px] border-[1.5px] px-3.5 py-2"
          :class="
            s.key === 'added'
              ? 'border-green bg-green-light/60'
              : s.key === 'removed'
                ? 'border-[#e2d9c2] bg-sand/50'
                : 'border-[#e2d9c2] bg-cream'
          "
          data-testid="skautis-row"
        >
          <span class="flex flex-wrap items-baseline gap-x-2">
            <b v-if="r.nickname" class="font-hand text-[20px] leading-none font-bold text-ink">
              {{ r.nickname }}
            </b>
            <span class="text-[14.5px] text-[#8a7b5e]">{{ r.name }}</span>
            <span v-if="r.troop" class="text-[14px] text-brown">{{ troopTag(r.troop) }}</span>
          </span>
          <ul v-if="r.fields" class="m-0 mt-1 list-none p-0 text-[14px] text-text">
            <li v-for="f in r.fields" :key="f.field" class="break-words">{{ changeText(f) }}</li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>
