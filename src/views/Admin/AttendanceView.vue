<script setup>

import AdminPageLayout from "@/components/Admin/AdminPageLayout.vue";
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import {computed, ref, watch} from "vue";
import {addDays, eachDayOfInterval, isEqual, isSameDay, set, startOfDay} from 'date-fns';
import Badge from "@/components/Badge.vue";
import {useAttendanceStore} from "@/stores/attendance.js";
import {storeToRefs} from "pinia";


const currentDate = ref(new Date())

const attendanceStore = useAttendanceStore()
const { doneDates, eventDates } = storeToRefs(attendanceStore)
attendanceStore.setup()

const day = computed(() => {
  return currentDate.value.getDay()
})

const czechDayString = computed(() => {
  const czechDays = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
  return czechDays[day.value]
})

const whoDay = computed(() => {
  switch (day.value) {
    case 1:
      return 'v'
    case 2:
      return 's'
    case 3:
      return 's'
    case 4:
      return 'v'
    default:
      return ''
  }
})

const dateIsDone = (date) => {
  return doneDates.value.some(val => isEqual(val, date))
}

const dateIsEvent = (date) => {
  return eventDates.value.some(val => val.dates.some((v) => isEqual(v, date)))
}

const currentDateIsDone = computed(() => {
  return dateIsDone(startOfDay(currentDate.value))
})

const getDayClass = (date) => {
  if (dateIsEvent(date)) return 'marked-cell-event'
  else if (date.getDay() > 0 && date.getDay() < 5 && !dateIsDone(date)) return 'marked-cell'
  return ''
}

// Sort by
</script>

<template>
  <admin-page-layout title="Docházka">
    <div class="row">
      <div class="col">
        <VueDatePicker v-if="doneDates.length > 0" v-model="currentDate" locale="cs" inline auto-apply
                       :enable-time-picker="false"
                       :month-change-on-scroll="false"
                       :day-class="getDayClass"
                       :start-time="{ hours: 0, minutes: 0 }"/>

        <!-- :disabled-week-days="[5, 6, 0]" -->

        <p><badge :type="whoDay" /> {{ day > 0 && day < 5 ? "schůzka" : ""}} {{ czechDayString }}</p>

        <button class="btn btn-secondary">{{ currentDateIsDone ? "Zobrazit" : "Založit"}} docházku pro schůzku</button>
      </div>

      <div class="col">

      </div>
    </div>
  </admin-page-layout>
</template>

<style>
  .marked-cell:not(.dp__active_date) {
    background: orange;
  }
  .marked-cell-event:not(.dp__active_date) {
    background: violet;
  }
</style>
