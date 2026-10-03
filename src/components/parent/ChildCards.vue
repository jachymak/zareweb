<script setup>
import { computed } from 'vue'
import { troopByCode } from '@/constants/troops'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from './AudienceTag.vue'
import { MEETING_DAYS, campRequirementText } from './parentText'
import { nicknameOf } from '@shared/names'

// One card per child: meeting day, attendance and trips this school year.
const props = defineProps({
  stats: { type: Array, required: true }, // [{ member, percent, trips }]
  settings: { type: Object, required: true }, // camp requirement per troop
})

// The camp requirement of the children's troops — one line when it is the same,
// else one per troop with its name.
const requirementLines = computed(() => {
  const troops = [...new Set(props.stats.map((s) => s.member.troop))]
  const lines = troops.map((t) => ({ troop: t, text: campRequirementText(props.settings[t]) }))
  if (new Set(lines.map((l) => l.text)).size <= 1) return lines[0]?.text ? [lines[0].text] : []
  return lines.filter((l) => l.text).map((l) => `${troopByCode(l.troop).name}: ${l.text}`)
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
        <article :aria-label="nicknameOf(member)">
          <div class="flex flex-wrap items-baseline gap-x-[9px] gap-y-[3px]">
            <span class="font-hand text-[26px] leading-none font-bold text-ink">
              {{ nicknameOf(member) }}
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
    <p
      v-for="line in requirementLines"
      :key="line"
      class="m-0 mt-2.5 font-hand text-[21px] text-brown"
    >
      {{ line }}
    </p>
  </div>
</template>
