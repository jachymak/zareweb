import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { listChildrenOfParent, listChildrenSeenWith } from '@/services/members'

// `?nahled=` value of the preview of a parent without children (no child picked).
export const NO_CHILD = 'bez-deti'

// The leaders' parent preview page showing the given child's parent (or NO_CHILD).
export const previewHome = (previewOf) => ({
  name: 'leader-preview',
  query: previewOf === NO_CHILD ? {} : { dite: previewOf },
})

// A parent-area page that leaders can open too: from the parent preview
// (`?nahled=<memberId>`, SPEC §4.7) it looks exactly as for that child's
// parent, otherwise leaders get their own header. `keep` is the query that
// links within the parent area carry along.
export function useMemberPage() {
  const auth = useAuthStore()
  const route = useRoute()
  const leader = computed(() => ['leader', 'admin'].includes(auth.role))
  const previewOf = computed(() =>
    leader.value && typeof route.query.nahled === 'string' ? route.query.nahled : '',
  )
  const isLeader = computed(() => leader.value && !previewOf.value)
  const keep = computed(() => (previewOf.value ? { nahled: previewOf.value } : {}))
  const home = computed(() => {
    if (previewOf.value) return previewHome(previewOf.value)
    return isLeader.value ? { name: 'leader-albums' } : { name: 'parent-home' }
  })

  // Troops of the children whose parent the page is shown to ([] for leaders).
  async function loadTroops() {
    if (isLeader.value || previewOf.value === NO_CHILD) return []
    const children = previewOf.value
      ? await listChildrenSeenWith(previewOf.value)
      : await listChildrenOfParent(auth.user.uid)
    return [...new Set(children.filter((c) => c.active).map((c) => c.troop))]
  }

  return { previewOf, isLeader, keep, home, loadTroops }
}
