<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { redirectFor } from '@/router'

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
</template>
