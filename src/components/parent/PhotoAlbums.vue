<script setup>
import { PHOTOS_URL } from '@/constants/troops'
import SectionHeading from './SectionHeading.vue'

// „Fotky“ — the latest albums. The data source is still open (SPEC §3.1),
// so for now four empty frames show the layout and link to the gallery.
const TILTS = [-1.8, 1.3, -1, 1.7]
</script>

<template>
  <section aria-labelledby="photos-title">
    <SectionHeading id="photos-title" kicker="z posledních akcí" title="Fotky">
      <a :href="PHOTOS_URL" target="_blank" rel="noopener" class="py-1 text-[15.5px]">
        všechna alba →
      </a>
    </SectionHeading>
    <ul
      class="m-0 grid list-none grid-cols-2 gap-x-3.5 gap-y-5 p-0 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] sm:gap-x-[18px]"
    >
      <li v-for="(tilt, i) in TILTS" :key="i">
        <a
          :href="PHOTOS_URL"
          target="_blank"
          rel="noopener"
          class="block bg-paper px-2 pt-2 pb-1.5 text-inherit no-underline shadow-[0_8px_18px_rgba(34,48,31,.11)] transition-transform hover:-translate-y-0.5"
          :style="{ rotate: `${tilt}deg` }"
        >
          <span class="grid aspect-[4/3] w-full place-items-center bg-sand" aria-hidden="true">
            <svg
              viewBox="0 0 48 40"
              class="w-10 text-line-strong"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            >
              <path d="M4 12 H14 L18 6 H30 L34 12 H44 V36 H4 Z" />
              <circle cx="24" cy="23" r="8" />
            </svg>
          </span>
          <span class="mx-0.5 mt-2 block font-hand text-[20px] leading-[1.15] font-bold text-ink">
            album se chystá
          </span>
          <span class="mx-0.5 block text-[13.5px] text-muted-2">fotky zatím na Zoneramě</span>
        </a>
      </li>
    </ul>
  </section>
</template>
