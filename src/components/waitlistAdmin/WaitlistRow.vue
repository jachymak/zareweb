<script setup>
import NoteIcon from './NoteIcon.vue'
import WaitlistRowDetail from './WaitlistRowDetail.vue'
import {
  formatDate,
  formatMonthYear,
  formatYearsMonths,
  GENDER_DOTS,
  gradeLong,
  gradeShort,
  renewalTip,
} from './waitlistAdminText'

// One child on the list; a click expands the detail. From `lg` a table row
// (columns of WaitlistTable), below it a compact card.
defineProps({
  row: { type: Object, required: true },
  open: { type: Boolean, required: true },
  waitPct: { type: Number, required: true }, // bar relative to the longest waiting
  schoolYearLabel: { type: String, required: true },
})
defineEmits(['toggle'])

const BACKGROUNDS = { girl: '#FBEEE8', boy: '#EAF1F5', other: '#F7F0DC' }
</script>

<template>
  <div
    class="border-b border-[#E6DDC8] last:border-b-0"
    :class="row.note && 'shadow-[inset_0_0_0_2px_var(--color-gold)]'"
    :style="{ background: BACKGROUNDS[row.gender] }"
    :data-testid="`row-${row.id}`"
  >
    <button
      type="button"
      :aria-expanded="open"
      class="w-full cursor-pointer border-0 bg-transparent px-4 py-3 text-left text-ink lg:grid lg:grid-cols-(--waitlist-cols) lg:items-center lg:gap-x-3"
      @click="$emit('toggle')"
    >
      <!-- narrow screens -->
      <span class="flex items-center gap-2.5 lg:hidden">
        <span
          class="size-2.5 flex-none rounded-full"
          :style="{ background: GENDER_DOTS[row.gender] }"
        />
        <span class="min-w-0 text-[16px] font-medium">{{ row.name }}</span>
        <NoteIcon v-if="row.note" class="size-5" />
        <span
          class="ml-auto text-[16px] text-brown transition-transform"
          :class="open && 'rotate-180'"
          aria-hidden="true"
          >▾</span
        >
      </span>
      <span
        class="mt-1 flex flex-wrap items-center gap-x-2 pl-5 text-[14.5px] text-muted-2 lg:hidden"
      >
        <span>{{ formatYearsMonths(row.age) }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ gradeLong(row.grade) }}</span>
        <span aria-hidden="true">·</span>
        <span>čeká {{ formatYearsMonths(row.waited) }}</span>
      </span>

      <!-- table columns -->
      <span class="hidden text-[15.5px] lg:inline" :title="formatDate(row.signedUp)">{{
        formatMonthYear(row.signedUp)
      }}</span>
      <span class="hidden min-w-0 flex-col gap-[5px] lg:flex">
        <span class="flex items-center gap-1.5">
          <span class="text-[15.5px] whitespace-nowrap">{{ formatYearsMonths(row.waited) }}</span>
          <span
            v-if="row.renewals"
            :title="renewalTip(row.renewals)"
            class="grid h-[22px] min-w-[22px] flex-none cursor-help place-items-center rounded-full border border-line px-1 text-[11.5px] leading-none text-brown"
            >{{ row.renewals }}×</span
          >
        </span>
        <span class="block h-[5px] overflow-hidden rounded-[3px] bg-ink/8" aria-hidden="true">
          <span class="block h-full rounded-[3px] bg-trail" :style="{ width: waitPct + '%' }" />
        </span>
      </span>
      <span class="hidden min-w-0 items-center gap-2.5 lg:flex">
        <span
          class="size-2.5 flex-none rounded-full"
          :style="{ background: GENDER_DOTS[row.gender] }"
        />
        <span class="min-w-0 text-[16px] font-medium">{{ row.name }}</span>
        <span v-if="row.note" :title="row.note" class="flex flex-none"
          ><NoteIcon class="size-5"
        /></span>
      </span>
      <span class="hidden flex-col lg:flex">
        <span class="text-[15.5px] whitespace-nowrap">{{ formatYearsMonths(row.age) }}</span>
        <span class="text-[13px] text-muted-2">{{ formatDate(row.birthDate) }}</span>
      </span>
      <span
        class="hidden text-[15.5px] lg:inline"
        :class="row.grade === 0 && 'text-faint'"
        :title="`${gradeLong(row.grade)} ve školním roce ${schoolYearLabel}`"
        >{{ gradeShort(row.grade) }}</span
      >
      <span
        class="hidden min-w-0 truncate text-[15px] lg:block"
        :class="!row.knowsWhom && 'text-faint'"
        :title="row.knowsWhom || undefined"
        >{{ row.knowsWhom || '—' }}</span
      >
      <span class="hidden min-w-0 truncate text-[15.5px] lg:block">{{ row.parentName }}</span>
      <span
        class="hidden text-center text-[16px] text-brown transition-transform lg:block"
        :class="open && 'rotate-180'"
        aria-hidden="true"
        >▾</span
      >
    </button>
    <WaitlistRowDetail v-if="open" :row="row" :school-year-label="schoolYearLabel" />
  </div>
</template>
