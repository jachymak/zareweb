<script setup>
import { useTemplateRef } from 'vue'

// DD . MM . RRRR — digits only; focus moves on after two digits.
const day = defineModel('day', { type: String, default: '' })
const month = defineModel('month', { type: String, default: '' })
const year = defineModel('year', { type: String, default: '' })
defineProps({
  invalid: { type: Boolean, default: false },
})

const monthInput = useTemplateRef('monthInput')
const yearInput = useTemplateRef('yearInput')

function digits(event, maxLength) {
  const value = event.target.value.replace(/\D/g, '').slice(0, maxLength)
  event.target.value = value // keep the field in sync when input was rejected
  return value
}

// Note: a model ref reads the parent's value, which updates only after the
// parent re-renders — so check the new value, not the model.
function onDay(event) {
  const value = digits(event, 2)
  day.value = value
  if (value.length === 2) monthInput.value.focus()
}

function onMonth(event) {
  const value = digits(event, 2)
  month.value = value
  if (value.length === 2) yearInput.value.focus()
}

// Typing over a filled field (e.g. after auto-advance) replaces its value.
function selectAll(event) {
  event.target.select()
}

function onYear(event) {
  year.value = digits(event, 4)
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <input
      :value="day"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="2"
      placeholder="DD"
      aria-label="Den narození"
      :aria-invalid="invalid"
      class="field-input w-16 px-1.5 py-3 text-center"
      @focus="selectAll"
      @input="onDay"
    />
    <span class="text-xl text-trail" aria-hidden="true">.</span>
    <input
      ref="monthInput"
      :value="month"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="2"
      placeholder="MM"
      aria-label="Měsíc narození"
      :aria-invalid="invalid"
      class="field-input w-16 px-1.5 py-3 text-center"
      @focus="selectAll"
      @input="onMonth"
    />
    <span class="text-xl text-trail" aria-hidden="true">.</span>
    <input
      ref="yearInput"
      :value="year"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="4"
      placeholder="RRRR"
      aria-label="Rok narození"
      :aria-invalid="invalid"
      class="field-input w-[88px] px-1.5 py-3 text-center"
      @focus="selectAll"
      @input="onYear"
    />
  </div>
</template>
