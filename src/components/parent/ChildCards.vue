<script setup>
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from './AudienceTag.vue'
import { MEETING_DAYS, campRequirementText } from './parentText'

// One card per child: meeting day, attendance and trips this school year.
defineProps({
  stats: { type: Array, required: true }, // [{ member, percent, trips }]
  settings: { type: Object, required: true }, // settings/app
})
</script>

<template>
  <div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,236px),1fr))] gap-3.5">
      <HandDrawnBox
        v-for="{ member, percent, trips } in stats"
        :key="member.id"
        stroke="#b9a97f"
        class="px-[18px] pt-[15px] pb-4"
      >
        <article :aria-label="member.nickname || member.firstName">
          <div class="flex flex-wrap items-baseline gap-x-[9px] gap-y-[3px]">
            <span class="font-hand text-[26px] leading-none font-bold text-ink">
              {{ member.nickname || member.firstName }}
            </span>
            <AudienceTag :audience="member.troop" />
          </div>
          <p class="m-0 mt-1 text-[15px] text-muted">
            {{ member.firstName }} {{ member.lastName }} ·
            <template v-if="member.meetingDay"
              >schůzky {{ MEETING_DAYS[member.meetingDay] }}</template
            >
            <template v-else>den schůzek zatím nemá</template>
          </p>
          <p class="m-0 mt-[7px] flex items-baseline gap-[18px] text-[14.5px] text-muted-2">
            <span>
              docházka
              <b class="font-hand text-[22px] font-bold text-green" data-testid="attendance">
                {{ percent === null ? '—' : `${percent} %` }}
              </b>
            </span>
            <span>
              výpravy
              <b class="font-hand text-[22px] font-bold text-red" data-testid="trips">{{
                trips
              }}</b>
            </span>
          </p>
        </article>
      </HandDrawnBox>
    </div>
    <p class="m-0 mt-2.5 font-hand text-[21px] text-brown">{{ campRequirementText(settings) }}</p>
  </div>
</template>
