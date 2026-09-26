<script setup>
import ZareLogo from '@/components/ZareLogo.vue'
</script>

<template>
  <header class="border-b border-line-soft/60">
    <div
      class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-6"
    >
      <RouterLink
        to="/"
        class="mr-auto flex items-center gap-2.5 text-ink no-underline hover:text-ink"
      >
        <ZareLogo class="w-[34px]" />
        <span class="font-hand text-[22px] font-bold sm:text-[24px]">Skautský oddíl Záře</span>
      </RouterLink>
      <RouterLink to="/" class="py-2 text-[15.5px]">← Zpět na stránku oddílu</RouterLink>
    </div>
  </header>
</template>
