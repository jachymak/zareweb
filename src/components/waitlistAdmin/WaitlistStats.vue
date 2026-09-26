<script setup>
import { computed } from 'vue'
import { formatAverage, formatDate, formatYearsMonths, freshText } from './waitlistAdminText'

// Stats row above the table: count, girls / boys, average age, youngest,
// longest waiting.
const props = defineProps({
  stats: { type: Object, required: true },
})

const pct = (n) => (props.stats.total ? (n / props.stats.total) * 100 : 0) + '%'
const cards = computed(() => {
  const s = props.stats
  return {
    youngest: s.youngest
      ? { value: formatYearsMonths(s.youngest.age), sub: s.youngest.name }
      : { value: '—', sub: 'listina je prázdná' },
    longest: s.longest
      ? {
          value: formatYearsMonths(s.longest.waited),
          sub: `${s.longest.name} · od ${formatDate(s.longest.signedUp)}`,
        }
      : { value: '—', sub: 'listina je prázdná' },
  }
})

const card = 'rounded-2xl border-[1.5px] border-line-soft bg-paper px-4 py-3.5'
const label = 'm-0 mb-1 text-[13px] tracking-[.08em] text-muted-2 uppercase'
const big = 'm-0 font-hand text-[44px] leading-none font-bold text-ink'
const mid = 'm-0 font-hand text-[34px] leading-[1.05] font-bold text-ink'
const sub = 'm-0 mt-1 text-[14px] text-muted-2'
</script>

<template>
  <section
    aria-label="Přehled listiny"
    class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]"
  >
    <div :class="card" class="-rotate-[.4deg]">
      <p :class="label">Čeká dětí</p>
      <p :class="big" data-testid="stat-total">{{ stats.total }}</p>
      <p :class="sub">
        {{ stats.total ? freshText(stats.fresh) : 'čekáme na potvrzení rodičů' }}
      </p>
    </div>
    <div :class="card" class="rotate-[.3deg]">
      <p :class="label">Holky / kluci</p>
      <p :class="big" class="flex items-baseline gap-2" data-testid="stat-gender">
        <span class="text-[#B4462B]">{{ stats.girls }}</span>
        <span class="text-[32px] text-trail">/</span>
        <span class="text-[#2F6283]">{{ stats.boys }}</span>
      </p>
      <div class="mt-2 mb-1 flex h-1.5 overflow-hidden rounded-[3px] bg-sand" aria-hidden="true">
        <span class="bg-[#D7765A]" :style="{ width: pct(stats.girls) }" />
        <span class="bg-[#C9A84A]" :style="{ width: pct(stats.other) }" />
        <span class="bg-[#5E8FAE]" :style="{ width: pct(stats.boys) }" />
      </div>
      <p class="m-0 text-[14px] text-muted-2">
        {{ stats.other ? `+ ${stats.other} jiné` : ' ' }}
      </p>
    </div>
    <div :class="card" class="-rotate-[.2deg]">
      <p :class="label">Průměrný věk</p>
      <p :class="big">{{ stats.averageAge === null ? '—' : formatAverage(stats.averageAge) }}</p>
      <p :class="sub">let</p>
    </div>
    <div :class="card" class="rotate-[.4deg]">
      <p :class="label">Nejmladší</p>
      <p :class="mid">{{ cards.youngest.value }}</p>
      <p :class="sub">{{ cards.youngest.sub }}</p>
    </div>
    <div :class="card" class="-rotate-[.3deg]">
      <p :class="label">Nejdéle čeká</p>
      <p :class="mid">{{ cards.longest.value }}</p>
      <p :class="sub">{{ cards.longest.sub }}</p>
    </div>
  </section>
</template>
