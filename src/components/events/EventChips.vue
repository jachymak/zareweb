<script setup>
import { computed } from 'vue'
import { POSTER_STATUS, registrationLabel } from './eventsText'

// Status chips of an event: poster (or „akce zrušená“) and registration.
const props = defineProps({
  event: { type: Object, required: true },
  today: { type: String, required: true },
})

const POSTER_COLORS = {
  published: 'bg-[#cfe2d4] text-[#1f5138]',
  draft: 'bg-gold-light text-[#6b4a12]',
  missing: 'bg-[#f0cdc2] text-[#8a2f16]',
  none: 'bg-sand text-brown',
}
const registration = computed(() =>
  props.event.cancelled ? null : registrationLabel(props.event, props.today),
)
const chip = 'rounded-full px-2.5 pt-[3px] pb-1 font-hand text-[17px] leading-none font-bold'
</script>

<template>
  <span class="inline-flex flex-wrap gap-1.5">
    <span v-if="event.cancelled" :class="chip" class="bg-ink text-cream" data-testid="poster-chip">
      akce zrušená
    </span>
    <span v-else :class="[chip, POSTER_COLORS[event.posterStatus]]" data-testid="poster-chip">
      {{ POSTER_STATUS[event.posterStatus] }}
    </span>
    <span
      v-if="registration"
      :class="chip"
      class="border border-dashed border-line-strong text-brown"
      data-testid="registration-chip"
    >
      {{ registration }}
    </span>
  </span>
</template>
