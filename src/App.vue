<script setup>
import { defineAsyncComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { redirectFor } from '@/router'
import { pragueToday } from '@shared/schoolYear'

// Dev server only (left out of the build): the day pretended by `?dnes=`
// (src/devToday.js), shown in a badge.
const devToday = import.meta.env.DEV ? pragueToday() : null
const DevTodayBadge = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/DevTodayBadge.vue'))
  : null

// Leaves a protected page when the user signs out or their role changes.
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

watch(
  () => auth.profileLoaded && auth.role,
  () => {
    if (!auth.profileLoaded) return
    const target = redirectFor(route, auth)
    if (target) router.replace(target)
  },
)
</script>

<template>
  <RouterView />
  <DevTodayBadge v-if="devToday" :day="devToday" />
</template>
