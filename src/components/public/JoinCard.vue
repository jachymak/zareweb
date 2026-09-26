<script setup>
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { FIND_OTHER_GROUP_URL } from '@/constants/troops'

// „Chcete se přidat?“ block — SPEC §2.1. Years come from settings/public (§6.1).
defineProps({
  recruitment: { type: Object, default: null }, // { doneYear, nextYear } or null while unknown
})
</script>

<template>
  <HandDrawnBox stroke="var(--color-red)" class="mx-auto max-w-[720px]">
    <div class="px-6 pt-8 pb-7 sm:px-10 sm:pt-[38px] sm:pb-[34px]">
      <p class="kicker mb-1.5">chcete se přidat?</p>
      <h3 class="section-title mb-3.5">Momentálně máme plno</h3>
      <p
        v-if="recruitment"
        data-testid="recruitment-note"
        class="mb-3.5 inline-block -rotate-[0.4deg] rounded-[10px] bg-gold-light px-3.5 py-2 text-[15.5px] leading-normal text-ink"
      >
        Nováčky na školní rok {{ recruitment.doneYear }} už máme nabrané. Nové zápisy zařadíme do
        výběru na rok {{ recruitment.nextYear }}.
      </p>
      <p class="mb-5 max-w-[54ch] text-base leading-[1.75] text-pretty sm:text-[17.5px]">
        Své dítě můžete zapsat na čekací listinu oddílu. Bohužel to nezaručuje, že ho v nejbližší
        době přijmeme — a děti starší 11 let většinou nenabíráme. Nováčky vybíráme vždy koncem
        prázdnin a ozveme se sami.
      </p>
      <div class="flex flex-wrap items-center gap-x-[18px] gap-y-3">
        <RouterLink
          to="/cekaci-listina"
          class="rounded-full bg-green px-7 py-[15px] text-[17px] font-medium text-cream no-underline hover:bg-green-hover hover:text-cream"
        >
          Zapsat na čekací listinu
        </RouterLink>
        <a :href="FIND_OTHER_GROUP_URL" class="py-2 text-[16.5px]">…nebo najít jiný oddíl</a>
      </div>
    </div>
  </HandDrawnBox>
</template>
