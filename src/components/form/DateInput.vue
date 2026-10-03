<script setup>
import { ref, useTemplateRef, watch } from 'vue'
import { parseBirthDate } from '@shared/waitlistRules'

// A date shown and typed as DD. MM. RRRR — the browser's own date field
// follows its language (e.g. month first) — with a calendar button opening the
// browser's picker. The model is `YYYY-MM-DD`, or '' while empty or not a
// valid date; `incomplete` tells the second case apart.
const model = defineModel({ type: String, default: '' })
const incomplete = defineModel('incomplete', { type: Boolean, default: false })
defineProps({
  label: { type: String, required: true },
  invalid: { type: Boolean, default: false },
})

const format = (iso) => (iso ? `${iso.slice(8)}. ${iso.slice(5, 7)}. ${iso.slice(0, 4)}` : '')

// „14. 3. 2027“, „14.3.2027“, „14 3 2027“, „14032027“
function parse(text) {
  const compact = text.replace(/\s/g, '')
  const m =
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(compact) ??
    /^(\d{2})(\d{2})(\d{4})$/.exec(compact) ??
    /^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/.exec(text.trim())
  return m ? parseBirthDate(m[1], m[2], m[3]) : null
}

const text = ref('')
watch(
  model,
  (value) => {
    if (value !== (parse(text.value) ?? '')) text.value = format(value)
  },
  { immediate: true },
)

// A model ref reads the parent's value, which updates only after the parent
// re-renders — so work with the parsed value, not the model.
function onInput(event) {
  if (event) text.value = event.target.value
  const date = parse(text.value) ?? ''
  model.value = date
  incomplete.value = !date && !!text.value.trim()
}

// Tidy up to the canonical form once a valid date is typed.
function onBlur() {
  const date = parse(text.value)
  if (date) text.value = format(date)
}

const picker = useTemplateRef('picker')
function openPicker() {
  try {
    picker.value.showPicker()
  } catch {
    picker.value.focus()
  }
}
function onPicked(event) {
  text.value = format(event.target.value)
  onInput()
}
</script>

<template>
  <span class="relative inline-flex items-center gap-1.5">
    <input
      :value="text"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      placeholder="DD. MM. RRRR"
      :aria-label="label"
      :aria-invalid="invalid"
      class="field-input w-[150px]! px-3! py-2! text-[15px]!"
      @input="onInput"
      @blur="onBlur"
    />
    <button
      type="button"
      class="flex size-10 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-line bg-paper text-muted hover:border-green hover:text-green"
      :aria-label="`Vybrat v kalendáři — ${label}`"
      @click="openPicker"
    >
      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" stroke-linecap="round" />
      </svg>
    </button>
    <input
      ref="picker"
      type="date"
      :value="model"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none absolute right-0 bottom-0 size-0 opacity-0"
      @change="onPicked"
    />
  </span>
</template>
