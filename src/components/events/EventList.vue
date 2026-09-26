<script setup>
import { computed, ref, watch } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatRange, organizerNames } from '@/components/parent/parentText'
import EventChips from './EventChips.vue'

// Left column: „+ přidat akci“ and the planned events (past ones on request).
const props = defineProps({
  events: { type: Array, required: true }, // this school year, by startDate
  selectedId: { type: String, default: null },
  creating: { type: Boolean, default: false },
  today: { type: String, required: true },
  organizersOf: { type: Function, required: true },
})
const emit = defineEmits(['select', 'create'])

const showPast = ref(false)
const planned = computed(() => props.events.filter((e) => e.endDate >= props.today))
const past = computed(() => props.events.filter((e) => e.endDate < props.today).reverse())

// A past event opened by a link shows the past ones too.
watch(
  () => props.selectedId,
  (id) => past.value.some((e) => e.id === id) && (showPast.value = true),
  { immediate: true },
)
</script>

<template>
  <div>
    <button
      type="button"
      class="w-full cursor-pointer rounded-full border-2 border-dashed px-5 py-2.5 font-hand text-[22px] font-bold"
      :class="
        creating
          ? 'border-green bg-green text-cream'
          : 'border-green bg-transparent text-green hover:bg-green-light'
      "
      @click="emit('create')"
    >
      + přidat akci
    </button>

    <template v-for="group in showPast ? ['planned', 'past'] : ['planned']" :key="group">
      <h2
        class="m-0 mt-[18px] mb-2 text-[12.5px] font-normal tracking-[.12em] text-[#8a7b5e] uppercase"
      >
        {{ group === 'planned' ? 'Naplánované akce' : 'Proběhlé akce' }}
      </h2>
      <p v-if="!(group === 'planned' ? planned : past).length" class="m-0 text-[15px] text-muted">
        {{ group === 'planned' ? 'Zatím žádné — přidej první.' : 'Letos zatím nic neproběhlo.' }}
      </p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="event in group === 'planned' ? planned : past" :key="event.id">
          <button
            type="button"
            :aria-pressed="event.id === selectedId"
            class="block w-full cursor-pointer rounded-[3px] border-[1.5px] px-3.5 py-2.5 text-left"
            :class="
              event.id === selectedId
                ? 'border-ink bg-paper shadow-[3px_3px_0_var(--color-ink)]'
                : 'border-[#e2d9c2] bg-paper hover:border-line-strong'
            "
            @click="emit('select', event.id)"
          >
            <span class="flex flex-wrap items-baseline gap-x-[9px] gap-y-[3px]">
              <span class="font-hand text-[20px] font-bold text-ink">
                {{ formatRange(event.startDate, event.endDate) }}
              </span>
              <AudienceTag :audience="event.audience" />
              <span
                class="text-[15.5px] text-ink"
                :class="event.cancelled && 'line-through decoration-red'"
              >
                {{ event.title }}
              </span>
            </span>
            <span class="mt-1 flex flex-wrap items-center gap-x-[9px] gap-y-1">
              <span v-if="organizersOf(event).length" class="text-[13.5px] text-[#8a7b5e]">
                {{ organizerNames(organizersOf(event)) }}
              </span>
              <EventChips :event="event" :today="today" />
            </span>
          </button>
        </li>
      </ul>
    </template>
    <button
      type="button"
      class="btn-link mt-3"
      :aria-expanded="showPast"
      @click="showPast = !showPast"
    >
      {{ showPast ? 'skrýt proběhlé akce' : `i proběhlé akce (${past.length})` }}
    </button>
  </div>
</template>
