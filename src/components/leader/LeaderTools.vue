<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { TOOL_GROUPS } from './leaderText'

// Links to the leader tools in groups (Správa only for admins).
const auth = useAuthStore()
const groups = computed(() => TOOL_GROUPS.filter((g) => !g.adminOnly || auth.role === 'admin'))

// Frame and heading colour of a tool group.
const TONES = {
  green: 'border-[#9cc0a8] bg-green-light text-green',
  gold: 'border-[#e2c47a] bg-[#fbf1d6] text-[#94650f]',
  teal: 'border-[#9fc4c0] bg-[#e5f0ee] text-[#2d6763]',
  sand: 'border-[#c9b48a] bg-[#f3e9d3] text-brown',
  red: 'border-[#d08a6a] bg-[#faede4] text-red',
}
const tool =
  'inline-block rounded-full border-[1.5px] px-4 py-2 font-hand text-[20px] leading-tight font-bold sm:px-5 sm:text-[21px] text-ink no-underline transition-transform hover:-translate-y-0.5 hover:text-ink'
</script>

<template>
  <nav aria-label="Nástroje" class="flex flex-wrap gap-2.5 sm:gap-3">
    <div
      v-for="group in groups"
      :key="group.title"
      role="group"
      :aria-label="group.title"
      class="flex w-full flex-col gap-1.5 rounded-[6px] border-[1.5px] px-3 pt-2 pb-3 sm:w-auto sm:grow sm:px-3.5"
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
</template>
