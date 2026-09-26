<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getEvent, getPoster } from '@/services/events'
import { getPerson } from '@/services/skautisPeople'
import AreaHeader from '@/components/AreaHeader.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import PackingChecklist from '@/components/poster/PackingChecklist.vue'
import PosterDetails from '@/components/poster/PosterDetails.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Event poster — SPEC §3.2. Parents see published posters only; leaders see
// every poster, unpublished ones marked as a preview.
const props = defineProps({
  eventId: { type: String, required: true },
})

const auth = useAuthStore()
const isLeader = computed(() => ['leader', 'admin'].includes(auth.role))

// loading | ready | notFound | noPoster | notPublished | error
const status = ref('loading')
const event = ref(null)
const poster = ref(null)
const organizers = ref([])

async function load(eventId) {
  status.value = 'loading'
  try {
    // Parents may not read deleted events at all.
    event.value = await getEvent(eventId).catch((e) => {
      if (e.code === 'permission-denied') return null
      throw e
    })
    if (!event.value || event.value.deleted) return (status.value = 'notFound')
    if (event.value.posterStatus === 'none') return (status.value = 'noPoster')
    if (event.value.posterStatus !== 'published' && !isLeader.value) {
      return (status.value = 'notPublished')
    }
    const [content, people] = await Promise.all([
      getPoster(eventId),
      Promise.all((event.value.organizerIds ?? []).map(getPerson)),
    ])
    organizers.value = people.filter(Boolean)
    poster.value = content ?? {}
    status.value = 'ready'
  } catch (e) {
    console.error('Loading the poster failed', e)
    status.value = 'error'
  }
}
watch(() => props.eventId, load, { immediate: true })

const preview = computed(() => event.value?.posterStatus !== 'published')
const organizer = computed(() => organizers.value[0])
const back = computed(() =>
  isLeader.value
    ? { to: '/vedouci', label: 'zpět na vedoucovskou stránku' }
    : { to: { name: 'parent-home', hash: '#vypravnik' }, label: 'zpět do výpravníku' },
)

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <AreaHeader :area="isLeader ? 'pro vedoucí' : 'pro členy'" />
  <main class="pb-12">
    <p :class="section" class="m-0 pt-[22px] text-[15px]">
      <RouterLink :to="back.to" class="inline-block py-1">← {{ back.label }}</RouterLink>
    </p>

    <p v-if="status === 'loading'" :class="section" class="pt-10 font-hand text-2xl text-muted">
      načítám…
    </p>
    <p v-else-if="status === 'error'" role="alert" :class="section" class="pt-10 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else-if="status !== 'ready'" :class="section" class="pt-10">
      <h1 class="m-0 mb-2 text-[28px] font-medium tracking-[-0.03em] text-ink">
        {{ status === 'notFound' ? 'Tuhle akci jsme nenašli' : event.title }}
      </h1>
      <p class="m-0 font-hand text-[24px] text-muted">
        <template v-if="status === 'notFound'">možná ji vedoucí mezitím smazali</template>
        <template v-else-if="status === 'noPoster'">k téhle akci plakátek není</template>
        <template v-else>
          plakátek se ještě chystá — až ho vedoucí zveřejní, najdete ho tady
        </template>
      </p>
    </div>

    <template v-else>
      <div class="mt-5 bg-[#f0e6d2]">
        <div :class="section" class="pt-6 pb-[46px] sm:pt-10">
          <p v-if="event.cancelled" role="status" class="note-warm mb-5 text-[16px] font-medium">
            Akce je zrušená.
          </p>
          <p
            v-if="isLeader && preview"
            role="status"
            class="mb-5 rounded-[10px] border-[1.5px] border-dashed border-line-strong px-3 py-2 text-[15px] text-brown"
          >
            Náhled — rodiče tenhle plakátek zatím nevidí.
          </p>
          <div class="flex flex-wrap items-start gap-x-11 gap-y-8">
            <PosterDetails
              :event="event"
              :poster="poster"
              :organizers="organizers"
              class="min-w-0 flex-[1_1_380px]"
            />
            <HandDrawnBox
              v-if="poster.packingItems?.length"
              stroke="#8a7b5e"
              class="min-w-0 flex-[1_1_300px] px-5 pt-5 pb-6 sm:px-[26px]"
            >
              <PackingChecklist :event-id="event.id" :items="poster.packingItems" />
            </HandDrawnBox>
          </div>
        </div>
      </div>

      <div :class="section" class="flex flex-wrap items-center gap-x-6 gap-y-3.5 pt-[26px]">
        <p v-if="organizer" class="m-0 text-[15.5px] text-muted">
          Něco není jasné? Ozvěte se organizátorovi — {{ organizer.nickname || organizer.name }}
          <template v-if="organizer.phone || organizer.email">
            (<a v-if="organizer.phone" :href="`tel:${organizer.phone.replace(/\s+/g, '')}`">{{
              organizer.phone
            }}</a
            ><template v-if="organizer.phone && organizer.email">, </template
            ><a v-if="organizer.email" :href="`mailto:${organizer.email}`">{{ organizer.email }}</a
            >).
          </template>
        </p>
        <p class="m-0 text-[15px] sm:ml-auto">
          <RouterLink :to="back.to" class="inline-block py-1">{{ back.label }} →</RouterLink>
        </p>
      </div>
    </template>
  </main>
</template>
