<script setup>
import { meetsCampRequirement } from '@shared/attendance'
import SectionHeading from '@/components/parent/SectionHeading.vue'
import { campRequirementText } from '@/components/parent/parentText'
import { TROOP_GENITIVE } from './leaderText'

// Meeting % and trips of each child of the troop; children not meeting the
// camp requirement yet in red (SPEC §4.1).
defineProps({
  troop: { type: String, required: true },
  stats: { type: Array, required: true }, // [{ member, percent, trips }]
  settings: { type: Object, required: true }, // settings/app
})
</script>

<template>
  <section aria-labelledby="troop-attendance-title">
    <SectionHeading
      id="troop-attendance-title"
      kicker="jak na tom jsou"
      :title="`Docházka ${TROOP_GENITIVE[troop]}`"
    >
      <RouterLink
        :to="{ path: '/vedouci/dochazka', query: { oddil: troop } }"
        class="py-1 text-[15.5px]"
      >
        celá docházka a zápis →
      </RouterLink>
    </SectionHeading>

    <p v-if="!stats.length" class="m-0 text-[16px] text-muted">V oddílu zatím nejsou žádné děti.</p>
    <ul
      v-else
      class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-[26px] p-0"
    >
      <li
        v-for="row in stats"
        :key="row.member.id"
        :aria-label="row.member.nickname || row.member.firstName"
        class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[#e4d9be] py-2"
        :data-camp="meetsCampRequirement(row, settings) ? 'ok' : 'short'"
      >
        <span class="flex min-w-0 flex-[1_1_140px] flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <b
            class="font-hand text-[20px] font-bold"
            :class="meetsCampRequirement(row, settings) ? 'text-ink' : 'text-red'"
          >
            {{ row.member.nickname || row.member.firstName }}
          </b>
          <span class="text-[14px] text-[#8a7b5e]">
            {{ row.member.firstName }} {{ row.member.lastName }}
          </span>
        </span>
        <span
          class="font-hand text-[20px] font-bold whitespace-nowrap"
          :class="(row.percent ?? 0) >= settings.campMinMeetingPct ? 'text-green' : 'text-red'"
          data-testid="attendance"
        >
          {{ row.percent === null ? '—' : `${row.percent} %` }}
        </span>
        <span
          class="text-[14px] whitespace-nowrap"
          :class="row.trips >= settings.campMinTrips ? 'text-muted' : 'font-medium text-red'"
          data-testid="trips"
        >
          {{ row.trips }} výpr.
        </span>
      </li>
    </ul>
    <p class="m-0 mt-3 font-hand text-[20px] text-brown">
      červeně ti, kdo zatím nesplňují podmínku na tábor ({{ campRequirementText(settings) }})
    </p>
  </section>
</template>
