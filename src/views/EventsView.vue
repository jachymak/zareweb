<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useEventsPage } from '@/composables/useEventsPage'
import AreaFooter from '@/components/AreaFooter.vue'
import EventDetail from '@/components/events/EventDetail.vue'
import EventForm from '@/components/events/EventForm.vue'
import EventList from '@/components/events/EventList.vue'
import { UNSAVED_CONFIRM } from '@/components/events/eventsText'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Events & posters — SPEC §4.3. What is shown on the right lives in the URL:
// ?akce={id} (detail and poster editor), ?akce={id}&upravit (edit details),
// ?nova (new event).
const route = useRoute()
const router = useRouter()
const { today, loading, loadError, events, leaders, members, templates, organizersOf, person } =
  useEventsPage()

const selectedId = computed(() => route.query.akce ?? null)
const creating = computed(() => 'nova' in route.query)
const editing = computed(() => !!selectedId.value && 'upravit' in route.query)
const selected = computed(() => events.value.find((e) => e.id === selectedId.value) ?? null)

// Unsaved poster changes: ask before switching away.
const dirty = ref(false)
const leaveOk = () => !dirty.value || window.confirm(UNSAVED_CONFIRM)
onBeforeRouteUpdate((to) => {
  if (to.query.akce === route.query.akce && !('upravit' in to.query)) return true
  if (!leaveOk()) return false
  dirty.value = false
})
onBeforeRouteLeave(() => leaveOk())
const beforeUnload = (e) => dirty.value && e.preventDefault()
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

const show = (query) => router.push({ query })

// The selected event was deleted (here or by another leader): close it.
watch(selected, (now, before) => {
  if (before && !now && selectedId.value === before.id) {
    dirty.value = false
    router.replace({ query: {} })
  }
})
const select = (id) => show({ akce: id })

// On narrow screens the detail is below the list — bring it into view.
const detail = ref(null)
watch([selectedId, creating, editing], async () => {
  await nextTick()
  const top = detail.value?.getBoundingClientRect().top
  if (top !== undefined && top > window.innerHeight * 0.6) {
    detail.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})

const section = 'mx-auto max-w-[1060px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1"
          >← zpět na vedoucovskou stránku</RouterLink
        >
      </p>
      <p class="kicker m-0 -mb-0.5">co přidat do výpravníku</p>
      <h1 class="m-0 mb-5 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
        Akce a plakátky
      </h1>
    </div>

    <p v-if="loading" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="text-red">{{ LOAD_ERROR }}</p>
    <div v-else :class="section" class="flex flex-wrap items-start gap-x-9 gap-y-[26px]">
      <EventList
        class="min-w-0 flex-[1_1_280px] md:max-w-[340px]"
        :events="events"
        :selected-id="creating ? null : selectedId"
        :creating="creating"
        :today="today"
        :organizers-of="organizersOf"
        @select="select"
        @create="show({ nova: null })"
      />
      <div ref="detail" class="min-w-0 flex-[1_1_440px] scroll-mt-4">
        <EventForm
          v-if="creating || (editing && selected)"
          :key="creating ? 'new' : `edit-${selectedId}`"
          :event="creating ? null : selected"
          :leaders="leaders"
          :today="today"
          :default-organizer-id="person?.id ?? null"
          @saved="select"
          @cancel="creating ? show({}) : select(selectedId)"
        />
        <EventDetail
          v-else-if="selected"
          v-model:dirty="dirty"
          :event="selected"
          :organizers="organizersOf(selected)"
          :members="members"
          :templates="templates"
          :today="today"
          @edit="show({ akce: selectedId, upravit: null })"
        />
        <p v-else-if="selectedId" class="m-0 pt-2 text-[16px] text-muted">
          Tahle akce už neexistuje — možná ji někdo smazal.
        </p>
        <p v-else class="m-0 pt-2 font-hand text-[23px] text-brown">
          vyber akci vlevo, nebo přidej novou
        </p>
      </div>
    </div>
  </main>
  <AreaFooter>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >zpět na vedoucovskou stránku →</RouterLink
      >
    </p>
  </AreaFooter>
</template>
