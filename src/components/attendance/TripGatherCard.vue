<script setup>
import { computed } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatCzk } from './attendanceText'
import { nicknameOf } from '@shared/names'

// One child at the meeting point: tapping the card marks „přijel“, the amount
// button marks „zaplatil“ — and „přijel“ with it, since who pays has come.
const props = defineProps({
  member: { type: Object, required: true },
  participant: { type: Object, default: null }, // events/{id}/participants/{memberId}
  price: { type: Number, default: null },
  showTroop: { type: Boolean, default: false }, // trips of both troops
})
const emit = defineEmits(['update']) // fields to save

const nick = nicknameOf(props.member)
const came = computed(() => props.participant?.attended === true)
const paid = computed(() => !!props.participant?.paid)
const amount = computed(() => props.participant?.amountPaid ?? props.price)

const toggleCame = () => emit('update', { attended: came.value ? null : true })
const togglePaid = () =>
  emit('update', paid.value ? { paid: false } : { paid: true, attended: true })
</script>

<template>
  <div
    role="group"
    :aria-label="nick"
    class="flex min-w-0 items-stretch rounded-[3px] border-[1.5px]"
    :class="came ? 'border-green bg-[#e9f1ea]' : 'border-[#d6ccb4] bg-cream'"
  >
    <button
      type="button"
      :aria-pressed="came"
      :aria-label="`${nick} přijel`"
      class="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent px-3 py-3 text-left"
      @click="toggleCame"
    >
      <span
        class="flex size-7 flex-none items-center justify-center rounded border-2 font-hand text-[23px] leading-none font-bold text-green"
        :class="came ? 'border-green bg-white' : 'border-[#c9bfa6]'"
        aria-hidden="true"
      >
        {{ came ? '✓' : '' }}
      </span>
      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-x-2">
          <span class="font-hand text-[22px] leading-[1.1] font-bold text-ink">{{ nick }}</span>
          <AudienceTag v-if="showTroop" :audience="member.troop" />
        </span>
        <span class="block truncate text-[12.5px] text-[#8a7b5e]">
          {{ member.firstName }} {{ member.lastName }}
          <template v-if="!participant?.signedUp"> · nepřihlášen(a)</template>
        </span>
      </span>
    </button>
    <button
      type="button"
      :aria-pressed="paid"
      :aria-label="`${nick} zaplatil`"
      class="m-2 flex-none cursor-pointer self-center rounded-full border-[1.5px] px-3.5 py-2 text-[15px] whitespace-nowrap"
      :class="
        paid
          ? 'border-green bg-green font-medium text-cream'
          : 'border-[#c9bfa6] bg-white text-muted'
      "
      @click="togglePaid"
    >
      {{ paid ? '✓ ' : '' }}{{ amount == null ? 'zaplatil' : formatCzk(amount) }}
    </button>
  </div>
</template>
