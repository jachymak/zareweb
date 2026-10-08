<script setup>
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { FIND_OTHER_GROUP_URL } from '@/constants/troops'

// „Chcete se přidat?“ block — SPEC §2.1.
</script>

<template>
  <HandDrawnBox stroke="var(--color-red)" class="mx-auto max-w-[720px]">
    <div class="px-6 pt-8 pb-7 sm:px-10 sm:pt-[38px] sm:pb-[34px]">
      <p class="kicker mb-1.5">chcete se přidat?</p>
      <h3 class="section-title mb-3.5">Momentálně máme plno</h3>
      <p class="mb-5 max-w-[54ch] text-base leading-[1.75] text-pretty sm:text-[17.5px]">
        Své dítě můžete zapsat na čekací listinu, míst je ale málo a přijetí to bohužel nezaručuje.
        Děti starší 11 let většinou nenabíráme.
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
