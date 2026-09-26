<script setup>
// Ano / Ne pill buttons bound to a boolean (null = nothing chosen).
const model = defineModel({ default: null }) // true | false | null
defineProps({
  invalid: { type: Boolean, default: false },
})

const options = [
  { value: true, label: 'Ano' },
  { value: false, label: 'Ne' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2.5">
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      :aria-pressed="model === option.value"
      class="cursor-pointer rounded-full border-[1.5px] px-[26px] py-[11px] text-[16.5px] transition-colors"
      :class="[
        model === option.value ? 'border-green bg-green text-cream' : 'bg-transparent text-green',
        invalid && model !== option.value ? 'border-red' : 'border-green',
      ]"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
