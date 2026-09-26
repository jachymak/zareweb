<script setup>
import { computed, ref } from 'vue'
import { searchable } from './waitlistRows'
import { formatDate, formatYearsMonths, GENDER_DOTS } from './waitlistAdminText'

// Reset step 2: the leader ticks the children admitted this year. Sorted by
// sign-up date; the search ignores case and diacritics.
const props = defineProps({
  rows: { type: Array, required: true },
})
const admitted = defineModel({ type: Set, required: true })

const q = ref('')
const shown = computed(() => {
  const needle = searchable(q.value.trim())
  return [...props.rows]
    .sort((a, b) => (a.signedUp < b.signedUp ? -1 : a.signedUp > b.signedUp ? 1 : 0))
    .filter((r) => !needle || searchable(r.name).includes(needle))
})

function toggle(id) {
  const next = new Set(admitted.value)
  if (!next.delete(id)) next.add(id)
  admitted.value = next
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="m-0 text-[16px] leading-[1.6]">
      Zaškrtněte děti, které jste letos přijali. E-mail s obnovou zájmu jim nepřijde.
    </p>
    <input
      v-model="q"
      type="search"
      placeholder="hledat jméno…"
      aria-label="Hledat jméno"
      class="rounded-[10px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-[15.5px] text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(47,107,79,.15)]"
    />
    <div
      class="max-h-[320px] overflow-y-auto rounded-xl border-[1.5px] border-line-soft bg-paper"
      role="group"
      aria-label="Nabrané děti"
    >
      <button
        v-for="r in shown"
        :key="r.id"
        type="button"
        role="checkbox"
        :aria-checked="admitted.has(r.id)"
        class="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-sand px-3.5 py-2.5 text-left last:border-b-0"
        :class="admitted.has(r.id) ? 'bg-green-light' : 'bg-transparent'"
        @click="toggle(r.id)"
      >
        <span
          class="grid size-[22px] flex-none place-items-center rounded-md border-[1.5px] text-[14px] text-cream"
          :class="admitted.has(r.id) ? 'border-green bg-green' : 'border-line-strong bg-paper'"
          aria-hidden="true"
          >{{ admitted.has(r.id) ? '✓' : '' }}</span
        >
        <span
          class="size-[9px] flex-none rounded-full"
          :style="{ background: GENDER_DOTS[r.gender] }"
        />
        <span class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <span class="min-w-0 flex-1 text-[15.5px] text-ink">{{ r.name }}</span>
          <span class="text-[14px] text-muted-2 sm:whitespace-nowrap">
            {{ formatYearsMonths(r.age) }} · od {{ formatDate(r.signedUp) }}
          </span>
        </span>
      </button>
      <p v-if="!shown.length" class="m-0 px-3.5 py-4 text-[15px] text-muted-2">
        Nikdo takový na listině není.
      </p>
    </div>
    <p class="m-0 text-[14.5px] text-[#4B5749]">
      Nabráno:
      <strong class="font-semibold text-ink" data-testid="admitted-count">{{
        admitted.size
      }}</strong>
    </p>
  </div>
</template>
