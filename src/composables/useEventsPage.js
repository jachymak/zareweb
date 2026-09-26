import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { subscribeEvents } from '@/services/events'
import { listMembers } from '@/services/members'
import { listPackingTemplates } from '@/services/packingTemplates'
import { listLeaders } from '@/services/skautisPeople'
import { useLeaderTroopStore } from '@/stores/leaderTroop'

const byNickname = (a, b) =>
  (a.nickname || a.firstName).localeCompare(b.nickname || b.firstName, 'cs')

// Data of the events & posters page (SPEC §4.3): the school year's events
// (followed live, so leaders see each other's changes), leaders to pick as
// organizers, children for sign-ups and packing list templates.
export function useEventsPage() {
  const today = pragueToday()
  const schoolYear = schoolYearRange(today)
  const leaderTroop = useLeaderTroopStore()

  const loading = ref(true)
  const loadError = ref(false)
  const events = ref([])
  const leaders = ref([]) // skautisPeople, active, by nickname
  const members = ref([]) // active children, by nickname
  const templates = ref([])

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
      const [, people, memberList, templateList] = await Promise.all([
        leaderTroop.init(),
        listLeaders(),
        listMembers(),
        listPackingTemplates(),
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
      leaders.value = people.sort((a, b) => a.nickname.localeCompare(b.nickname, 'cs'))
      members.value = memberList.sort(byNickname)
      templates.value = templateList.sort((a, b) => a.name.localeCompare(b.name, 'cs'))
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
    members,
    templates,
    organizersOf,
    person: computed(() => leaderTroop.person),
  }
}
