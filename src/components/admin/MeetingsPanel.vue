<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { pragueToday, schoolYearRange } from '@shared/schoolYear'
import { meetingTimeLong, MEETING_WEEKDAYS, sortWeekdays } from '@shared/meetingDays'
import { AUDIENCES, TROOPS, WEEKDAY_NAMES } from '@/constants/troops'
import { useSaveState } from '@/composables/useSaveState'
import { subscribeMembers } from '@/services/members'
import { updateMeetingSettings } from '@/services/settings'
import { useMeetingScheduleStore } from '@/stores/meetingSchedule'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatRange, plural } from '@/components/parent/parentText'
import CollapsibleSection from './CollapsibleSection.vue'
import SaveBar from './SaveBar.vue'

// „Schůzky“ — SPEC §4.8 Meetings: each troop's two meeting days and time,
// and date ranges without meetings (holidays). Saved together with one button;
// single cancelled meetings are marked by leaders in attendance instead.
// Ranges that are over are hidden; attendance still needs them until the end of
// the school year, so only ranges of earlier school years are deleted (when the
// tab opens).
defineEmits(['open-tab'])

const today = pragueToday()
const scheduleStore = useMeetingScheduleStore()
const { schedule } = storeToRefs(scheduleStore)
const loading = ref(true)
const members = ref([])

const copy = (s) => JSON.parse(JSON.stringify(s))
const draft = ref(null)
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(schedule.value))

let unsubscribe = null
onMounted(async () => {
  unsubscribe = subscribeMembers(
    (list) => (members.value = list.filter((m) => m.active)),
    (e) => console.error('Loading members failed', e),
  )
  await scheduleStore.load()
  await pruneOldRanges()
  draft.value = copy(schedule.value)
  loading.value = false
})

async function pruneOldRanges() {
  const { from } = schoolYearRange(today)
  const kept = schedule.value.noMeetings.filter((r) => r.to >= from)
  if (kept.length === schedule.value.noMeetings.length) return
  try {
    await updateMeetingSettings({ ...copy(schedule.value), noMeetings: kept })
    await until(() => schedule.value.noMeetings.length === kept.length)
  } catch (e) {
    console.error('Deleting old no-meeting ranges failed', e)
  }
}

// Waits for the live settings to catch up with a write.
function until(condition) {
  if (condition()) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(schedule, () => {
      if (condition()) {
        stop()
        resolve()
      }
    })
  })
}
onUnmounted(() => unsubscribe?.())

// Another admin's save shows up here unless there are local changes.
watch(schedule, (s, old) => {
  if (draft.value && JSON.stringify(draft.value) === JSON.stringify(old)) draft.value = copy(s)
})

// ---- meeting days and times ----

function toggleDay(code, day) {
  const t = draft.value[code]
  t.days = t.days.includes(day) ? t.days.filter((d) => d !== day) : sortWeekdays([...t.days, day])
}

// Children whose meeting day the (saved) schedule no longer has.
const invalidDays = computed(
  () =>
    members.value.filter(
      (m) => m.meetingDay && !schedule.value[m.troop]?.days.includes(m.meetingDay),
    ).length,
)
const withoutDay = computed(() => members.value.filter((m) => !m.meetingDay).length)

// ---- dates without meetings ----

const TROOP_OPTIONS = ['all', 'vlc', 'ss']
const range = reactive({ from: '', to: '', troop: 'all', reason: '' })
const rangeError = ref('')

function addRange() {
  const to = range.to || range.from
  if (!range.from) return (rangeError.value = 'Vyber, od kdy schůzky nejsou.')
  if (to < range.from) return (rangeError.value = 'Konec musí být stejně nebo později než začátek.')
  rangeError.value = ''
  const newRange = { from: range.from, to, troop: range.troop, reason: range.reason.trim() }
  added.value = [...added.value, newRange]
  draft.value.noMeetings = [...draft.value.noMeetings, newRange].sort((a, b) =>
    a.from.localeCompare(b.from),
  )
  Object.assign(range, { from: '', to: '', reason: '' })
}

// Ranges not over yet (and ones added here until saved); the ones that are
// over stay in the data (see above).
const added = ref([])
const upcoming = computed(() =>
  draft.value.noMeetings.filter((r) => r.to >= today || added.value.includes(r)),
)
const removeRange = (range) =>
  (draft.value.noMeetings = draft.value.noMeetings.filter((r) => r !== range))

const formatDates = ({ from, to }) => `${formatRange(from, to)} ${to.slice(0, 4)}`

// ---- saving ----

const errors = ref({})

// Collapsed sections (CollapsibleSection); summaries follow the edits.
const opened = reactive({ vlc: false, ss: false, ranges: false })
const troopSummary = (code) => {
  const t = draft.value[code]
  return `${t.days.map((d) => WEEKDAY_NAMES[d]).join(' a ') || 'bez dnů'} · ${meetingTimeLong(t)}`
}
const rangesSummary = computed(() =>
  upcoming.value.length
    ? upcoming.value.map((r) => r.reason || formatDates(r)).join(', ')
    : 'zatím nic',
)
const { saving, saved, error, save } = useSaveState()

function validate() {
  const e = {}
  for (const { code } of TROOPS) {
    const t = draft.value[code]
    if (t.days.length !== 2) e[`${code}Days`] = 'Vyber dva dny.'
    if (!t.start || !t.end || t.start >= t.end) e[`${code}Time`] = 'Začátek musí být před koncem.'
  }
  errors.value = e
  // Open the sections with errors, so they can be seen.
  for (const { code } of TROOPS) if (e[`${code}Days`] || e[`${code}Time`]) opened[code] = true
  return !Object.keys(e).length
}

async function submit() {
  if (!validate()) return
  if (await save(() => updateMeetingSettings(copy(draft.value)))) added.value = []
}
</script>

<template>
  <section aria-labelledby="meetings-title">
    <h2 id="meetings-title" class="sr-only">Schůzky</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Kdy mají oddíly schůzky. Podle toho se nabízí termíny v docházce, píše se „dnešek“ na
      vedoucovské stránce, dny a časy na veřejné stránce a řídí se podle toho klubovna. Jednotlivou
      zrušenou schůzku označí vedoucí v docházce („schůzka nebyla“) — tady se zadávají prázdniny a
      jiná delší období.
    </p>

    <p v-if="loading" class="font-hand text-2xl text-muted">načítám…</p>

    <form v-else novalidate class="flex flex-col gap-5" @submit.prevent="submit">
      <div class="flex flex-col gap-2.5">
        <CollapsibleSection
          v-for="troop in TROOPS"
          :key="troop.code"
          v-model:open="opened[troop.code]"
          :title="troop.name"
          :summary="troopSummary(troop.code)"
          :data-testid="`troop-${troop.code}`"
        >
          <p class="m-0 mb-1.5 text-[15px] font-medium text-ink">Dny schůzek</p>
          <div
            class="flex flex-wrap gap-1.5"
            role="group"
            :aria-label="`Dny schůzek — ${troop.name}`"
          >
            <button
              v-for="day in MEETING_WEEKDAYS"
              :key="day"
              type="button"
              :aria-pressed="draft[troop.code].days.includes(day)"
              class="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[14.5px]"
              :class="
                draft[troop.code].days.includes(day)
                  ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
                  : 'border-line bg-transparent text-muted hover:border-ink'
              "
              @click="toggleDay(troop.code, day)"
            >
              {{ WEEKDAY_NAMES[day] }}
            </button>
          </div>
          <p v-if="errors[`${troop.code}Days`]" class="m-0 mt-1.5 text-sm text-red">
            {{ errors[`${troop.code}Days`] }}
          </p>

          <div class="mt-3.5 flex flex-wrap items-end gap-3">
            <label class="flex flex-col gap-[7px]">
              <span class="text-[15px] font-medium text-ink">Od</span>
              <input
                v-model="draft[troop.code].start"
                type="time"
                class="field-input w-[8.5rem] py-2.5"
                :aria-invalid="!!errors[`${troop.code}Time`]"
                :aria-label="`Začátek schůzky — ${troop.name}`"
              />
            </label>
            <label class="flex flex-col gap-[7px]">
              <span class="text-[15px] font-medium text-ink">Do</span>
              <input
                v-model="draft[troop.code].end"
                type="time"
                class="field-input w-[8.5rem] py-2.5"
                :aria-invalid="!!errors[`${troop.code}Time`]"
                :aria-label="`Konec schůzky — ${troop.name}`"
              />
            </label>
          </div>
          <p v-if="errors[`${troop.code}Time`]" class="m-0 mt-1.5 text-sm text-red">
            {{ errors[`${troop.code}Time`] }}
          </p>
        </CollapsibleSection>
      </div>

      <p v-if="invalidDays" class="note-warm m-0" data-testid="invalid-days">
        {{ invalidDays }}
        {{ plural(invalidDays, 'dítě má', 'děti mají', 'dětí má') }}
        den schůzek, který už oddíl nemá — v docházce teď nejsou.
        <button
          type="button"
          class="btn-link py-0 text-[14.5px]"
          @click="$emit('open-tab', 'deti')"
        >
          nastavit v záložce děti
        </button>
      </p>
      <p v-else-if="withoutDay" class="m-0 text-[14.5px] text-brown">
        {{ withoutDay }} {{ plural(withoutDay, 'dítě nemá', 'děti nemají', 'dětí nemá') }} den
        schůzek.
        <button
          type="button"
          class="btn-link py-0 text-[14.5px]"
          @click="$emit('open-tab', 'deti')"
        >
          nastavit v záložce děti
        </button>
      </p>

      <CollapsibleSection
        v-model:open="opened.ranges"
        title="Kdy schůzky nejsou"
        :summary="rangesSummary"
        data-testid="ranges"
      >
        <p class="m-0 mb-3 text-[14.5px] text-muted">
          Prázdniny, svátky, podzimní a jarní prázdniny… Ty dny se v docházce nenabízí a nepočítají
          se jako nezapsané. Proběhlá období tu už nejsou vidět, docházka je ale do konce školního
          roku dál vynechává.
        </p>

        <ul v-if="upcoming.length" class="m-0 mb-3 flex list-none flex-col p-0">
          <li
            v-for="(r, i) in upcoming"
            :key="`${r.from}-${r.to}-${r.troop}-${i}`"
            class="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-[#ece4d0] py-2 first:border-t-0"
            data-testid="no-meeting"
          >
            <span class="font-hand text-[21px] leading-none font-bold whitespace-nowrap text-ink">
              {{ formatDates(r) }}
            </span>
            <AudienceTag :audience="r.troop" />
            <span class="min-w-0 flex-[1_1_140px] text-[15px] break-words text-text">
              {{ r.reason }}
            </span>
            <button
              type="button"
              class="btn-link text-red! hover:text-ink!"
              :aria-label="`Odebrat ${formatDates(r)}`"
              @click="removeRange(r)"
            >
              odebrat
            </button>
          </li>
        </ul>
        <p v-else class="m-0 mb-3 text-[15px] text-muted italic">Zatím nic.</p>

        <div
          class="grid grid-cols-2 gap-3 border-t border-dashed border-line pt-3 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] sm:items-end"
          data-testid="add-range"
        >
          <label class="flex min-w-0 flex-col gap-[7px]">
            <span class="text-[15px] font-medium text-ink">Od</span>
            <input v-model="range.from" type="date" class="field-input py-2.5" />
          </label>
          <label class="flex min-w-0 flex-col gap-[7px]">
            <span class="text-[15px] font-medium text-ink">Do</span>
            <input v-model="range.to" type="date" :min="range.from" class="field-input py-2.5" />
          </label>
          <label class="col-span-2 flex min-w-0 flex-col gap-[7px] sm:col-span-1">
            <span class="text-[15px] font-medium text-ink">Oddíl</span>
            <select v-model="range.troop" class="field-input py-2.5">
              <option v-for="t in TROOP_OPTIONS" :key="t" :value="t">
                {{ AUDIENCES[t].name }}
              </option>
            </select>
          </label>
          <label class="col-span-2 flex min-w-0 flex-col gap-[7px] sm:col-span-1">
            <span class="text-[15px] font-medium text-ink"
              >Důvod <span class="font-normal text-muted-2">(nepovinné)</span></span
            >
            <input
              v-model="range.reason"
              type="text"
              maxlength="80"
              placeholder="např. jarní prázdniny"
              class="field-input py-2.5"
            />
          </label>
          <button
            type="button"
            class="btn-outline col-span-2 px-5 py-2.5 sm:col-span-1"
            @click="addRange"
          >
            + přidat
          </button>
        </div>
        <p v-if="rangeError" role="alert" class="m-0 mt-2 text-sm text-red">{{ rangeError }}</p>
        <p class="m-0 mt-2 text-[13.5px] text-muted-2">
          Jeden den: vyplň jen „od“. Přidané se uloží až tlačítkem „uložit“.
        </p>
      </CollapsibleSection>

      <SaveBar :saving="saving" :saved="saved" :dirty="dirty" :error="error" />
    </form>
  </section>
</template>
