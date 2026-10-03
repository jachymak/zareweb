<script setup>
import { computed } from 'vue'
import { weekdayOf } from '@shared/meetingDays'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatShortDay, meetingLink, tripLink } from './leaderText'

// What the troop has today (SPEC §4.1): a meeting or the first day of a trip
// (with a link to record attendance), a meeting day without a meeting (holidays
// set in Administration), the other troop's meeting, or nothing.
const props = defineProps({
  plan: { type: Object, required: true }, // troopDay(): { kind, event? }
  troop: { type: String, required: true },
  today: { type: String, required: true },
  meetingTime: { type: String, required: true }, // „17–19 h“
  excuses: { type: Array, default: () => [] }, // [{ nickname, reason }] of today's meeting
})

// „Sojka (nemoc), Bobr“
const excusedText = computed(() =>
  props.excuses.map((e) => (e.reason ? `${e.nickname} (${e.reason})` : e.nickname)).join(', '),
)

const date = computed(() => formatShortDay(props.today, weekdayOf(props.today)))
const record = computed(() => {
  const { kind, event } = props.plan
  if (kind === 'meeting') {
    return {
      audience: props.troop,
      text: `schůzka v klubovně, ${props.meetingTime}`,
      action: 'zapsat docházku →',
      to: meetingLink(props.troop, props.today),
    }
  }
  if (kind === 'trip') {
    return {
      audience: event.audience,
      text: `první den výpravy — ${event.title}`,
      action: 'zapsat účast a platby →',
      to: tripLink(props.troop, event.id),
    }
  }
  return null
})
const quietText = computed(() => {
  const { kind, reason } = props.plan
  if (kind === 'noMeeting') return `dneska schůzka není${reason ? ` — ${reason}` : ''}`
  return kind === 'otherTroop'
    ? 'dneska má schůzku druhý oddíl — tvůj oddíl se neschází'
    : 'dneska není schůzka ani výprava — klidný den'
})
</script>

<template>
  <HandDrawnBox
    :stroke="record ? 'var(--color-green)' : '#c9bfa6'"
    :fill="record ? 'var(--color-paper)' : '#f6efdc'"
    class="px-5 pt-[18px] pb-5 sm:px-8"
  >
    <section aria-label="Dnešek" data-testid="today-card">
      <div v-if="record" class="flex flex-wrap items-center gap-x-[18px] gap-y-3">
        <span class="font-hand text-[27px] leading-none font-bold text-ink">{{ date }}</span>
        <AudienceTag :audience="record.audience" />
        <span class="text-[17px] text-text" data-testid="today-text">{{ record.text }}</span>
        <RouterLink
          :to="record.to"
          class="rounded-full bg-green px-6 py-2 font-hand text-[23px] font-bold text-cream no-underline hover:bg-green-hover hover:text-cream sm:ml-auto"
        >
          {{ record.action }}
        </RouterLink>
        <p
          v-if="plan.kind === 'meeting' && excuses.length"
          class="m-0 basis-full text-[15px] text-[#7a5408]"
          data-testid="today-excuses"
        >
          omluveno: {{ excusedText }}
        </p>
      </div>
      <div v-else class="flex flex-wrap items-center gap-x-[18px] gap-y-2.5">
        <span class="font-hand text-[25px] leading-none font-bold text-brown">{{ date }}</span>
        <span class="text-[17px] text-muted" data-testid="today-text">{{ quietText }}</span>
        <RouterLink to="/vedouci/dochazka" class="py-1 text-[15.5px] sm:ml-auto">
          zapsat jiný termín →
        </RouterLink>
      </div>
    </section>
  </HandDrawnBox>
</template>
