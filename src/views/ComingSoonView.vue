<script setup>
import ZareLogo from '@/components/ZareLogo.vue'

defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <main
    class="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center"
  >
    <ZareLogo class="w-16" />
    <h1 class="m-0 text-3xl font-medium text-ink">{{ title }}</h1>
    <p class="m-0 font-hand text-2xl text-muted">tuhle stránku ještě chystáme</p>
    <RouterLink to="/">← zpět na stránku oddílu</RouterLink>
  </main>
</template>
