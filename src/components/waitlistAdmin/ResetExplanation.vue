<script setup>
import { computed } from 'vue'
import { formatSchoolYear, pragueToday, recruitmentYears } from '@shared/schoolYear'

// How the annual waiting-list reset works (SPEC §4.6) — in Administration
// above the reset, and behind „i“ on the leaders' waiting list.
const today = pragueToday()
const recruitmentYear = computed(() => formatSchoolYear(recruitmentYears(today, today).doneYear))
const numeral = 'font-hand text-[24px] leading-none font-bold text-gold'
</script>

<template>
  <div class="flex flex-col gap-3 text-[15.5px] leading-[1.6] text-text">
    <p class="m-0 rounded-xl bg-[#F7EBCB] px-3.5 py-2.5 text-[#8A5A2B]">
      <b>Reset se dělá jednou za rok</b>, až má oddíl nováčky vybrané a na tenhle školní rok už
      <b>nechce nabírat další děti</b>. Dokud je šance, že někoho z listiny ještě vezmete, nechte ji
      být.
    </p>
    <p class="m-0">Při resetu správce označí děti, které letos nabrali. Pak se stane tohle:</p>
    <div class="grid grid-cols-[28px_1fr] gap-x-2 gap-y-2.5">
      <span :class="numeral">1</span>
      <span>Nabrané děti z listiny zmizí.</span>
      <span :class="numeral">2</span>
      <span
        >Všechny ostatní děti z listiny zmizí a jejich rodičům přijde e-mail s odkazem. Kdo na odkaz
        klikne a zájem potvrdí, vrátí se na své původní místo v pořadí.</span
      >
      <span :class="numeral">3</span>
      <span
        >Na veřejném webu se ukáže, že nováčky na školní rok {{ recruitmentYear }} už máme
        nabrané.</span
      >
    </div>
    <p class="m-0 text-[14.5px] text-muted-2">
      Díky tomu na listině zůstanou jen ti, kdo o oddíl pořád stojí. Z minulého resetu se smažou
      úplně děti, jejichž rodiče na e-mail neodpověděli, i tehdy nabrané děti.
    </p>
  </div>
</template>
