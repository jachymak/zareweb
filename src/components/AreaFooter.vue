<script setup>
import logoSipka from '@/assets/logos/logo-sipka.png'

// Footer of the signed-in areas: group, středisko, link to the public site.
</script>

<template>
  <footer class="mt-[46px]">
    <div class="mx-auto max-w-[960px] px-4 sm:px-6" aria-hidden="true">
      <div class="relative h-[74px]">
        <svg
          viewBox="0 0 900 74"
          preserveAspectRatio="none"
          class="absolute inset-0 block size-full"
          fill="none"
          stroke="var(--color-trail)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-dasharray="2 12"
        >
          <path
            d="M40 4 C220 40 400 54 560 48 C700 42 800 20 890 36"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <!-- tent between two trees at the end of the trail -->
        <svg
          viewBox="0 0 140 74"
          class="absolute right-0 bottom-0 block h-[74px] w-auto"
          fill="none"
          stroke="var(--color-brown)"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M86 64 L106 24 L126 64" />
          <path d="M106 24 L102 14 M106 24 L113 12" />
          <path d="M100 64 C101 52 103 44 106 40 C109 44 111 52 112 64" />
          <path
            d="M54 64 L54 44 M54 44 C42 34 49 18 63 23 C68 11 84 16 82 28 C91 33 86 50 72 48"
            stroke="var(--color-green)"
          />
          <path d="M20 64 C25 54 15 46 22 36 C28 48 40 47 38 60" stroke="var(--color-green)" />
          <path d="M6 66 C40 60 82 68 136 64" stroke-width="2.8" />
        </svg>
      </div>
    </div>
    <div
      class="mx-auto flex max-w-[960px] flex-wrap items-center gap-x-7 gap-y-4 px-4 pt-1.5 pb-10 sm:px-6"
    >
      <p class="m-0 font-hand text-[26px] text-ink">Skautský oddíl Záře</p>
      <a
        href="https://stredisko-sipka.skauting.cz"
        title="Junák — český skaut, středisko Šipka Praha, z. s."
        class="block flex-none"
      >
        <img :src="logoSipka" alt="Středisko Šipka Praha" class="block size-[42px]" />
      </a>
      <p class="m-0 text-[14.5px] text-muted-2">
        Junák — český skaut,<br />středisko Šipka Praha, z. s.
      </p>
      <p class="m-0 text-[15px] sm:ml-auto">
        <RouterLink to="/" class="inline-block py-1">veřejné stránky oddílu →</RouterLink>
      </p>
    </div>
  </footer>
</template>
