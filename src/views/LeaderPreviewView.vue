<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listChildrenSeenWith, listMembers } from '@/services/members'
import { NO_CHILD } from '@/composables/useMemberPage'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import ParentHomeContent from '@/components/parent/ParentHomeContent.vue'
import PreviewBar from '@/components/parent/PreviewBar.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Parent preview — SPEC §4.7. The parent home exactly as the picked child's
// parent sees it (siblings included); sign-up clicks save nothing. The child
// is kept in the URL (`?dite=`), so a reload or a poster and back keeps it.
// With no child picked it shows a parent without children (both troops).
const route = useRoute()
const router = useRouter()

const members = ref([])
const loadError = ref(false)
onMounted(async () => {
  try {
    members.value = await listMembers()
  } catch (e) {
    console.error('Loading the children failed', e)
    loadError.value = true
  }
})

const childId = computed({
  get: () => (typeof route.query.dite === 'string' ? route.query.dite : ''),
  set: (dite) => router.replace({ query: dite ? { dite } : {} }),
})

const shown = ref([])
async function loadChildren() {
  const list = childId.value ? await listChildrenSeenWith(childId.value) : []
  shown.value = list.filter((c) => c.active)
  return list
}
</script>

<template>
  <PreviewBar v-model="childId" :members="members" :shown="shown" />
  <AreaHeader area="pro členy" />
  <p v-if="loadError" role="alert" class="mx-auto m-0 max-w-[960px] px-4 pt-6 text-red sm:px-6">
    {{ LOAD_ERROR }}
  </p>
  <ParentHomeContent
    :key="childId"
    :load-children="loadChildren"
    :preview-of="childId || NO_CHILD"
  />
  <AreaFooter />
</template>
