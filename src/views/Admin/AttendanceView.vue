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
const {
  data,
  currentEventId,
  currentAttendance,
  dateIsDone,
  dateIsEvent,
  dateIsMeeting
} = storeToRefs(attendanceStore)
attendanceStore.setup()


const currentDateEvents = computed(() => {
  const date = startOfDay(currentDate.value)
  const events = data.value.filter(ev => ev.dates.some(d => isEqual(d, date)))
  if (events.length > 0) return events

  // weekend
  const day = date.getDay()
  if (day === 0 || day > 4) return []

  // meeting
  const who = (day === 1 || day === 4) ? 'v' : ( (day === 2 || day === 3) ? 's' : '' )

  const year = currentDate.value.getFullYear().toString()
  const month = (currentDate.value.getMonth() + 1).toString().length < 2 ?
      '0' + (currentDate.value.getMonth() + 1).toString() :
      (currentDate.value.getMonth() + 1).toString()
  const dayy = currentDate.value.getDate().toString().length < 2 ?
      '0' + currentDate.value.getDate().toString() :
      currentDate.value.getDate().toString()

  return [{
    id: year + '-' + month + '-' + dayy + '-' + who + '-schuzka',
    dates: [date],
    done: false,
    title: "Schůzka",
    who: who
  }]
})

const changeCurrentEventId = (eventId) => {
  currentEventId.value = eventId
}

const getDayClass = (date) => {
  if (attendanceStore.dateIsDone(date)) return ''
  else if (attendanceStore.dateIsEvent(date)) return 'marked-cell-event'
  else if (attendanceStore.dateIsMeeting(date)) return 'marked-cell-meeting'
  return ''
}

// Sort by
</script>

<template>
  <admin-page-layout title="Docházka">
    <div class="row">
      <div class="col">
        <VueDatePicker v-if="data.length > 0" v-model="currentDate" locale="cs" inline auto-apply
                       :enable-time-picker="false"
                       :month-change-on-scroll="false"
                       :day-class="getDayClass"
                       :start-time="{ hours: 0, minutes: 0 }"/>
        <div class="row my-3 align-items-center" v-for="ev in currentDateEvents">
          <div class="col-7">
            <badge :type="ev.who" /> {{ ev.title }}
          </div>
          <div class="col-5">
            <button class="btn btn-sm btn-secondary"
                    @click="changeCurrentEventId(ev.id)"
            >{{ ev.done ? "Zobrazit" : "Založit"}} docházku</button>

          </div>
        </div>


      </div>

      <div class="col">
        {{ currentEventId }}
        <br>
        {{ currentAttendance }}
      </div>
    </div>
  </admin-page-layout>
</template>

<style>
  .marked-cell-meeting:not(.dp__active_date) {
    background: orange;
  }
  .marked-cell-event:not(.dp__active_date) {
    background: violet;
  }
</style>
