<script setup>
import { computed } from 'vue'
import { useScrollToSelected } from '@/composables/useScrollToSelected'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatDay, plural } from '@/components/parent/parentText'
import { WEEKDAY_NAMES } from './attendanceText'

// Meetings: pick the weekday and a past date, then tick who came. Every click
// saves at once; „schůzka nebyla“ takes the meeting out of the statistics.
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
})
const weekday = defineModel('weekday', { type: String, required: true })
const date = defineModel('date', { type: String, default: null })

const a = props.attendance
const strip = useScrollToSelected(date)
const dates = computed(() => a.datesOf(weekday.value))
const state = computed(() => (date.value ? a.meetingState(date.value) : null))
const children = computed(() => a.childrenOn(weekday.value))
const presentCount = computed(
  () => children.value.filter((m) => a.isPresent(date.value, m.id)).length,
)

function pickWeekday(value) {
  weekday.value = value
  date.value = a.datesOf(value)[0] ?? null
}

const small =
  'cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[14.5px] disabled:cursor-default'
</script>

<template>
  <div>
    <div class="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        role="group"
        aria-label="Den schůzek"
        class="flex overflow-hidden rounded-full border-[1.5px] border-[#c9bfa6]"
      >
        <button
          v-for="day in a.weekdays"
          :key="day"
          type="button"
          :aria-pressed="weekday === day"
          class="cursor-pointer border-0 px-4 py-2 text-[14.5px] text-ink"
          :class="weekday === day ? 'bg-gold-light' : 'bg-transparent hover:bg-sand'"
          @click="pickWeekday(day)"
        >
          {{ WEEKDAY_NAMES[day] }}
        </button>
      </div>
      <span class="text-[14.5px] text-[#8a7b5e]">
        schůzky {{ WEEKDAY_NAMES[weekday] }} · 17–19 h
      </span>
    </div>

    <p v-if="!dates.length" class="m-0 py-4 text-[16px] text-muted">
      Letos ještě žádná schůzka nebyla.
    </p>
    <template v-else>
      <div
        role="group"
        ref="strip"
        aria-label="Termín schůzky"
        class="flex gap-2 overflow-x-auto px-0.5 pt-1 pb-3 [scrollbar-color:#c9bfa6_transparent] [scrollbar-width:thin]"
      >
        <button
          v-for="d in dates"
          :key="d"
          type="button"
          :aria-pressed="date === d"
          :title="a.meetingState(d) === 'unrecorded' ? 'nezapsáno' : undefined"
          class="flex flex-none cursor-pointer items-baseline gap-1.5 rounded-full border-[1.5px] px-3.5 py-[7px] font-hand text-[19px] font-bold whitespace-nowrap"
          :class="[
            date === d
              ? 'border-ink bg-ink text-cream'
              : a.meetingState(d) === 'unrecorded'
                ? 'border-dashed border-red bg-transparent text-text'
                : 'border-[#d6ccb4] bg-transparent',
            date !== d && a.meetingState(d) === 'cancelled' ? 'text-[#a39781]' : '',
            date !== d && a.meetingState(d) === 'recorded' ? 'text-text' : '',
          ]"
          @click="date = d"
        >
          {{ formatDay(d) }}{{ a.meetingState(d) === 'cancelled' ? ' ×' : '' }}
          <span
            v-if="a.meetingState(d) === 'unrecorded' && d !== a.today"
            class="font-sans text-[12px] font-normal"
            :class="date === d ? 'text-cream' : 'text-red'"
          >
            nezapsáno
          </span>
        </button>
      </div>

      <HandDrawnBox v-if="date" class="mt-1.5 px-4 pt-5 pb-[22px] sm:px-6">
        <section :aria-label="`Schůzka ${formatDay(date)}`">
          <div class="mb-3.5 flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
            <h2 class="m-0 text-[23px] font-medium tracking-[-0.03em] text-ink sm:text-[25px]">
              Schůzka {{ WEEKDAY_NAMES[weekday] }} {{ formatDay(date) }}
            </h2>
            <AudienceTag :audience="a.troop" />
            <span
              v-if="state !== 'cancelled'"
              class="font-hand text-[23px] font-bold text-green sm:ml-auto"
              data-testid="present-count"
            >
              přišlo {{ presentCount }} z {{ children.length }}
            </span>
          </div>

          <div v-if="state === 'cancelled'" class="pt-2.5 pb-1.5">
            <p class="m-0 mb-3 font-hand text-[23px] text-[#8a7b5e]">
              Tenhle termín schůzka nebyla — nepočítá se nikomu do docházky ani do celkového počtu
              schůzek.
            </p>
            <button
              type="button"
              :class="small"
              class="border-[#c9bfa6] bg-[#f2eee1] text-ink"
              @click="a.setMeetingCancelled(date, false)"
            >
              schůzka přece byla
            </button>
          </div>

          <template v-else>
            <div class="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
              <button
                type="button"
                :class="small"
                class="border-green bg-[#e9f1ea] text-[#1f5138]"
                @click="
                  a.setAllPresent(
                    date,
                    children.map((m) => m.id),
                  )
                "
              >
                přišli všichni
              </button>
              <button
                type="button"
                :class="small"
                class="border-[#c9bfa6] bg-transparent text-muted"
                @click="a.setAllPresent(date, [])"
              >
                zrušit výběr
              </button>
              <button
                type="button"
                :class="small"
                class="border-[#d08a6a] bg-transparent text-[#8a2f16]"
                @click="a.setMeetingCancelled(date, true)"
              >
                schůzka nebyla
              </button>
              <span class="font-hand text-[20px] text-brown sm:ml-auto">ukládá se samo</span>
            </div>
            <p v-if="state === 'unrecorded'" class="note-warm m-0 mb-3.5" data-testid="unrecorded">
              Tahle schůzka ještě není zapsaná, do docházky se počítá až po zapsání.
            </p>

            <p v-if="!children.length" class="m-0 text-[16px] text-muted">
              Na {{ WEEKDAY_NAMES[weekday] }} nechodí žádné dítě.
            </p>
            <div
              v-else
              class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,165px),1fr))] gap-2"
            >
              <button
                v-for="m in children"
                :key="m.id"
                type="button"
                :aria-pressed="a.isPresent(date, m.id)"
                :aria-label="m.nickname || m.firstName"
                class="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[3px] border-[1.5px] px-3 py-2.5 text-left"
                :class="
                  a.isPresent(date, m.id)
                    ? 'border-green bg-[#e9f1ea]'
                    : 'border-[#d6ccb4] bg-cream hover:border-line-strong'
                "
                @click="a.togglePresent(date, m.id)"
              >
                <span
                  class="flex size-6 flex-none items-center justify-center rounded border-2 font-hand text-[21px] leading-none font-bold text-green"
                  :class="a.isPresent(date, m.id) ? 'border-green bg-white' : 'border-[#c9bfa6]'"
                  aria-hidden="true"
                >
                  {{ a.isPresent(date, m.id) ? '✓' : '' }}
                </span>
                <span class="min-w-0">
                  <span class="block font-hand text-[20px] leading-[1.1] font-bold text-ink">
                    {{ m.nickname || m.firstName }}
                  </span>
                  <span class="block truncate text-[12.5px] text-[#8a7b5e]">
                    {{ m.firstName }} {{ m.lastName }}
                  </span>
                </span>
              </button>
            </div>
          </template>
        </section>
      </HandDrawnBox>
    </template>

    <p v-if="a.withoutMeetingDay.length" class="m-0 mt-3 text-[14.5px] text-[#8a7b5e]">
      {{ a.withoutMeetingDay.length }}
      {{ plural(a.withoutMeetingDay.length, 'dítě nemá', 'děti nemají', 'dětí nemá') }}
      den schůzek ({{ a.withoutMeetingDay.map((m) => m.nickname || m.firstName).join(', ') }}),
      takže v docházce nejsou — den nastaví správce v Administraci.
    </p>
  </div>
</template>
