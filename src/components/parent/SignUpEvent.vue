<script setup>
import { computed, ref } from 'vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from './AudienceTag.vue'
import {
  formatDay,
  formatRange,
  lateSignUpText,
  organizerNames,
  previewSignUpText,
  SAVE_ERROR,
} from './parentText'

// One event open for sign-up: a toggle per eligible child. After the deadline
// the toggles are locked and clicking one says whom to write to. In the
// leaders' preview a click only explains what it would do for the parent.
const props = defineProps({
  event: { type: Object, required: true },
  state: { type: String, required: true }, // 'open' | 'ended'
  organizers: { type: Array, required: true }, // skautisPeople docs, first = main
  children: { type: Array, required: true }, // [{ member, signedUp, saving }]
  error: { type: Boolean, default: false },
  preview: { type: Boolean, default: false }, // leaders' preview: nothing is saved
  posterQuery: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['toggle'])

const ended = computed(() => props.state === 'ended')
const notice = ref('')

function click({ member, signedUp }) {
  const nickname = member.nickname || member.firstName
  if (ended.value) {
    notice.value = lateSignUpText(nickname, props.organizers[0])
  } else if (props.preview) {
    notice.value = previewSignUpText(nickname, signedUp)
  } else {
    emit('toggle', member)
  }
}
</script>

<template>
  <HandDrawnBox class="mb-4 px-5 pt-5 pb-5 sm:px-8 sm:pt-6 sm:pb-6">
    <article :aria-label="event.title">
      <div
        class="flex flex-wrap items-center gap-x-3.5 gap-y-1 sm:grid sm:grid-cols-[108px_42px_minmax(0,1fr)_auto]"
      >
        <span class="font-hand text-[25px] leading-[1.1] font-bold text-ink">
          {{ formatRange(event.startDate, event.endDate) }}
        </span>
        <AudienceTag :audience="event.audience" />
        <span class="min-w-0 basis-full sm:basis-auto">
          <span class="text-[18.5px] font-medium text-ink">{{ event.title }}</span>
          <span v-if="organizers.length" class="text-[15.5px] text-muted">
            · vede {{ organizerNames(organizers) }}
          </span>
        </span>
        <RouterLink
          v-if="event.posterStatus === 'published'"
          :to="{ name: 'event-poster', params: { eventId: event.id }, query: posterQuery }"
          class="inline-block -rotate-[1.4deg] border-[1.5px] border-ink bg-gold-light px-3.5 py-1 font-hand text-[21px] font-bold text-ink no-underline sm:justify-self-end"
        >
          plakátek
        </RouterLink>
        <span
          v-else
          class="inline-block -rotate-[1.4deg] border-[1.5px] border-dashed border-line-strong px-3.5 py-1 font-hand text-[19px] font-medium text-brown sm:justify-self-end"
        >
          plakátek se chystá
        </span>
      </div>

      <div
        class="mt-[13px] flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-dashed border-line-soft pt-3"
      >
        <span class="font-hand text-[21px] text-muted-2">
          {{ children.length > 1 ? 'přihlásit:' : 'přihlásit' }}
        </span>
        <button
          v-for="child in children"
          :key="child.member.id"
          type="button"
          :aria-pressed="child.signedUp"
          :disabled="child.saving"
          :title="preview && !ended ? 'v náhledu se nic neuloží' : undefined"
          class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[15px] disabled:cursor-default"
          :class="[
            child.signedUp
              ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
              : 'border-[#d6ccb4] bg-cream text-muted',
            ended && 'opacity-75',
          ]"
          @click="click(child)"
        >
          <span v-if="child.signedUp" aria-hidden="true">✓</span>
          {{ child.member.nickname || child.member.firstName }}
        </button>
        <span class="text-[14.5px] text-[#8a7b5e] sm:ml-auto" data-testid="deadline">
          {{
            ended
              ? 'přihlašování skončilo'
              : `přihlášky do ${formatDay(event.registrationDeadline)}`
          }}
        </span>
      </div>

      <p aria-live="polite" class="m-0 empty:hidden">
        <span v-if="notice" class="note-warm mt-3 block">{{ notice }}</span>
      </p>
      <p v-if="error" role="alert" class="m-0 mt-2 text-[14.5px] text-red">{{ SAVE_ERROR }}</p>
    </article>
  </HandDrawnBox>
</template>
