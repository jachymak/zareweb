import { computed, onMounted, onUnmounted, ref } from 'vue'
import { subscribeWaitlist } from '@/services/waitlist'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import { gradeSchoolYear, pragueToday } from '@shared/schoolYear'
import { toRows, waitlistStats } from '@/components/waitlistAdmin/waitlistRows'

// Data of the leaders' waiting list (SPEC §4.6): active entries followed live
// and the last reset date, which sets the school year of the grades.
export function useWaitlistAdmin() {
  const settings = usePublicSettingsStore()
  const today = pragueToday()

  const loading = ref(true)
  const loadError = ref(false)
  const entries = ref([])

  let unsubscribe = null
  let left = false
  onUnmounted(() => {
    left = true
    unsubscribe?.()
  })

  function failed(e) {
    if (left) return
    console.error('Loading the waiting list failed', e)
    loadError.value = true
    loading.value = false
  }

  onMounted(async () => {
    try {
      await Promise.all([
        settings.load(),
        new Promise((resolve, reject) => {
          unsubscribe = subscribeWaitlist(
            'active',
            (list) => {
              entries.value = list
              resolve()
            },
            (e) => {
              reject(e)
              failed(e)
            },
          )
        }),
      ])
      loading.value = false
    } catch (e) {
      failed(e)
    }
  })

  const lastReset = computed(() => settings.settings?.lastWaitlistReset ?? null)
  const schoolYear = computed(() => gradeSchoolYear(lastReset.value, today))
  const rows = computed(() =>
    toRows(entries.value, { today, schoolYear: schoolYear.value, lastReset: lastReset.value }),
  )
  const stats = computed(() => waitlistStats(rows.value))

  // After a reset: the new date (the entries leave the list by themselves).
  function resetDone(date) {
    settings.settings = { ...settings.settings, lastWaitlistReset: date }
  }

  return { today, loading, loadError, rows, stats, lastReset, schoolYear, resetDone }
}
