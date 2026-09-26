<script setup>
import { computed } from 'vue'
import { AUDIENCES } from '@/constants/troops'

// Small tag „vlč“ / „s&s“ / „vši“ of a troop or an event/news audience.
const props = defineProps({
  audience: { type: String, required: true }, // vlc | ss | all
})

const COLORS = {
  vlc: 'bg-gold-light text-[#6b4a12]',
  ss: 'bg-[#f0cdc2] text-[#8a2f16]',
  all: 'bg-[#cfe2d4] text-[#1f5138]',
}
const info = computed(() => AUDIENCES[props.audience] ?? { name: '', tag: props.audience })
</script>

<template>
  <span
    class="inline-block justify-self-start rounded-full px-[9px] pt-[5px] pb-[6px] font-hand text-[19px] leading-none font-bold whitespace-nowrap"
    :class="COLORS[audience]"
    :title="info.name"
  >
    {{ info.tag }}
  </span>
</template>
