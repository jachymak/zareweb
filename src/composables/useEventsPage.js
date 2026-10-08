import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { subscribeEvents } from '@/services/events'
import { listLeaders } from '@/services/skautisPeople'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { nicknameOf } from '@shared/names'

const byNickname = (a, b) => nicknameOf(a).localeCompare(nicknameOf(b), 'cs')

// Data of the výpravník page (SPEC §4.3): the school year's events (followed
// live, so leaders see each other's changes) and leaders to pick as organizers.
export function useEventsPage() {
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)
  const leaderTroop = useLeaderTroopStore()

  const loading = ref(true)
  const loadError = ref(false)
  const events = ref([])
  const leaders = ref([]) // skautisPeople, active, by nickname

  let unsubscribe = null
  let left = false
  onUnmounted(() => {
    left = true
    unsubscribe?.()
  })

  function failed(e) {
    if (left) return
    console.error('Loading events failed', e)
    loadError.value = true
    loading.value = false
  }

  onMounted(async () => {
    try {
      const [, people] = await Promise.all([
        leaderTroop.init(),
        listLeaders(),
        new Promise((resolve, reject) => {
          unsubscribe = subscribeEvents(
            { fromDate: schoolYear.from },
            (list) => {
              events.value = list
              resolve()
            },
            reject,
          )
        }),
      ])
      leaders.value = people.sort(byNickname)
      loading.value = false
    } catch (e) {
      failed(e)
    }
  })

  const leaderById = computed(() => Object.fromEntries(leaders.value.map((p) => [p.id, p])))
  const organizersOf = (event) =>
    (event.organizerIds ?? []).map((id) => leaderById.value[id]).filter(Boolean)

  return {
    today,
    loading,
    loadError,
    events,
    leaders,
    organizersOf,
    person: computed(() => leaderTroop.person),
  }
}
