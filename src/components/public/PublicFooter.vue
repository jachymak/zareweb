<script setup>
import { GROUP_EMAIL } from '@/constants/troops'
import logoSipka from '@/assets/logos/logo-sipka.png'
import logoJunak from '@/assets/logos/logo-junak.svg'
import logoPraha from '@/assets/logos/logo-praha-mhmp.svg'
import logoPraha6 from '@/assets/logos/logo-praha6.svg'
import logoMsmt from '@/assets/logos/logo-partner.svg'

const supporters = [
  { src: logoPraha, alt: 'Hlavní město Praha', width: 'w-[62px]' },
  { src: logoPraha6, alt: 'Praha 6', width: 'w-[74px]' },
  { src: logoMsmt, alt: 'MŠMT', width: 'w-[92px]' },
]
</script>

<template>
  <footer class="bg-cream">
    <div
      class="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 pt-11 pb-9 sm:grid-cols-2 sm:px-6 md:grid-cols-3"
    >
      <div class="min-w-0">
        <p class="m-0 mb-1.5 font-hand text-[30px] leading-tight text-ink">Skautský oddíl Záře</p>
        <p class="m-0 text-base leading-relaxed text-muted">
          220. oddíl Vlčušky<br />222. oddíl skautů a skautek
        </p>
      </div>

      <div class="flex min-w-0 items-center gap-3.5">
        <a
          href="https://stredisko-sipka.skauting.cz"
          title="Junák — český skaut, středisko Šipka Praha, z. s."
          class="block flex-none"
        >
          <img :src="logoSipka" alt="Středisko Šipka Praha" class="block size-12" />
        </a>
        <div class="min-w-0">
          <p class="m-0 mb-1.5 text-[12.5px] tracking-[.14em] text-muted-2 uppercase">
            Naše středisko
          </p>
          <p class="m-0 text-base leading-normal text-ink">
            Junák — český skaut,<br />středisko Šipka Praha, z. s.
          </p>
        </div>
      </div>

      <div class="min-w-0">
        <p class="m-0 mb-2 text-[12.5px] tracking-[.14em] text-muted-2 uppercase">Napište nám</p>
        <p class="m-0 mb-1.5 text-base leading-relaxed">
          <a :href="`mailto:${GROUP_EMAIL}`">{{ GROUP_EMAIL }}</a>
        </p>
        <p class="m-0 text-[14.5px] leading-normal text-muted-2">
          Nepište nám, prosím, ohledně zájmu o oddíl — k tomu slouží
          <RouterLink to="/cekaci-listina">čekací listina</RouterLink>, díky.
        </p>
      </div>
    </div>

    <div class="bg-ink">
      <div
        class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-10 gap-y-5 px-4 py-[22px] sm:px-6"
      >
        <img
          :src="logoJunak"
          alt="Junák — český skaut"
          class="w-[88px] opacity-90 brightness-0 invert"
        />
        <div class="flex flex-wrap items-center gap-x-[30px] gap-y-4 sm:ml-auto">
          <p class="m-0 w-full text-[12.5px] tracking-[.14em] text-cream/70 uppercase sm:w-auto">
            Podporují nás
          </p>
          <img
            v-for="logo in supporters"
            :key="logo.alt"
            :src="logo.src"
            :alt="logo.alt"
            :class="['h-auto opacity-90 brightness-0 invert', logo.width]"
          />
        </div>
      </div>
    </div>
  </footer>
</template>
