import { computed, onMounted, onUnmounted, ref } from 'vue'
import { subscribeNews } from '@/services/news'
import { useAuthStore } from '@/stores/auth'
import { useLeaderTroopStore } from '@/stores/leaderTroop'

// Data of the leaders' news page (SPEC §4.4): all news incl. withdrawn, followed
// live (leaders see each other's changes), and the name to sign new news with —
// the leader's nickname from skautIS.
export function useNewsPage() {
  const auth = useAuthStore()
  const leaderTroop = useLeaderTroopStore()

  const loading = ref(true)
  const loadError = ref(false)
  const news = ref([])

  let unsubscribe = null
  let left = false
  onUnmounted(() => {
    left = true
    unsubscribe?.()
  })

  function failed(e) {
    if (left) return
    console.error('Loading news failed', e)
    loadError.value = true
    loading.value = false
  }

  onMounted(async () => {
    try {
      await Promise.all([
        leaderTroop.init(),
        new Promise((resolve, reject) => {
          unsubscribe = subscribeNews(
            (list) => {
              news.value = list
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

  const authorName = computed(
    () =>
      leaderTroop.person?.nickname ||
      auth.profile?.displayName ||
      auth.user?.email?.split('@')[0] ||
      '',
  )

  return { loading, loadError, news, authorName }
}
