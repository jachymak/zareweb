<script setup>
import { computed } from 'vue'
import SortButton from './SortButton.vue'
import WaitlistRow from './WaitlistRow.vue'

// The list: sortable table from `lg` (scrolls sideways when narrower than
// its columns), compact cards with a sort bar below it.
const props = defineProps({
  rows: { type: Array, required: true },
  sort: { type: Object, required: true },
  maxWaitedMonths: { type: Number, required: true }, // of the whole list
  schoolYearLabel: { type: String, required: true },
  emptyText: { type: String, required: true },
})
defineEmits(['sort'])
const openId = defineModel('openId', { type: String, default: null })

const waitPct = (row) => Math.max(3, (row.waitedMonths / Math.max(1, props.maxWaitedMonths)) * 100)

const SORTS = [
  ['signedUp', 'Zapsáno'],
  ['age', 'Věk'],
  ['grade', 'Třída'],
]
const label = computed(() => Object.fromEntries(SORTS))
</script>

<template>
  <div>
    <div class="mb-2.5 flex flex-wrap items-center gap-2 text-[13px] tracking-[.06em] lg:hidden">
      <span class="text-muted-2 uppercase">Řadit:</span>
      <SortButton
        v-for="[key, text] in SORTS"
        :key="key"
        :column="key"
        :label="text"
        :sort="sort"
        @sort="$emit('sort', $event)"
      />
    </div>
    <div class="lg:-mx-6 lg:overflow-x-auto lg:px-6">
      <div
        class="overflow-hidden rounded-2xl border-[1.5px] border-line-soft bg-paper [--waitlist-cols:104px_168px_minmax(150px,1.2fr)_118px_76px_minmax(120px,1fr)_minmax(150px,1.1fr)_28px] lg:min-w-[1060px]"
        role="region"
        aria-label="Čekací listina"
      >
        <div
          class="hidden grid-cols-(--waitlist-cols) items-center gap-x-3 border-b-[1.5px] border-ink px-4 py-2.5 text-[13px] tracking-[.06em] text-muted-2 uppercase lg:grid"
        >
          <SortButton
            column="signedUp"
            :label="label.signedUp"
            :sort="sort"
            class="-ml-[9px]"
            @sort="$emit('sort', $event)"
          />
          <span>Čeká</span>
          <span>Dítě</span>
          <SortButton
            column="age"
            :label="label.age"
            :sort="sort"
            class="-ml-[9px]"
            @sort="$emit('sort', $event)"
          />
          <SortButton
            column="grade"
            :label="label.grade"
            :sort="sort"
            class="-ml-[9px]"
            @sort="$emit('sort', $event)"
          />
          <span>Zná někoho</span>
          <span>Rodič</span>
          <span />
        </div>
        <WaitlistRow
          v-for="row in rows"
          :key="row.id"
          :row="row"
          :open="openId === row.id"
          :wait-pct="waitPct(row)"
          :school-year-label="schoolYearLabel"
          @toggle="openId = openId === row.id ? null : row.id"
        />
        <p
          v-if="!rows.length"
          class="m-0 px-4 py-[34px] text-center font-hand text-[26px] text-brown"
        >
          {{ emptyText }}
        </p>
      </div>
    </div>
  </div>
</template>
