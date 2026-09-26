<script setup>
import { computed, ref, watch } from 'vue'
import { isTrip } from '@shared/attendance'
import { canJoin, isRelevant } from '@shared/events'
import AudienceTag from './AudienceTag.vue'
import PillSwitch from './PillSwitch.vue'
import SectionHeading from './SectionHeading.vue'
import { formatMonth, formatRange, organizerNames } from './parentText'

// „Výpravník“ — events of the school year by month: upcoming or past, only
// the children's troops or both, first two months or the whole year.
const props = defineProps({
  events: { type: Array, required: true }, // this school year and later, by startDate
  children: { type: Array, required: true },
  troops: { type: Array, required: true }, // the children's troops
  today: { type: String, required: true },
  organizersOf: { type: Function, required: true },
  participantOf: { type: Function, required: true },
})

const MODES = [
  { value: 'upcoming', label: 'co nás čeká' },
  { value: 'past', label: 'proběhlo' },
]
const mode = ref('upcoming')
const allTroops = ref(false)
const fullYear = ref(false)
watch(mode, () => (fullYear.value = false))

// With children in both troops every event is theirs — no switch needed.
const coversBothTroops = computed(() => props.troops.length > 1)

const filterText = computed(() => {
  if (allTroops.value || coversBothTroops.value) return 'Vidíte akce obou oddílů.'
  const troop = props.troops[0] === 'vlc' ? 'vlčušky' : 'skauty a skautky'
  return `Vidíte akce pro ${troop} a akce pro všechny.`
})

const months = computed(() => {
  const past = mode.value === 'past'
  const list = props.events
    .filter((e) => allTroops.value || isRelevant(e.audience, props.troops))
    .filter((e) => (past ? e.endDate < props.today : e.endDate >= props.today))
  if (past) list.reverse()
  const groups = []
  for (const event of list) {
    const key = event.startDate.slice(0, 7)
    if (groups.at(-1)?.key !== key) groups.push({ key, events: [] })
    groups.at(-1).events.push(event)
  }
  return groups
})
const visibleMonths = computed(() => (fullYear.value ? months.value : months.value.slice(0, 2)))
const thisYear = computed(() => Number(props.today.slice(0, 4)))

// ✓/✗ per child for past trips (events with registration, not the camp).
function attendance(event) {
  if (mode.value !== 'past' || !isTrip(event)) return []
  return props.children
    .filter((m) => canJoin(event, m))
    .map((m) => ({
      member: m,
      attended: props.participantOf(event.id, m.id)?.attended === true,
    }))
}
</script>

<template>
  <section aria-labelledby="calendar-title">
    <SectionHeading id="calendar-title" kicker="celý rok pohromadě" title="Výpravník">
      <PillSwitch v-model="mode" :options="MODES" label="Které akce" />
      <button
        v-if="!coversBothTroops"
        type="button"
        class="cursor-pointer border-0 border-b-[1.5px] border-[#9ec0a8] bg-transparent px-0 pt-1 pb-px font-hand text-[20px] font-bold text-green hover:text-red"
        :aria-pressed="allTroops"
        @click="allTroops = !allTroops"
      >
        {{ allTroops ? 'jen naše akce' : 'i akce druhého oddílu' }}
      </button>
    </SectionHeading>
    <p class="m-0 -mt-2 mb-3.5 text-[14.5px] text-[#8a7b5e]">{{ filterText }}</p>

    <p v-if="!months.length" class="m-0 border-t border-[#ede5d3] py-3 text-[16px] text-muted">
      {{ mode === 'past' ? 'Letos zatím nic neproběhlo.' : 'Zatím tu nejsou žádné akce.' }}
    </p>

    <div
      v-for="month in visibleMonths"
      :key="month.key"
      class="grid gap-x-[18px] py-2 sm:grid-cols-[96px_minmax(0,1fr)]"
      data-testid="calendar-month"
    >
      <h3 class="m-0 mb-1 font-hand text-[24px] leading-none font-bold text-red sm:mt-[7px]">
        {{ formatMonth(month.key, thisYear) }}
      </h3>
      <ul class="m-0 min-w-0 list-none p-0">
        <li
          v-for="event in month.events"
          :key="event.id"
          class="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-[#ede5d3] py-2 sm:grid sm:grid-cols-[108px_42px_minmax(0,1fr)_auto]"
          data-testid="calendar-event"
        >
          <span class="font-hand text-[22px] leading-[1.15] font-bold text-ink">
            {{ formatRange(event.startDate, event.endDate) }}
          </span>
          <AudienceTag :audience="event.audience" />
          <span
            class="flex min-w-0 basis-full flex-wrap items-baseline gap-x-[9px] gap-y-0.5 sm:basis-auto"
          >
            <span class="text-[17px] text-ink" :class="event.cancelled && 'line-through'">
              {{ event.title }}
            </span>
            <span class="text-[14.5px] text-muted">{{ organizerNames(organizersOf(event)) }}</span>
            <span
              v-if="event.cancelled"
              class="rounded-full bg-[#f0cdc2] px-2.5 pt-1 pb-[5px] font-hand text-[18px] leading-none font-bold text-[#8a2f16]"
            >
              zrušeno
            </span>
          </span>
          <span class="flex flex-wrap gap-[7px] sm:justify-self-end">
            <span
              v-for="{ member, attended } in attendance(event)"
              :key="member.id"
              class="rounded-full border-[1.5px] px-2.5 pt-1 pb-[5px] font-hand text-[18px] leading-none font-bold whitespace-nowrap"
              :class="
                attended
                  ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
                  : 'border-[#d6ccb4] text-[#8a7b5e]'
              "
              :title="attended ? 'byl(a) na akci' : 'nebyl(a) na akci'"
            >
              {{ attended ? '✓' : '✗' }} {{ member.nickname || member.firstName }}
            </span>
          </span>
        </li>
      </ul>
    </div>

    <div v-if="months.length > 2" class="mt-3 border-t border-[#ede5d3] pt-3">
      <button
        type="button"
        class="cursor-pointer border-0 border-b-[1.5px] border-[#9ec0a8] bg-transparent px-0 pt-1 pb-px font-hand text-[21px] font-bold text-green hover:text-red"
        :aria-expanded="fullYear"
        @click="fullYear = !fullYear"
      >
        {{ fullYear ? 'zobrazit jen nejbližší měsíce' : 'zobrazit celý rok' }}
      </button>
    </div>
  </section>
</template>
