<script setup>
import { useLeaderHome } from '@/composables/useLeaderHome'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderGreeting from '@/components/leader/LeaderGreeting.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import TroopSwitch from '@/components/leader/TroopSwitch.vue'
import TodayCard from '@/components/leader/TodayCard.vue'
import UpcomingEvents from '@/components/leader/UpcomingEvents.vue'
import EventCalendar from '@/components/parent/EventCalendar.vue'
import LeaderContacts from '@/components/parent/LeaderContacts.vue'
import NewsSection from '@/components/parent/NewsSection.vue'
import PhotoAlbums from '@/components/parent/PhotoAlbums.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Leader home — SPEC §4.1.
const {
  today,
  loading,
  loadError,
  person,
  troop,
  todayPlan,
  meetingTime,
  upcomingEvents,
  events,
  news,
  albums,
  albumOf,
  leaderContacts,
  organizersOf,
  participantOf,
} = useLeaderHome()

const section = 'mx-auto max-w-[1000px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <p v-if="loading" :class="section" class="pt-10 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="pt-10 text-red">
      {{ LOAD_ERROR }}
    </p>
    <template v-else>
      <div :class="section" class="pt-7">
        <LeaderGreeting :person="person" :today="today">
          <TroopSwitch v-model="troop" />
        </LeaderGreeting>
      </div>

      <div :class="section" class="pt-[22px]">
        <TodayCard :plan="todayPlan" :troop="troop" :today="today" :meeting-time="meetingTime" />
      </div>

      <div :class="section" class="pt-8">
        <UpcomingEvents :items="upcomingEvents" :troop="troop" :today="today" />
      </div>

      <div :class="section" class="pt-9">
        <NewsSection :news="news" />
      </div>

      <div :class="section" class="pt-10">
        <PhotoAlbums :albums="albums" :today="today" />
      </div>

      <!-- Folded sections, one row each between lines. -->
      <div :class="section" class="pt-[42px]">
        <div class="border-b-[1.5px] border-line-soft">
          <EventCalendar
            :events="events"
            :children="[]"
            :troops="['vlc', 'ss']"
            :today="today"
            :organizers-of="organizersOf"
            :participant-of="participantOf"
            :album-of="albumOf"
            folded
            class="has-[[aria-expanded=true]]:pb-8"
          />
          <LeaderContacts
            :contacts="leaderContacts"
            :initial-group="person?.troop === 'ss' ? 'ss' : 'vlc'"
            folded
            class="has-[[aria-expanded=true]]:pb-8"
          />
        </div>
      </div>
    </template>
  </main>
  <AreaFooter />
</template>
