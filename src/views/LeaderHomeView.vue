<script setup>
import { useLeaderHome } from '@/composables/useLeaderHome'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderGreeting from '@/components/leader/LeaderGreeting.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import TodayCard from '@/components/leader/TodayCard.vue'
import TroopAttendance from '@/components/leader/TroopAttendance.vue'
import UpcomingEvents from '@/components/leader/UpcomingEvents.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Leader home — SPEC §4.1.
const {
  today,
  loading,
  loadError,
  person,
  troop,
  settings,
  todayPlan,
  upcomingEvents,
  troopStats,
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
        <LeaderGreeting :person="person" :today="today" />
      </div>

      <div :class="section" class="pt-[22px]">
        <TodayCard :plan="todayPlan" :troop="troop" :today="today" />
      </div>

      <div :class="section" class="pt-8">
        <UpcomingEvents :items="upcomingEvents" :troop="troop" />
      </div>

      <div class="mt-[34px] border-y-2 border-[#e0d3af] bg-[#f6efdc]">
        <div :class="section" class="pt-7 pb-[34px]">
          <TroopAttendance :troop="troop" :stats="troopStats" :settings="settings" />
        </div>
      </div>
    </template>
  </main>
  <AreaFooter>
    <p class="m-0 text-[14.5px] text-muted-2">vedoucovská část — vidí ji jen tým</p>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci/nahled" class="inline-block py-1">
        náhled rodičovské stránky →
      </RouterLink>
    </p>
  </AreaFooter>
</template>
