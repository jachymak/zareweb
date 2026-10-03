<script setup>
import { computed, ref } from 'vue'
import { meetingsOk, meetsCampRequirement, tripsOk } from '@shared/attendance'
import SectionHeading from '@/components/parent/SectionHeading.vue'
import { campRequirementText, MEETING_DAYS, plural } from '@/components/parent/parentText'
import MeetingDots from './MeetingDots.vue'
import { nicknameOf } from '@shared/names'

// Meeting % and trips of each child of the troop; children not meeting the
// camp requirement yet in red (SPEC §4.2). Clicking a child shows a dot per
// meeting of their day. The list is folded behind a summary line.
const props = defineProps({
  stats: { type: Array, required: true }, // [{ member, percent, trips, dots, hasMeetingDay }]
  requirement: { type: Object, required: true }, // the troop's camp requirement
})

const open = defineModel('open', { type: Boolean, default: false })
const shown = ref(new Set()) // ids of children with their dots shown
function toggleDots(id) {
  const next = new Set(shown.value)
  if (!next.delete(id)) next.add(id)
  shown.value = next
}
const short = computed(
  () => props.stats.filter((row) => !meetsCampRequirement(row, props.requirement)).length,
)
const count = computed(() => props.stats.length)
</script>

<template>
  <section aria-labelledby="troop-attendance-title">
    <SectionHeading
      id="troop-attendance-title"
      kicker="jak na tom jsou"
      title="Podmínka na tábor"
    />

    <p v-if="!stats.length" class="m-0 text-[16px] text-muted">V oddílu zatím nejsou žádné děti.</p>
    <button
      v-if="stats.length"
      type="button"
      :aria-expanded="open"
      class="flex w-full cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[3px] border-[1.5px] border-[#e4d9be] bg-paper px-3.5 py-2.5 text-left"
      @click="open = !open"
    >
      <span class="text-[15px] text-ink">
        {{ count }} {{ plural(count, 'dítě', 'děti', 'dětí') }}
        <template v-if="campRequirementText(requirement) && short">
          ·
          <span class="text-red">
            {{ short }} {{ plural(short, 'nesplňuje', 'nesplňují', 'nesplňuje') }} podmínku na tábor
          </span>
        </template>
      </span>
      <span class="ml-auto font-hand text-[19px] font-bold text-green">
        {{ open ? 'skrýt ↑' : 'zobrazit ↓' }}
      </span>
    </button>
    <ul
      v-if="stats.length"
      class="m-0 list-none grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] items-start gap-x-[26px] p-0"
      :class="open ? 'mt-2 grid' : 'hidden'"
    >
      <li
        v-for="row in stats"
        :key="row.member.id"
        :aria-label="nicknameOf(row.member)"
        class="border-t border-[#e4d9be]"
        :data-camp="meetsCampRequirement(row, requirement) ? 'ok' : 'short'"
      >
        <button
          type="button"
          :aria-expanded="shown.has(row.member.id)"
          class="flex w-full cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 border-0 bg-transparent px-0 py-2 text-left"
          @click="toggleDots(row.member.id)"
        >
          <span class="flex min-w-0 flex-[1_1_140px] flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <b
              class="font-hand text-[20px] font-bold"
              :class="meetsCampRequirement(row, requirement) ? 'text-ink' : 'text-red'"
            >
              {{ nicknameOf(row.member) }}
            </b>
            <span class="text-[14px] text-[#8a7b5e]">
              {{ row.member.firstName }} {{ row.member.lastName }}
            </span>
          </span>
          <span
            class="font-hand text-[20px] font-bold whitespace-nowrap"
            :class="meetingsOk(row, requirement) ? 'text-green' : 'text-red'"
            data-testid="attendance"
          >
            {{ row.percent === null ? '—' : `${row.percent} %` }}
          </span>
          <span
            class="text-[14px] whitespace-nowrap"
            :class="tripsOk(row, requirement) ? 'text-muted' : 'font-medium text-red'"
            data-testid="trips"
          >
            {{ row.trips }} výpr.
          </span>
          <span class="text-[13px] text-[#8a7b5e]" aria-hidden="true">
            {{ shown.has(row.member.id) ? '▴' : '▾' }}
          </span>
        </button>
        <div v-if="shown.has(row.member.id)" class="pb-2.5">
          <template v-if="row.dots.length">
            <MeetingDots :dots="row.dots" />
            <span class="mt-1 block text-[13px] text-[#8a7b5e]">
              schůzky {{ MEETING_DAYS[row.member.meetingDay] }}
            </span>
          </template>
          <span v-else class="block text-[14px] text-[#8a7b5e]">
            {{
              row.hasMeetingDay
                ? 'Letos ještě žádná schůzka nebyla.'
                : 'Nemá den schůzek — nastaví ho správce.'
            }}
          </span>
        </div>
      </li>
    </ul>
    <p
      v-if="stats.length"
      class="m-0 mt-3 font-hand text-[20px] text-brown"
      :class="open ? 'block' : 'hidden'"
    >
      klikni na dítě a uvidíš jeho schůzky
    </p>
    <p
      v-if="campRequirementText(requirement)"
      class="m-0 mt-1 font-hand text-[20px] text-brown"
      :class="open ? 'block' : 'hidden'"
    >
      červeně ti, kdo zatím nesplňují podmínku na tábor ({{ campRequirementText(requirement) }})
    </p>
    <p v-else class="m-0 mt-3 font-hand text-[20px] text-brown">
      oddíl nemá žádnou podmínku na tábor
    </p>
  </section>
</template>
