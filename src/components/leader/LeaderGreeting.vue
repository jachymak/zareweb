<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUDIENCES } from '@/constants/troops'
import { formatToday } from '@/components/parent/parentText'
import { TOOL_GROUPS } from './leaderText'
import { nicknameOf } from '@shared/names'

// „Ahoj, {přezdívka}!“, role and troop, today's date (not on a phone) and links
// to the tools in groups.
// The slot sits top right (troop switch).
const props = defineProps({
  person: { type: Object, default: null }, // the leader's skautisPeople doc, if linked
  today: { type: String, required: true },
})

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin')
const groups = computed(() => TOOL_GROUPS.filter((g) => !g.adminOnly || isAdmin.value))

const name = computed(
  () => nicknameOf(props.person) || auth.profile?.displayName?.split(' ')[0] || null,
)
const role = computed(() => {
  const title = props.person?.roleTitle || (isAdmin.value ? 'správce' : 'vedoucí')
  const troop = AUDIENCES[props.person?.troop]?.name
  return troop ? `${title} · ${troop}` : title
})
// Frame and heading colour of a tool group.
const TONES = {
  green: 'border-[#9cc0a8] bg-green-light text-green',
  gold: 'border-[#e2c47a] bg-[#fbf1d6] text-[#94650f]',
  teal: 'border-[#9fc4c0] bg-[#e5f0ee] text-[#2d6763]',
  sand: 'border-[#c9b48a] bg-[#f3e9d3] text-brown',
  red: 'border-[#d08a6a] bg-[#faede4] text-red',
}
const tool =
  'inline-block rounded-full border-[1.5px] px-3.5 py-1.5 font-hand text-[19px] leading-tight font-bold sm:px-5 sm:py-2 sm:text-[21px] text-ink no-underline transition-transform hover:-translate-y-0.5 hover:text-ink'
</script>

<template>
  <div>
    <div class="mb-[18px] flex flex-wrap items-start gap-x-5 gap-y-3">
      <div class="mr-auto">
        <h1 class="m-0 mb-0.5 font-hand text-[34px] leading-none font-bold text-ink sm:text-[44px]">
          {{ name ? `Ahoj, ${name}!` : 'Ahoj!' }}
        </h1>
        <p class="m-0 text-[16.5px] text-muted" data-testid="leader-role">
          {{ role }}<span class="hidden sm:inline"> · dneska je {{ formatToday(today) }}</span>
        </p>
      </div>
      <slot />
    </div>
    <nav aria-label="Nástroje" class="flex flex-wrap gap-2.5 sm:gap-3">
      <div
        v-for="group in groups"
        :key="group.title"
        role="group"
        :aria-label="group.title"
        class="flex w-full flex-col gap-1.5 rounded-[6px] border-[1.5px] px-3 pt-2 pb-3 sm:w-auto sm:px-3.5"
        :class="TONES[group.tone]"
      >
        <span class="font-hand text-[18px] leading-none font-bold">{{ group.title }}</span>
        <div class="flex flex-wrap gap-1.5 sm:gap-2">
          <template v-for="item in group.tools" :key="item.to">
            <span
              v-if="item.disabled"
              :class="tool"
              class="cursor-default border-line bg-paper opacity-45 hover:translate-y-0"
              aria-disabled="true"
            >
              {{ item.label }}
            </span>
            <RouterLink v-else :to="item.to" :class="tool" class="border-line-strong bg-paper">
              {{ item.label }}
            </RouterLink>
          </template>
        </div>
      </div>
    </nav>
  </div>
</template>
