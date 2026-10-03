<script setup>
import { pragueToday } from '@shared/schoolYear'
import { weekdayOf } from '@shared/meetingDays'
import { formatShortDay } from '@/components/leader/leaderText'

// Dev server only: reminds that the pages pretend another today (`?dnes=`).
defineProps({
  day: { type: String, required: true }, // YYYY-MM-DD
})

function clear() {
  const url = new URL(window.location.href)
  url.searchParams.set('dnes', '')
  window.location.assign(url)
}
</script>

<template>
  <div
    v-if="day !== pragueToday(new Date())"
    class="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[14px] text-cream shadow-lg"
    data-testid="dev-today"
  >
    vývoj: dnes je {{ formatShortDay(day, weekdayOf(day)) }}
    <button
      type="button"
      class="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-cream underline"
      @click="clear"
    >
      zrušit
    </button>
  </div>
</template>
