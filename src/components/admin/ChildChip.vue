<script setup>
import { childName, troopTag } from './accounts'

// A paired child: nickname + troop, × to unpair.
const props = defineProps({
  member: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
defineEmits(['remove'])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-[#f2eee1] py-1 pr-1 pl-3 text-[14.5px] text-text"
    :title="childName(member)"
  >
    <b class="font-hand text-[19px] leading-none font-bold text-ink">
      {{ member.nickname || member.firstName }}
    </b>
    {{ troopTag(member.troop) }}
    <span v-if="!member.active" class="text-[13px] text-brown">· neaktivní</span>
    <button
      type="button"
      class="grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[17px] leading-none text-[#8a2f16] hover:bg-red-light disabled:cursor-wait"
      :aria-label="`Odebrat ${childName(props.member)}`"
      :disabled="disabled"
      @click="$emit('remove')"
    >
      ×
    </button>
  </span>
</template>
