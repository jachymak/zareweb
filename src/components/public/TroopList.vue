<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { meetingTimeLong } from '@shared/meetingDays'
import { TROOPS, WEEKDAY_NAMES } from '@/constants/troops'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'

// Meeting days and times come from Administration (settings/meetings).
const scheduleStore = useMeetingScheduleStore()
const { schedule } = storeToRefs(scheduleStore)
onMounted(() => scheduleStore.load())

// „pondělí a čtvrtek“ and „17:00–19:00“
function meetings(code) {
  const troop = schedule.value[code]
  return {
    days: troop.days.map((d) => WEEKDAY_NAMES[d]).join(' a '),
    time: meetingTimeLong(troop),
  }
}
</script>

<template>
  <ul class="m-0 list-none border-y-[1.5px] border-ink p-0">
    <li
      v-for="troop in TROOPS"
      :key="troop.code"
      class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-line-soft py-3.5 text-left not-first:border-t sm:gap-x-5 sm:py-4"
    >
      <div class="min-w-0">
        <span class="text-base text-muted-2">{{ troop.number }}</span>
        <div class="text-[20px] leading-tight font-semibold text-ink sm:text-[22px]">
          {{ troop.name }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-base text-muted-2">{{ troop.ages }}</div>
        <!-- Days and time on two lines on mobile. -->
        <div class="text-[16px] leading-snug sm:text-[17px] sm:leading-normal">
          {{ meetings(troop.code).days }}<span class="max-sm:hidden"> · </span
          ><br class="sm:hidden" />{{ meetings(troop.code).time }}
        </div>
      </div>
    </li>
  </ul>
</template>
