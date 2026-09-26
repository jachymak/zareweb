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

// „pondělí a čtvrtek · 17:00–19:00“
function meetings(code) {
  const troop = schedule.value[code]
  const days = troop.days.map((d) => WEEKDAY_NAMES[d]).join(' a ')
  return `${days} · ${meetingTimeLong(troop)}`
}
</script>

<template>
  <ul class="m-0 list-none border-y-[1.5px] border-ink p-0">
    <li
      v-for="troop in TROOPS"
      :key="troop.code"
      class="grid grid-cols-1 gap-1 border-line-soft py-4 text-left not-first:border-t sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5"
    >
      <div class="min-w-0">
        <span class="text-base text-muted-2">{{ troop.number }}</span>
        <div class="text-[22px] leading-tight font-semibold text-ink">{{ troop.name }}</div>
      </div>
      <div class="sm:text-right">
        <div class="text-base text-muted-2">{{ troop.ages }}</div>
        <div class="text-[17px] leading-normal">{{ meetings(troop.code) }}</div>
      </div>
    </li>
  </ul>
</template>
