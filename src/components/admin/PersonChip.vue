<script setup>
import { personName, troopTag } from './accounts'
import { nicknameOf } from '@shared/names'

// A child or a leader paired with an account: nickname + troop, × to unpair.
const props = defineProps({
  person: { type: Object, required: true }, // `members` or `skautisPeople` doc
  disabled: { type: Boolean, default: false },
})
defineEmits(['remove'])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-[#f2eee1] py-1 pr-1 pl-3 text-[14.5px] text-text"
    :title="personName(person)"
  >
    <b class="font-hand text-[19px] leading-none font-bold text-ink">
      {{ nicknameOf(person) }}
    </b>
    {{ troopTag(person.troop) }}
    <span v-if="!person.active" class="text-[13px] text-brown">· neaktivní</span>
    <button
      type="button"
      class="grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[17px] leading-none text-[#8a2f16] hover:bg-red-light disabled:cursor-wait"
      :aria-label="`Odebrat ${personName(props.person)}`"
      :disabled="disabled"
      @click="$emit('remove')"
    >
      ×
    </button>
  </span>
</template>
