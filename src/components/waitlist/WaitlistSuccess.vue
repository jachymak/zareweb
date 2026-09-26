<script setup>
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { FIND_OTHER_GROUP_URL } from '@/constants/troops'
import sketchScouts from '@/assets/sketches/skica-skautici.svg'

// Confirmation after a successful sign-up — SPEC §2.2.
defineProps({
  firstName: { type: String, required: true },
  email: { type: String, required: true },
})
defineEmits(['another'])
</script>

<template>
  <HandDrawnBox shape="tall" class="mt-2.5">
    <div class="px-[22px] py-11 sm:px-12">
      <div class="flex flex-wrap items-center gap-x-[34px] gap-y-5">
        <img
          :src="sketchScouts"
          alt=""
          width="260"
          height="300"
          class="block h-auto w-[150px] flex-none"
        />
        <div class="min-w-0 flex-[1_1_300px]">
          <p class="kicker mb-1">hotovo!</p>
          <h1
            class="m-0 mb-4 text-[28px] leading-[1.1] font-medium tracking-[-0.03em] text-ink sm:text-[38px]"
          >
            {{ firstName }} je na čekací listině
          </h1>
          <p class="m-0 text-[17px] leading-[1.7] text-pretty sm:text-[17.5px]">
            Potvrzení o zapsání by vám mělo během pár minut přijít na
            <strong class="font-semibold wrap-anywhere text-ink">{{ email }}</strong
            >. Pokud nedorazí, podívejte se i do spamu.
          </p>
          <p class="m-0 mt-3 text-base leading-[1.65] text-pretty text-muted">
            Listinu každý rok obnovujeme — před náborem vám přijde e-mail, ve kterém jen potvrdíte,
            že o místo stále máte zájem.
          </p>
        </div>
      </div>

      <div class="mt-[30px] -rotate-[.5deg] rounded-[14px] bg-[#F7EBCB] px-[22px] py-[18px]">
        <p class="m-0 mb-1 font-semibold text-ink">Ještě jednou upřímně</p>
        <p class="m-0 text-base leading-[1.65] text-pretty">
          Na listině bývá kolem 150 dětí a každý rok nabereme jen 5–7 nováčků. Doporučujeme proto
          porozhlédnout se i po jiném oddílu — skautů je v Praze spousta.
        </p>
        <a :href="FIND_OTHER_GROUP_URL" class="mt-2.5 inline-block text-[16.5px] font-medium">
          Najít oddíl v okolí →
        </a>
      </div>

      <div class="mt-7 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
        <RouterLink to="/" class="btn-primary px-[26px] py-3.5 text-[16.5px]">
          Zpět na stránku oddílu
        </RouterLink>
        <button
          type="button"
          class="cursor-pointer bg-transparent py-2 text-[16.5px] text-green underline underline-offset-[3px] hover:text-red"
          @click="$emit('another')"
        >
          Zapsat další dítě
        </button>
      </div>
    </div>
  </HandDrawnBox>
</template>
