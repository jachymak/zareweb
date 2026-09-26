<script setup>
import LeaderHeader from '@/components/leader/LeaderHeader.vue'

// Placeholder for the leader pages until they exist.
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <LeaderHeader />
  <main class="mx-auto max-w-[1000px] px-4 pt-6 pb-20 sm:px-6">
    <p class="m-0 text-[15px]">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >← zpět na vedoucovskou stránku</RouterLink
      >
    </p>
    <div class="flex flex-col items-center gap-4 py-16 text-center">
      <h1 class="m-0 text-3xl font-medium text-ink">{{ title }}</h1>
      <p class="m-0 font-hand text-2xl text-muted">tuhle stránku ještě chystáme</p>
    </div>
  </main>
</template>
