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
const { data, currentEventId } = storeToRefs(attendanceStore)
attendanceStore.setup()


const dateIsDone = (date) => {
  return data.value.some(ev => ev.dates.some(d => isEqual(d, date) && ev.done))
}

const dateIsEvent = (date) => {
  return data.value.some(ev => ev.dates.some(d => isEqual(d, date)))
}

const dateIsMeeting = (date) => {
  return date.getDay() > 0 && date.getDay() < 5
}

const currentDateEvents = computed(() => {
  const date = startOfDay(currentDate.value)
  const events = data.value.filter(ev => ev.dates.some(d => isEqual(d, date)))
  if (events.length > 0) return events

  // weekend
  const day = date.getDay()
  if (day === 0 || day > 4) return []

  // meeting
  const czechDays = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
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
    title: "Schůzka " + czechDays[day],
    who: who
  }]
})

const changeCurrentEventId = (eventId, date) => {
  currentEventId.value = eventId
  attendanceStore.createAttendanceMeeting(eventId, date)
}

const getDayClass = (date) => {
  if (dateIsDone(date)) return ''
  else if (dateIsEvent(date)) return 'marked-cell-event'
  else if (dateIsMeeting(date)) return 'marked-cell-meeting'
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
                    @click="changeCurrentEventId(ev.id, ev.dates[0])"
            >{{ ev.done ? "Zobrazit" : "Založit"}} docházku</button>

          </div>
        </div>


      </div>

      <div class="col">
        {{ currentEventId }}
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
