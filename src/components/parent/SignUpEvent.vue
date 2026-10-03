<script setup>
import { computed, ref } from 'vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from './AudienceTag.vue'
import SignUpChild from './SignUpChild.vue'
import {
  daysLeftText,
  daysUntil,
  formatDay,
  formatRange,
  lateSignUpText,
  organizerNames,
  previewSignUpText,
  SAVE_ERROR,
} from './parentText'
import { nicknameOf } from '@shared/names'

// One event open for sign-up: a row per eligible child with its state and a
// button (none for a parent without children — then just the event, its poster
// and deadline). After the deadline the buttons are locked and clicking one says
// whom to write to. In the leaders' preview a click only explains what it would
// do for the parent.
const props = defineProps({
  event: { type: Object, required: true },
  state: { type: String, required: true }, // 'open' | 'ended'
  organizers: { type: Array, required: true }, // skautisPeople docs, first = main
  children: { type: Array, required: true }, // [{ member, participant, mine, saving }]
  error: { type: Boolean, default: false },
  preview: { type: Boolean, default: false }, // leaders' preview: nothing is saved
  posterQuery: { type: Object, default: () => ({}) },
  today: { type: String, required: true },
})
const emit = defineEmits(['toggle'])

const ended = computed(() => props.state === 'ended')
const daysLeft = computed(() =>
  ended.value ? '' : daysLeftText(props.event.registrationDeadline, props.today),
)
const lastDays = computed(
  () => !ended.value && daysUntil(props.event.registrationDeadline, props.today) <= 2,
)
const notice = ref('')

function click({ member, participant }) {
  const nickname = nicknameOf(member)
  if (ended.value) {
    notice.value = lateSignUpText(nickname, props.organizers[0])
  } else if (props.preview) {
    notice.value = previewSignUpText(nickname, !!participant?.signedUp)
  } else {
    emit('toggle', member)
  }
}
</script>

<template>
  <HandDrawnBox class="mb-4 px-5 pt-6 pb-6 sm:px-8 sm:pt-7 sm:pb-7">
    <article :aria-label="event.title">
      <div
        class="flex flex-wrap items-center gap-x-3.5 gap-y-1 sm:grid sm:grid-cols-[108px_42px_minmax(0,1fr)_auto]"
      >
        <span class="font-hand text-[25px] leading-[1.1] font-bold text-ink">
          {{ formatRange(event.startDate, event.endDate) }}
        </span>
        <AudienceTag :audience="event.audience" />
        <span class="order-last min-w-0 basis-full sm:order-none sm:basis-auto">
          <span class="text-[18.5px] font-medium text-ink">{{ event.title }}</span>
          <span v-if="organizers.length" class="text-[15.5px] text-muted">
            · vede {{ organizerNames(organizers) }}
          </span>
          <span class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              class="rounded-full px-2.5 py-0.5 text-[14.5px]"
              :class="ended ? 'bg-[#efe9da] text-muted' : 'bg-gold-light text-ink'"
              data-testid="deadline"
            >
              {{
                ended
                  ? 'přihlašování skončilo'
                  : `přihlášky do ${formatDay(event.registrationDeadline)}`
              }}
            </span>
            <span
              v-if="daysLeft"
              class="font-hand text-[20px] leading-none font-bold"
              :class="lastDays ? 'text-red' : 'text-brown'"
            >
              {{ daysLeft }}
            </span>
          </span>
        </span>
        <RouterLink
          v-if="event.posterStatus === 'published'"
          :to="{ name: 'event-poster', params: { eventId: event.id }, query: posterQuery }"
          class="ml-auto inline-block -rotate-[1.4deg] border-[1.5px] border-ink bg-gold-light px-2.5 py-0.5 font-hand text-[18px] font-bold text-ink no-underline sm:ml-0 sm:justify-self-end sm:px-3.5 sm:py-1 sm:text-[21px]"
        >
          plakátek
        </RouterLink>
        <span
          v-else
          class="ml-auto inline-block -rotate-[1.4deg] border-[1.5px] border-dashed border-line-strong px-2.5 py-0.5 font-hand text-[16px] font-medium text-brown sm:ml-0 sm:justify-self-end sm:px-3.5 sm:py-1 sm:text-[19px]"
        >
          plakátek se chystá
        </span>
      </div>

      <div
        v-if="children.length"
        class="mt-4 flex flex-col gap-2 border-t border-dashed border-line-soft pt-4"
      >
        <SignUpChild
          v-for="child in children"
          :key="child.member.id"
          :member="child.member"
          :participant="child.participant"
          :mine="child.mine"
          :saving="child.saving"
          :ended="ended"
          :event-title="event.title"
          :today="today"
          :hint="preview && !ended ? 'v náhledu se nic neuloží' : undefined"
          @toggle="click(child)"
        />
      </div>

      <p aria-live="polite" class="m-0 empty:hidden">
        <span v-if="notice" class="note-warm mt-3 block">{{ notice }}</span>
      </p>
      <p v-if="error" role="alert" class="m-0 mt-2 text-[14.5px] text-red">{{ SAVE_ERROR }}</p>
    </article>
  </HandDrawnBox>
</template>
