<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AUDIENCES, WEEKDAY_NAMES } from '@/constants/troops'
import { setMeetingDay, subscribeMembers } from '@/services/members'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'
import TroopSwitch from '@/components/leader/TroopSwitch.vue'
import { plural } from '@/components/parent/parentText'
import { childName } from './accounts'

// „Děti“ — SPEC §4.8 Children: the imported children of the troop chosen in
// the switch (shared with the other leader pages); a click on one
// of the troop's days sets the child's meeting day (saved at once). Children
// without a valid day are in no meeting's attendance, so they are highlighted.
defineEmits(['open-tab'])

const leaderTroop = useLeaderTroopStore()
const troop = computed({
  get: () => leaderTroop.troop,
  set: (value) => (leaderTroop.troop = value),
})
const otherTroop = computed(() => (troop.value === 'vlc' ? 'ss' : 'vlc'))
const scheduleStore = useMeetingScheduleStore()
const { schedule } = storeToRefs(scheduleStore)

const members = ref(null)
const loadError = ref('')
let unsubscribe = null
onMounted(() => {
  scheduleStore.load()
  leaderTroop.init()
  unsubscribe = subscribeMembers(
    (list) => (members.value = list.filter((m) => m.active)),
    (e) => {
      console.error('Loading members failed', e)
      loadError.value = 'Děti se nepodařilo načíst. Zkus stránku obnovit.'
    },
  )
})
onUnmounted(() => unsubscribe?.())

const hasValidDay = (m) => schedule.value[m.troop]?.days.includes(m.meetingDay)
const ofTroop = (code) => (members.value ?? []).filter((m) => m.troop === code)
const missingIn = (code) => ofTroop(code).filter((m) => !hasValidDay(m))
const missing = computed(() => missingIn(troop.value))
const missingOther = computed(() => missingIn(otherTroop.value))
const onlyMissing = ref(false)

const byNickname = (a, b) =>
  (a.nickname || a.firstName).localeCompare(b.nickname || b.firstName, 'cs')

const days = computed(() => schedule.value[troop.value].days)
const counts = computed(() =>
  days.value.map((d) => ofTroop(troop.value).filter((m) => m.meetingDay === d).length),
)
const children = computed(() =>
  ofTroop(troop.value)
    .filter((m) => !onlyMissing.value || !hasValidDay(m))
    .sort(byNickname),
)

// ---- saving (each click at once; the live list brings the saved state) ----

const busyId = ref(null)
const errorId = ref(null)

// A click on the chosen day clears it.
async function pick(member, day) {
  busyId.value = member.id
  errorId.value = null
  try {
    await setMeetingDay(member.id, member.meetingDay === day ? null : day)
  } catch (e) {
    console.error('Setting the meeting day failed', e)
    errorId.value = member.id
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <section aria-labelledby="children-title">
    <div class="mb-4 flex flex-wrap items-start gap-x-5 gap-y-3">
      <h2 id="children-title" class="sr-only">Děti</h2>
      <p class="m-0 max-w-[70ch] flex-[1_1_320px] text-[15.5px] leading-normal text-muted">
        Každé dítě chodí na jednu schůzku týdně. Klikni na jeho den — uloží se hned; dalším
        kliknutím na vybraný den ho zrušíš. Dítě bez dne není v docházce žádné schůzky. Dny oddílů
        se mění v záložce
        <button
          type="button"
          class="btn-link py-0 text-[15.5px]"
          @click="$emit('open-tab', 'schuzky')"
        >
          schůzky</button
        >.
      </p>
      <TroopSwitch v-model="troop" class="sm:ml-auto" />
    </div>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="!members" class="font-hand text-2xl text-muted">načítám děti…</p>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p
          v-if="missing.length"
          class="m-0 text-[15.5px] font-medium text-red"
          data-testid="missing-count"
        >
          {{ missing.length }}
          {{ plural(missing.length, 'dítě nemá', 'děti nemají', 'dětí nemá') }} den schůzek
        </p>
        <p v-else class="m-0 text-[15.5px] text-green" data-testid="missing-count">
          Všechny děti mají den schůzek ✓
        </p>
        <button
          v-if="missing.length || onlyMissing"
          type="button"
          :aria-pressed="onlyMissing"
          class="cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[15px]"
          :class="
            onlyMissing
              ? 'border-ink bg-ink text-cream'
              : 'border-line bg-transparent text-text hover:border-ink'
          "
          @click="onlyMissing = !onlyMissing"
        >
          jen bez dne
        </button>
        <button
          v-if="missingOther.length"
          type="button"
          class="btn-link text-[14.5px]"
          data-testid="missing-other"
          @click="troop = otherTroop"
        >
          {{ AUDIENCES[otherTroop].name }}: {{ missingOther.length }} bez dne →
        </button>
        <span class="text-[14.5px] text-muted-2 sm:ml-auto" data-testid="day-counts">
          <template v-for="(day, i) in days" :key="day">
            {{ i ? ' · ' : '' }}{{ WEEKDAY_NAMES[day] }} {{ counts[i] }}
          </template>
        </span>
      </div>

      <section :aria-label="`Děti — ${AUDIENCES[troop].name}`" :data-testid="`children-${troop}`">
        <ul v-if="children.length" class="m-0 flex list-none flex-col gap-1.5 p-0">
          <li
            v-for="m in children"
            :key="m.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[3px] border-[1.5px] bg-paper px-3.5 py-2"
            :class="hasValidDay(m) ? 'border-[#e2d9c2]' : 'border-red bg-red-light/40'"
            :aria-busy="busyId === m.id"
            :data-testid="`child-${m.id}`"
          >
            <span class="min-w-0 flex-[1_1_180px]">
              <b class="mr-1.5 font-hand text-[20px] font-bold text-ink">
                {{ m.nickname || m.firstName }}
              </b>
              <span class="text-[14.5px] text-[#8a7b5e]">{{ childName(m) }}</span>
              <span
                v-if="!hasValidDay(m)"
                class="block text-[13.5px] text-red"
                data-testid="no-day"
              >
                {{
                  m.meetingDay
                    ? `den ${WEEKDAY_NAMES[m.meetingDay] ?? m.meetingDay} už oddíl nemá`
                    : 'nemá den schůzek'
                }}
              </span>
              <span v-if="errorId === m.id" role="alert" class="block text-[13.5px] text-red">
                Nepovedlo se to uložit. Zkus to znovu.
              </span>
            </span>
            <span class="flex gap-1.5" role="group" :aria-label="`Den schůzek — ${childName(m)}`">
              <button
                v-for="day in days"
                :key="day"
                type="button"
                :aria-pressed="m.meetingDay === day"
                :title="m.meetingDay === day ? 'kliknutím den zrušíš' : undefined"
                :disabled="busyId === m.id"
                class="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[14.5px] disabled:cursor-wait"
                :class="
                  m.meetingDay === day
                    ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
                    : 'border-line bg-transparent text-muted hover:border-ink'
                "
                @click="pick(m, day)"
              >
                {{ WEEKDAY_NAMES[day] }}
              </button>
            </span>
          </li>
        </ul>
        <p v-else class="m-0 text-[15px] text-muted">
          {{ onlyMissing ? 'Tady mají všichni den schůzek.' : 'Žádné děti.' }}
        </p>
      </section>
    </template>
  </section>
</template>
