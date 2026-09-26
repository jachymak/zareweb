<script setup>
import { formatRange, formatToday } from './parentText'
import signpost from '@/assets/sketches/skica-rozcestnik.svg'

// „Ahoj!“, today's date and the nearest upcoming event.
defineProps({
  today: { type: String, required: true },
  nearestEvent: { type: Object, default: null },
})
</script>

<template>
  <div class="flex items-end gap-x-[30px] gap-y-2.5">
    <div class="min-w-0 flex-1">
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
    <img :src="signpost" alt="" class="hidden w-[110px] flex-none sm:block" />
  </div>
</template>
