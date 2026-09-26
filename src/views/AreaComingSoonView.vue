<script setup>
import { useAuthStore } from '@/stores/auth'
import AreaHeader from '@/components/AreaHeader.vue'

// Placeholder for the signed-in areas until their pages exist.
defineProps({
  area: { type: String, required: true },
  title: { type: String, required: true },
})

const auth = useAuthStore()
</script>

<template>
  <AreaHeader :area="area" />
  <main class="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
    <h1 class="m-0 text-3xl font-medium text-ink">{{ title }}</h1>
    <p class="m-0 font-hand text-2xl text-muted">tuhle stránku ještě chystáme</p>
    <RouterLink v-if="auth.role === 'admin'" to="/vedouci/administrace" class="py-2">
      Administrace →
    </RouterLink>
  </main>
</template>
