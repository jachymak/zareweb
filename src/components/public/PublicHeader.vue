<script setup>
import ZareLogo from '@/components/ZareLogo.vue'
import { scrollToSection } from '@/router/sectionScroll'

const links = [
  { href: '#start', label: 'Kdo jsme' },
  { href: '#oddily', label: 'Oddíly' },
  { href: '#cinnost', label: 'Co děláme' },
  { href: '#rok', label: 'Jak to chodí' },
  { href: '#klubovna', label: 'Klubovna' },
  { href: '#tabor', label: 'Tábor' },
  { href: '#otazky', label: 'Pro rodiče' },
]
</script>

<template>
  <header
    class="relative z-30 border-line bg-cream/95 backdrop-blur-sm max-lg:border-b lg:sticky lg:top-0"
  >
    <div class="mx-auto flex max-w-[1120px] items-center gap-4 px-4 py-3 sm:px-6 lg:py-3.5">
      <a
        href="#uvod"
        class="mr-auto flex items-center gap-2.5 text-ink no-underline hover:text-ink"
      >
        <ZareLogo class="w-[34px] sm:w-[38px]" />
        <span class="font-hand text-[22px] font-bold sm:text-[25px]">Skautský oddíl Záře</span>
      </a>

      <nav class="hidden items-center gap-4 lg:flex" aria-label="Sekce stránky">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="text-[15.5px] text-text no-underline"
          @click="scrollToSection($event, link.href)"
        >
          {{ link.label }}
        </a>
        <RouterLink
          to="/prihlaseni"
          class="border-b-2 border-gold pb-px font-hand text-[21px] font-bold text-ink no-underline"
        >
          pro členy
        </RouterLink>
      </nav>

      <!-- Below lg only the way in for members, no section menu. -->
      <RouterLink
        to="/prihlaseni"
        class="flex-none border-b-2 border-gold pb-px font-hand text-[21px] font-bold text-ink no-underline lg:hidden"
      >
        pro členy
      </RouterLink>
    </div>
  </header>
</template>
