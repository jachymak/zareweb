<script setup>
import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { listChildrenOfParent } from '@/services/members'
import { useParentArea } from '@/composables/useParentArea'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import ChildCards from '@/components/parent/ChildCards.vue'
import EventCalendar from '@/components/parent/EventCalendar.vue'
import LeaderContacts from '@/components/parent/LeaderContacts.vue'
import NewsSection from '@/components/parent/NewsSection.vue'
import ParentGreeting from '@/components/parent/ParentGreeting.vue'
import PhotoAlbums from '@/components/parent/PhotoAlbums.vue'
import SignUpSection from '@/components/parent/SignUpSection.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Parent home — SPEC §3.1. Shows only the signed-in parent's children.
const auth = useAuthStore()
const area = useParentArea(() => listChildrenOfParent(auth.user.uid))
const {
  today,
  loading,
  loadError,
  children,
  troops,
  settings,
  events,
  relevantNews,
  signUpEvents,
  nearestEvent,
  childStats,
  leaderContacts,
  organizersOf,
  participantOf,
  saving,
  signUpErrors,
  toggleSignUp,
} = area

// Scroll to the anchor (e.g. #vypravnik from the poster) once the page has content.
const route = useRoute()
watch(loading, async (isLoading) => {
  if (isLoading || !route.hash) return
  await nextTick()
  document.querySelector(route.hash)?.scrollIntoView()
})

const section = 'mx-auto max-w-[960px] px-4 sm:px-6'
</script>

<template>
  <AreaHeader area="pro členy" />
  <main>
    <p v-if="loading" :class="section" class="pt-10 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="pt-10 text-red">
      {{ LOAD_ERROR }}
    </p>
    <template v-else>
      <div :class="section" class="pt-[30px]">
        <ParentGreeting :today="today" :nearest-event="nearestEvent" />
      </div>

      <div :class="section" class="pt-[22px]">
        <ChildCards v-if="children.length" :stats="childStats" :settings="settings" />
        <p v-else class="m-0 text-[16px] text-muted">
          K účtu zatím nemáte přiřazené žádné dítě. Správce oddílu to brzy napraví.
        </p>
      </div>

      <div :class="section" class="pt-[30px]">
        <svg
          viewBox="0 0 900 34"
          preserveAspectRatio="none"
          class="block h-[34px] w-full"
          fill="none"
          stroke="var(--color-trail)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-dasharray="2 12"
          aria-hidden="true"
        >
          <path
            d="M20 24 C200 6 380 30 560 16 C700 5 810 26 884 12"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div :class="section" class="pt-2">
        <NewsSection :news="relevantNews" />
      </div>

      <div class="mt-9 border-y-2 border-[#e0d3af] bg-[#f6efdc]">
        <div :class="section" class="pt-[30px] pb-[38px]">
          <SignUpSection
            :events="signUpEvents"
            :children="children"
            :today="today"
            :organizers-of="organizersOf"
            :participant-of="participantOf"
            :saving="saving"
            :errors="signUpErrors"
            @toggle="toggleSignUp"
          />
        </div>
      </div>

      <div id="vypravnik" :class="section" class="pt-[34px]">
        <EventCalendar
          :events="events"
          :children="children"
          :troops="troops"
          :today="today"
          :organizers-of="organizersOf"
          :participant-of="participantOf"
        />
      </div>

      <div :class="section" class="pt-10">
        <PhotoAlbums />
      </div>

      <div :class="section" class="pt-[42px]">
        <LeaderContacts :contacts="leaderContacts" :initial-group="troops[0] ?? 'vlc'" />
      </div>
    </template>
  </main>
  <AreaFooter />
</template>
