<script setup>
import { computed, ref, watch } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { nicknameOf } from '@shared/names'

// One child in the trip overview: came, paid and the amount (defaults to the
// event's price), and signing up or off (leaders can do it after the deadline).
const props = defineProps({
  member: { type: Object, required: true },
  participant: { type: Object, default: null }, // events/{id}/participants/{memberId}
  price: { type: Number, default: null },
  showTroop: { type: Boolean, default: false }, // trips of both troops
})
const emit = defineEmits(['update', 'signUp']) // fields to save; new signedUp

const nick = nicknameOf(props.member)
const signedUp = computed(() => !!props.participant?.signedUp)
const came = computed(() => props.participant?.attended === true)
const amount = ref('')
watch(
  () => props.participant?.amountPaid,
  (value) => (amount.value = value == null ? '' : String(value)),
  { immediate: true },
)

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
const on = 'border-green bg-[#e9f1ea] text-[#1f5138]'
const off = 'border-[#d6ccb4] bg-transparent text-muted'
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-[#ede5d3] py-2.5"
    :aria-label="nick"
    role="group"
  >
    <span class="flex min-w-0 flex-[1_1_180px] flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <b class="font-hand text-[20px] font-bold text-ink">{{ nick }}</b>
      <AudienceTag v-if="showTroop" :audience="member.troop" class="self-center" />
      <span class="text-[13.5px] text-[#8a7b5e]">{{ member.firstName }} {{ member.lastName }}</span>
      <span v-if="!signedUp" class="text-[13px] text-red">nepřihlášen(a)</span>
    </span>
    <span class="flex flex-wrap items-center gap-[7px]">
      <button
        type="button"
        :aria-pressed="came"
        :class="[toggle, came ? on : off]"
        @click="emit('update', { attended: came ? null : true })"
      >
        {{ came ? '✓ přijel' : 'přijel' }}
      </button>
      <button
        type="button"
        :aria-pressed="!!participant?.paid"
        :class="[toggle, participant?.paid ? on : off]"
        @click="emit('update', { paid: !participant?.paid })"
      >
        {{ participant?.paid ? '✓ zaplaceno' : 'zaplaceno' }}
      </button>
      <span class="flex items-center gap-[7px]">
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
      <button
        type="button"
        class="cursor-pointer border-0 bg-transparent px-1.5 py-1.5 text-[13.5px] text-[#8a7b5e] underline decoration-[#c9bfa6] underline-offset-2 hover:text-ink"
        @click="emit('signUp', !signedUp)"
      >
        {{ signedUp ? 'odhlásit' : 'přihlásit' }}
      </button>
    </span>
  </div>
</template>
