<script setup>
import { GROUP_EMAIL } from '@/constants/troops'

defineProps({
  maxAge: { type: Number, required: true },
})
</script>

<template>
  <div
    data-testid="too-old"
    class="-rotate-[.4deg] rounded-[14px] border-[1.5px] border-green bg-green-light px-5 py-[18px]"
  >
    <p class="m-0 mb-1.5 text-[17px] font-semibold text-ink">
      Na čekací listinu zapisujeme děti do {{ maxAge }} let
    </p>
    <p class="m-0 text-[16.5px] leading-[1.65] text-pretty">
      Ale neodcházejte! Rádi mezi sebe přijmeme nové vedoucí a rovery. Napište nám na
      <a :href="`mailto:${GROUP_EMAIL}`">{{ GROUP_EMAIL }}</a> a domluvíme se.
    </p>
  </div>
</template>
