<script setup>
import { GRADE_NONE, GRADE_SECONDARY } from '@shared/waitlistRules'

// Grade buttons: 1.–9., „ještě nechodí do školy“ (0), „střední škola“ (10).
const model = defineModel({ type: Number, default: null })
const props = defineProps({
  invalid: { type: Boolean, default: false },
})

const primary = Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: `${i + 1}.` }))
const other = [
  { value: GRADE_NONE, label: 'ještě nechodí do školy' },
  { value: GRADE_SECONDARY, label: 'střední škola' },
]

function classes(value) {
  if (model.value === value) return 'border-green bg-green font-semibold text-cream'
  return [
    'bg-paper text-ink hover:border-line-strong',
    props.invalid ? 'border-red' : 'border-line',
  ]
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="grid max-w-[520px] grid-cols-5 gap-1.5 sm:grid-cols-9">
      <button
        v-for="grade in primary"
        :key="grade.value"
        type="button"
        :aria-pressed="model === grade.value"
        :aria-label="`${grade.value}. třída`"
        class="h-11 min-w-0 cursor-pointer rounded-full border-[1.5px] p-0 text-base transition-colors"
        :class="classes(grade.value)"
        @click="model = grade.value"
      >
        {{ grade.label }}
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="grade in other"
        :key="grade.value"
        type="button"
        :aria-pressed="model === grade.value"
        class="h-11 cursor-pointer rounded-full border-[1.5px] px-[18px] text-base transition-colors"
        :class="classes(grade.value)"
        @click="model = grade.value"
      >
        {{ grade.label }}
      </button>
    </div>
  </div>
</template>
