import { onMounted, onUnmounted, ref } from 'vue'
import { setDevice, startManual, stopManual, subscribeClubhouse } from '@/services/clubhouse'

// Data of the clubhouse page (SPEC §4.5): readings, mode and devices followed
// live, plus a clock for the remaining manual time. Only the newest log
// entries — the full log belongs to Administration.
const LOG_PREVIEW = 5

export function useClubhouse() {
  const loading = ref(true)
  const saveError = ref(false)
  const clubhouse = ref(null)
  const now = ref(Date.now())

  let unsubscribe = null
  let clock = null
  onMounted(() => {
    unsubscribe = subscribeClubhouse(
      (state) => {
        clubhouse.value = state
        loading.value = false
      },
      { logLimit: LOG_PREVIEW },
    )
    clock = setInterval(() => (now.value = Date.now()), 15 * 1000)
  })
  onUnmounted(() => {
    unsubscribe?.()
    clearInterval(clock)
  })

  async function run(action) {
    saveError.value = false
    try {
      await action()
      now.value = Date.now()
    } catch (e) {
      console.error('Clubhouse change failed', e)
      saveError.value = true
    }
  }

  return {
    loading,
    saveError,
    clubhouse,
    now,
    toManual: (hours) => run(() => startManual(hours)),
    toAuto: () => run(stopManual),
    changeDevice: (id, fields) => run(() => setDevice(id, fields)),
  }
}
