<script setup>
import { computed } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatRange, organizerNames } from '@/components/parent/parentText'
import { isHttpUrl, meetingText, packingSentence, priceText, returnText } from './posterText'

// Poster text: title, date, intro and the practical lines. Lines without a
// value are left out.
const props = defineProps({
  event: { type: Object, required: true },
  poster: { type: Object, required: true },
  organizers: { type: Array, required: true },
})

const lines = computed(() =>
  [
    { label: 'Sraz', text: meetingText(props.poster) },
    { label: 'Návrat', text: returnText(props.poster) },
    { label: 'Peněz', text: priceText(props.event.price) },
    { label: 'S sebou', text: packingSentence(props.poster.packingItems) },
    { label: 'Jídlo', text: props.poster.food },
  ].filter((l) => l.text),
)
</script>

<template>
  <div>
    <AudienceTag :audience="event.audience" />
    <h1
      class="m-0 mt-3 mb-3.5 text-[32px] leading-[1.04] font-semibold tracking-[-0.04em] text-ink sm:text-[48px]"
    >
      {{ event.title }}
      <span class="block font-hand text-[0.62em] font-bold tracking-normal text-red">
        {{ formatRange(event.startDate, event.endDate) }}
      </span>
    </h1>
    <p
      v-if="poster.intro"
      class="m-0 mb-[22px] text-[18px] leading-[1.6] whitespace-pre-line text-pretty text-ink"
    >
      {{ poster.intro }}
    </p>

    <dl class="m-0 flex flex-col gap-3.5 text-[17px] leading-normal text-ink">
      <div v-if="poster.destination">
        <dt class="inline font-semibold">Kam:</dt>
        {{ ' ' }}
        <dd class="inline">
          {{ poster.destination }}
          <a v-if="isHttpUrl(poster.mapUrl)" :href="poster.mapUrl" target="_blank" rel="noopener">
            (mapa)
          </a>
        </dd>
      </div>
      <div v-for="line in lines" :key="line.label">
        <dt class="inline font-semibold">{{ line.label }}:</dt>
        {{ ' ' }}
        <dd class="inline">{{ line.text }}</dd>
      </div>
    </dl>

    <p v-if="organizers.length" class="m-0 mt-[26px] font-hand text-[24px] text-ink">
      Těší se na vás {{ organizerNames(organizers) }}
    </p>
  </div>
</template>
