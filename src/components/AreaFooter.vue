<script setup>
import logoSipka from '@/assets/logos/logo-sipka.png'

// Footer of the signed-in areas: group, středisko, link to the public site.
</script>

<template>
  <footer class="mt-[46px] border-t border-line-soft/60">
    <div
      class="mx-auto flex max-w-[960px] flex-wrap items-center gap-x-7 gap-y-4 px-4 pt-6 pb-10 sm:px-6"
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
