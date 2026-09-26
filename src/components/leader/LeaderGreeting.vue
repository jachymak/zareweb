<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUDIENCES } from '@/constants/troops'
import { formatToday } from '@/components/parent/parentText'
import { ADMIN_TOOL, TOOLS } from './leaderText'

// „Ahoj, {přezdívka}!“, role and troop, today's date and links to the tools.
const props = defineProps({
  person: { type: Object, default: null }, // the leader's skautisPeople doc, if linked
  today: { type: String, required: true },
})

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin')

const name = computed(
  () => props.person?.nickname || auth.profile?.displayName?.split(' ')[0] || null,
)
const role = computed(() => {
  const title = props.person?.roleTitle || (isAdmin.value ? 'správce' : 'vedoucí')
  const troop = AUDIENCES[props.person?.troop]?.name
  return troop ? `${title} · ${troop}` : title
})
const tool =
  'inline-block rounded-full border-[1.5px] px-5 py-2 font-hand text-[21px] leading-tight font-bold text-ink no-underline transition-transform hover:-translate-y-0.5 hover:text-ink'
</script>

<template>
  <div>
    <h1 class="m-0 mb-0.5 font-hand text-[34px] leading-none font-bold text-ink sm:text-[44px]">
      {{ name ? `Ahoj, ${name}!` : 'Ahoj!' }}
    </h1>
    <p class="m-0 mb-[18px] text-[16.5px] text-muted" data-testid="leader-role">
      {{ role }} · dneska je {{ formatToday(today) }}
    </p>
    <nav aria-label="Nástroje" class="flex flex-wrap gap-2.5">
      <RouterLink
        v-for="item in TOOLS"
        :key="item.to"
        :to="item.to"
        :class="tool"
        class="border-line-strong bg-paper"
      >
        {{ item.label }}
      </RouterLink>
      <RouterLink
        v-if="isAdmin"
        :to="ADMIN_TOOL.to"
        :class="tool"
        class="border-[#d08a6a] bg-[#faede4]"
      >
        {{ ADMIN_TOOL.label }}
      </RouterLink>
    </nav>
  </div>
</template>
