<script setup>
import { ref } from 'vue'
import { TROOPS } from '@/constants/troops'
import { nicknameOf } from '@shared/names'

// „+ přihlásit dítě“ / „+ přišel někdo nepřihlášený“: picks one of the children
// not on the trip's list yet, instead of listing them all.
defineProps({
  children: { type: Array, required: true }, // members
  label: { type: String, required: true },
  showTroop: { type: Boolean, default: false },
})
const emit = defineEmits(['pick']) // member id

const tagOf = (code) => TROOPS.find((t) => t.code === code)?.tag
const value = ref('')

function pick() {
  if (value.value) emit('pick', value.value)
  value.value = ''
}
</script>

<template>
  <div v-if="children.length" class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
    <span class="font-hand text-[21px] font-bold text-green" aria-hidden="true">+ {{ label }}</span>
    <select
      v-model="value"
      :aria-label="label"
      class="min-h-10 max-w-full min-w-0 flex-[0_1_280px] cursor-pointer rounded-lg border-[1.5px] border-[#c9bfa6] bg-cream px-2.5 py-1.5 text-[15px] text-ink"
      @change="pick"
    >
      <option value="">vyber dítě…</option>
      <option v-for="m in children" :key="m.id" :value="m.id">
        {{ nicknameOf(m) }} ({{ m.firstName }} {{ m.lastName
        }}{{ showTroop ? `, ${tagOf(m.troop)}` : '' }})
      </option>
    </select>
  </div>
</template>
