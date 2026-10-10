<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUDIENCES } from '@/constants/troops'
import { formatToday } from '@/components/parent/parentText'
import { nicknameOf } from '@shared/names'

// „Ahoj, {přezdívka}!“, role and troop, today's date (not on a phone).
// The slot sits top right (troop switch).
const props = defineProps({
  person: { type: Object, default: null }, // the leader's skautisPeople doc, if linked
  today: { type: String, required: true },
})

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin')

const name = computed(
  () => nicknameOf(props.person) || auth.profile?.displayName?.split(' ')[0] || null,
)
const role = computed(() => {
  const title = props.person?.roleTitle || (isAdmin.value ? 'správce' : 'vedoucí')
  const troop = AUDIENCES[props.person?.troop]?.name
  return troop ? `${title} · ${troop}` : title
})
</script>

<template>
  <div class="flex flex-wrap items-start gap-x-5 gap-y-3">
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
</template>
