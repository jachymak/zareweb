<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { childName, searchMembers, troopTag } from './accounts'

// Search among imported children and pick one to pair.
const props = defineProps({
  members: { type: Array, required: true }, // candidates (not paired yet)
  disabled: { type: Boolean, default: false },
})
defineEmits(['pick', 'close'])

const MAX_RESULTS = 8
const text = ref('')
const results = computed(() => searchMembers(props.members, text.value).slice(0, MAX_RESULTS))

const input = useTemplateRef('input')
onMounted(() => input.value?.focus())
</script>

<template>
  <div class="mt-3 rounded-lg bg-[#f6efdc] p-3" @keydown.esc="$emit('close')">
    <div class="flex items-center gap-2">
      <input
        ref="input"
        v-model="text"
        type="search"
        aria-label="Hledat dítě"
        placeholder="jméno nebo přezdívka"
        class="field-input py-2.5 text-base"
      />
      <button type="button" class="btn-link flex-none" @click="$emit('close')">zavřít</button>
    </div>
    <ul class="m-0 mt-2 flex list-none flex-col p-0">
      <li v-for="m in results" :key="m.id">
        <button
          type="button"
          class="flex w-full cursor-pointer items-baseline gap-2 rounded-md border-0 bg-transparent px-2 py-2 text-left text-[15.5px] text-ink hover:bg-paper disabled:cursor-wait"
          :disabled="disabled"
          @click="$emit('pick', m)"
        >
          <b class="font-hand text-[19px] font-bold">{{ m.nickname || m.firstName }}</b>
          <span class="min-w-0 flex-1">{{ childName(m) }}</span>
          <span class="text-[14px] text-brown">{{ troopTag(m.troop) }}</span>
        </button>
      </li>
      <li v-if="!results.length" class="px-2 py-2 text-[15px] text-muted">Nic nenalezeno.</li>
    </ul>
  </div>
</template>
