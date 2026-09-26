import { ref } from 'vue'
import { defineStore } from 'pinia'
import { subscribeMeetingSettings } from '@/services/settings'
import { meetingSchedule } from '@shared/meetingDays'

// settings/meetings — meeting days, times and dates without meetings (SPEC §4.8
// Meetings), followed live. Defaults apply until (or unless) it loads.
export const useMeetingScheduleStore = defineStore('meetingSchedule', () => {
  const schedule = ref(meetingSchedule(null))
  let ready = null

  // Starts following the settings once; resolves with the first snapshot.
  function load() {
    ready ??= new Promise((resolve) => {
      subscribeMeetingSettings(
        (data) => {
          schedule.value = meetingSchedule(data)
          resolve()
        },
        (e) => {
          console.error('Failed to load settings/meetings', e)
          ready = null // allow a retry
          resolve()
        },
      )
    })
    return ready
  }

  return { schedule, load }
})
