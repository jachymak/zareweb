<script setup>
import { ref, watch } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'

// One child on a trip: came or not, paid or not, and the amount (defaults to
// the event's price). Signed-up children can be marked „nepřijel“ too.
const props = defineProps({
  member: { type: Object, required: true },
  participant: { type: Object, default: null }, // events/{id}/participants/{memberId}
  price: { type: Number, default: null },
  signedUp: { type: Boolean, default: false },
  showTroop: { type: Boolean, default: false }, // trips of both troops
})
const emit = defineEmits(['update']) // fields to save

const nick = props.member.nickname || props.member.firstName
const amount = ref('')
watch(
  () => props.participant?.amountPaid,
  (value) => (amount.value = value == null ? '' : String(value)),
  { immediate: true },
)

function setAttended(value) {
  emit('update', { attended: props.participant?.attended === value ? null : value })
}

function saveAmount() {
  const text = amount.value.replace(/\s/g, '')
  if (text === '') return emit('update', { amountPaid: null })
  const value = Number(text)
  if (!Number.isInteger(value) || value < 0) {
    amount.value = props.participant?.amountPaid == null ? '' : String(props.participant.amountPaid)
    return
  }
  if (value !== props.participant?.amountPaid) emit('update', { amountPaid: value })
}

const toggle =
  'cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[14px] whitespace-nowrap'
const off = 'border-[#d6ccb4] bg-transparent text-muted'
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2 py-2.5" :aria-label="nick" role="group">
    <span class="flex min-w-0 flex-[1_1_150px] flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <b class="font-hand text-[20px] font-bold text-ink">{{ nick }}</b>
      <AudienceTag v-if="showTroop" :audience="member.troop" class="self-center" />
      <span class="text-[13.5px] text-[#8a7b5e]">{{ member.firstName }} {{ member.lastName }}</span>
    </span>
    <span class="flex gap-[7px]">
      <button
        type="button"
        :aria-pressed="participant?.attended === true"
        :class="[
          toggle,
          participant?.attended === true ? 'border-green bg-[#e9f1ea] text-[#1f5138]' : off,
        ]"
        @click="setAttended(true)"
      >
        přijel
      </button>
      <button
        v-if="signedUp"
        type="button"
        :aria-pressed="participant?.attended === false"
        :class="[
          toggle,
          participant?.attended === false ? 'border-red bg-[#faede4] text-[#8a2f16]' : off,
        ]"
        @click="setAttended(false)"
      >
        nepřijel
      </button>
    </span>
    <span class="flex items-center gap-[7px]">
      <button
        type="button"
        :aria-pressed="!!participant?.paid"
        :class="[toggle, participant?.paid ? 'border-green bg-[#e9f1ea] text-[#1f5138]' : off]"
        @click="emit('update', { paid: !participant?.paid })"
      >
        {{ participant?.paid ? 'zaplaceno' : 'nezaplaceno' }}
      </button>
      <input
        v-model="amount"
        type="text"
        inputmode="numeric"
        :placeholder="price == null ? '' : String(price)"
        :aria-label="`Částka — ${nick}`"
        class="w-[76px] rounded-lg border-[1.5px] border-[#c9bfa6] bg-cream px-2 py-1.5 text-right text-[14.5px] text-ink outline-none focus:border-green"
        @change="saveAmount"
        @keydown.enter="$event.target.blur()"
      />
      <span class="text-[14px] text-[#8a7b5e]">Kč</span>
    </span>
  </div>
</template>
