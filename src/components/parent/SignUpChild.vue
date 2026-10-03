<script setup>
import { computed, ref } from 'vue'
import { formatTimestampTime } from './parentText'
import { nicknameOf } from '@shared/names'

// One child under an event open for sign-up: the state in words, when it was
// changed and by whom, and one button. Signing off asks first, right in the card.
const props = defineProps({
  member: { type: Object, required: true },
  participant: { type: Object, default: null }, // events/{id}/participants/{memberId}
  mine: { type: Boolean, default: false }, // changed by the signed-in parent
  saving: { type: Boolean, default: false },
  ended: { type: Boolean, default: false }, // past the deadline: a click only explains
  eventTitle: { type: String, required: true },
  today: { type: String, required: true },
  hint: { type: String, default: undefined }, // button tooltip (leaders' preview)
})
const emit = defineEmits(['toggle'])

const nick = nicknameOf(props.member)
const signedUp = computed(() => !!props.participant?.signedUp)
const confirming = ref(false)

// „přihlásili jste dnes v 14:05“ — only for a change of the sign-up itself.
const changed = computed(() => {
  const when = formatTimestampTime(props.participant?.signedUpAt, props.today)
  if (!when) return ''
  const what = signedUp.value
    ? props.mine
      ? 'přihlásili jste'
      : 'přihlášeno'
    : props.mine
      ? 'odhlásili jste'
      : 'odhlášeno'
  return `${what} ${when}`
})

// After the deadline the button only says whom to write to.
const label = computed(() => {
  if (props.saving) return 'ukládá se…'
  if (props.ended) return 'chci to změnit'
  return signedUp.value ? 'odhlásit' : 'přihlásit'
})

function click() {
  if (signedUp.value && !props.ended) confirming.value = true
  else emit('toggle')
}

function confirmOff() {
  confirming.value = false
  emit('toggle')
}

const button =
  'min-h-9 cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[15px] whitespace-nowrap disabled:cursor-default'
</script>

<template>
  <div
    role="group"
    :aria-label="nick"
    class="rounded-[3px] border-[1.5px] px-3.5 py-2.5"
    :class="
      signedUp ? 'border-[#b9d3c1] bg-[#eef5ef]' : 'border-dashed border-[#d6ccb4] bg-[#fbf8f0]'
    "
  >
    <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2">
      <span class="min-w-0 flex-[1_1_140px]">
        <span class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <b class="font-hand text-[22px] leading-[1.1] font-bold text-ink">{{ nick }}</b>
          <span
            class="rounded-full px-2.5 py-0.5 text-[13.5px]"
            :class="signedUp ? 'bg-white font-medium text-[#1f5138]' : 'bg-[#efe9da] text-muted'"
            data-testid="signup-state"
          >
            {{ signedUp ? '✓ přihlášeno' : 'nepřihlášeno' }}
          </span>
        </span>
        <span v-if="changed" class="mt-0.5 block text-[13.5px] text-[#8a7b5e]">
          {{ changed }}
        </span>
      </span>
      <button
        v-if="!confirming"
        type="button"
        :disabled="saving"
        :title="hint"
        :class="[
          button,
          signedUp || ended
            ? 'border-[#c9bfa6] bg-cream text-muted'
            : 'border-green bg-green text-cream',
        ]"
        @click="click"
      >
        {{ label }}
      </button>
    </div>
    <div v-if="confirming" class="note-warm mt-2.5" role="alert">
      <p class="m-0 mb-2.5">Opravdu zrušit přihlášku na akci „{{ eventTitle }}“ ({{ nick }})?</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          :class="button"
          class="border-[#d08a6a] bg-transparent text-[#8a2f16]"
          @click="confirmOff"
        >
          ano, odhlásit
        </button>
        <button
          type="button"
          :class="button"
          class="border-[#c9bfa6] bg-cream text-ink"
          @click="confirming = false"
        >
          ne, nechat přihlášené
        </button>
      </div>
    </div>
  </div>
</template>
