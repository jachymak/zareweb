<script setup>
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAttendance } from '@/composables/useAttendance'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import LeaderPageTitle from '@/components/leader/LeaderPageTitle.vue'
import TroopAttendance from '@/components/leader/TroopAttendance.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Attendance overview — SPEC §4.2: meetings and trips of each child of the
// troop against the camp requirement. The troop lives in the URL (?oddil=vlc).
const route = useRoute()
const router = useRouter()
const a = reactive(useAttendance())

if (['vlc', 'ss'].includes(route.query.oddil)) a.troop = route.query.oddil
watch(
  () => a.troop,
  (troop) => router.replace({ query: { oddil: troop } }),
)

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-[22px]">
      <LeaderPageTitle v-model:troop="a.troop" kicker="jak na tom jsou" title="Přehled docházky" />
    </div>

    <p v-if="a.loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="a.loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else :class="section" class="pt-5">
      <TroopAttendance :stats="a.troopStats" :requirement="a.requirement" />
    </div>
  </main>
  <AreaFooter />
</template>
