<script setup>
import { formatRange, formatToday } from './parentText'
import camp400 from '@/assets/area/tabor-stany-400.webp'
import camp800 from '@/assets/area/tabor-stany-800.webp'

// „Ahoj!“, today's date and the nearest upcoming event.
defineProps({
  today: { type: String, required: true },
  nearestEvent: { type: Object, default: null },
})
</script>

<template>
  <!-- The drawing hangs beside the text, reaching into the space around it
       rather than making the block taller. -->
  <div class="relative sm:mt-8 lg:mt-12">
    <div class="min-w-0 sm:pr-[260px] lg:pr-[280px]">
      <h1 class="m-0 mb-0.5 font-hand text-[40px] leading-none font-bold text-ink sm:text-[50px]">
        Ahoj!
      </h1>
      <p class="m-0 text-[17px] text-muted">
        Dneska je {{ formatToday(today) }}.
        <template v-if="nearestEvent">
          Nejbližší akce —
          <span class="font-hand text-[22px] font-bold text-red" data-testid="nearest-event">
            {{ nearestEvent.title }},
            {{ formatRange(nearestEvent.startDate, nearestEvent.endDate) }}
          </span>
        </template>
      </p>
    </div>
    <img
      :src="camp400"
      :srcset="`${camp400} 400w, ${camp800} 800w`"
      sizes="(min-width: 1024px) 250px, 230px"
      alt=""
      width="1300"
      height="832"
      class="absolute right-0 -bottom-3 hidden h-auto w-[230px] sm:block lg:w-[250px]"
    />
  </div>
</template>
