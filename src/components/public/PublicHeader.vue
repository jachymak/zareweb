<script setup>
import { ref } from 'vue'
import ZareLogo from '@/components/ZareLogo.vue'

const links = [
  { href: '#start', label: 'Kdo jsme' },
  { href: '#oddily', label: 'Oddíly' },
  { href: '#cinnost', label: 'Co děláme' },
  { href: '#rok', label: 'Jak to chodí' },
  { href: '#klubovna', label: 'Klubovna' },
  { href: '#tabor', label: 'Tábor' },
  { href: '#otazky', label: 'Pro rodiče' },
]

const menuOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm">
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

      <button
        type="button"
        class="-mr-2 grid size-11 cursor-pointer place-items-center bg-transparent lg:hidden"
        :aria-expanded="menuOpen"
        aria-controls="public-menu"
        :aria-label="menuOpen ? 'Zavřít menu' : 'Otevřít menu'"
        @click="menuOpen = !menuOpen"
      >
        <svg
          viewBox="0 0 24 24"
          class="w-6 text-ink"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path v-if="menuOpen" d="M6 6 L18 18 M18 6 L6 18" />
          <path v-else d="M3 6 H21 M3 12 H21 M3 18 H21" />
        </svg>
      </button>
    </div>

    <nav
      v-show="menuOpen"
      id="public-menu"
      class="border-t border-line-soft px-4 pt-1 pb-4 sm:px-6 lg:hidden"
      aria-label="Sekce stránky"
    >
      <ul class="m-0 grid list-none grid-cols-2 gap-x-4 p-0">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="block py-2.5 text-base text-text no-underline"
            @click="menuOpen = false"
          >
            {{ link.label }}
          </a>
        </li>
        <li>
          <RouterLink
            to="/prihlaseni"
            class="inline-block py-1.5 font-hand text-[22px] font-bold text-ink no-underline"
          >
            <span class="border-b-2 border-gold">pro členy</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
