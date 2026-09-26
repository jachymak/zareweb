<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listChildrenSeenWith, listMembers } from '@/services/members'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import ParentHomeContent from '@/components/parent/ParentHomeContent.vue'
import PreviewBar from '@/components/parent/PreviewBar.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Parent preview — SPEC §4.7. The parent home exactly as the picked child's
// parent sees it (siblings included); sign-up clicks save nothing. The child
// is kept in the URL (`?dite=`), so a reload or a poster and back keeps it.
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
  set: (dite) => router.replace({ query: { dite } }),
})

const shown = ref([])
async function loadChildren() {
  const list = await listChildrenSeenWith(childId.value)
  shown.value = list.filter((c) => c.active)
  return list
}
</script>

<template>
  <PreviewBar v-model="childId" :members="members" :shown="shown" />
  <AreaHeader area="pro členy" />
  <ParentHomeContent
    v-if="childId"
    :key="childId"
    :load-children="loadChildren"
    :preview-of="childId"
  />
  <main v-else class="mx-auto max-w-[960px] px-4 pt-10 sm:px-6">
    <p v-if="loadError" role="alert" class="m-0 text-red">{{ LOAD_ERROR }}</p>
    <p v-else class="m-0 font-hand text-2xl text-muted">
      nahoře vyber dítě — uvidíš stránku tak, jak ji vidí jeho rodič
    </p>
  </main>
  <AreaFooter />
</template>
