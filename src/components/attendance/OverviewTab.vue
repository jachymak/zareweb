<script setup>
import { meetsCampRequirement } from '@shared/attendance'
import { campRequirementText, formatDay } from '@/components/parent/parentText'
import { DOT_STATES, WEEKDAY_NAMES } from './attendanceText'

// Overview: each child's meeting % and trips (red below the camp requirement)
// and a dot per meeting date of their day this school year.
defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
})

const DOT_CLASSES = {
  present: 'border-green bg-green',
  absent: 'border-green bg-transparent',
  cancelled:
    'border-[#c9bfa6] bg-[repeating-linear-gradient(45deg,#c9bfa6_0_2px,transparent_2px_5px)]',
  unrecorded: 'border-dashed border-[#c9bfa6] bg-transparent',
}
</script>

<template>
  <section aria-labelledby="overview-title">
    <p class="kicker m-0 -mb-0.5">celý rok u každého dítěte</p>
    <h2 id="overview-title" class="m-0 mb-4 text-[26px] font-medium tracking-[-0.03em] text-ink">
      Přehled dětí
    </h2>
    <p v-if="!attendance.overview.length" class="m-0 text-[16px] text-muted">
      V oddílu zatím nejsou žádné děti.
    </p>
    <article
      v-for="row in attendance.overview"
      :key="row.member.id"
      :aria-label="row.member.nickname || row.member.firstName"
      class="mb-[9px] rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-[13px] sm:px-[18px]"
      :data-camp="meetsCampRequirement(row, attendance.settings) ? 'ok' : 'short'"
    >
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        <span class="flex min-w-0 flex-[1_1_200px] flex-wrap items-baseline gap-x-[9px] gap-y-0.5">
          <b class="font-hand text-[22px] font-bold text-ink">
            {{ row.member.nickname || row.member.firstName }}
          </b>
          <span class="text-[14.5px] text-[#8a7b5e]">
            {{ row.member.firstName }} {{ row.member.lastName }}
            <template v-if="row.member.meetingDay">
              · {{ WEEKDAY_NAMES[row.member.meetingDay] }}
            </template>
          </span>
        </span>
        <span class="flex items-baseline gap-1.5 text-[14.5px] text-muted">
          schůzky
          <b
            class="font-hand text-[21px] font-bold"
            :class="
              (row.percent ?? 0) >= attendance.settings.campMinMeetingPct
                ? 'text-green'
                : 'text-red'
            "
            data-testid="attendance"
          >
            {{ row.percent === null ? '—' : `${row.percent} %` }}
          </b>
        </span>
        <span class="flex items-baseline gap-1.5 text-[14.5px] text-muted">
          výpravy
          <b
            class="font-hand text-[21px] font-bold"
            :class="row.trips >= attendance.settings.campMinTrips ? 'text-green' : 'text-red'"
            data-testid="trips"
          >
            {{ row.trips }}
          </b>
        </span>
      </div>
      <ul v-if="row.dots.length" class="m-0 mt-2.5 flex list-none flex-wrap gap-[5px] p-0">
        <li
          v-for="dot in row.dots"
          :key="dot.date"
          class="size-[15px] rounded-full border-2"
          :class="DOT_CLASSES[dot.state]"
          :title="`${formatDay(dot.date)} — ${DOT_STATES[dot.state]}`"
          :aria-label="`${formatDay(dot.date)} — ${DOT_STATES[dot.state]}`"
          :data-state="dot.state"
        />
      </ul>
      <p v-else class="m-0 mt-2 text-[14px] text-[#8a7b5e]">
        {{
          row.member.meetingDay
            ? 'Letos ještě žádná schůzka nebyla.'
            : 'Nemá den schůzek — nastaví ho správce.'
        }}
      </p>
    </article>
    <p class="m-0 mt-2.5 font-hand text-[20px] text-brown">
      plné kolečko = byl(a), prázdné = nebyl(a), šrafované = schůzka nebyla, čárkované = nezapsáno ·
      po najetí se ukáže termín
    </p>
    <p class="m-0 mt-1 font-hand text-[20px] text-brown">
      červeně to, co zatím nestačí na tábor ({{ campRequirementText(attendance.settings) }})
    </p>
  </section>
</template>
