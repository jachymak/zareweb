<script setup>
import NoteIcon from './NoteIcon.vue'
import { AGE_OPTIONS, GENDER_CHIPS, GRADE_OPTIONS } from './waitlistAdminText'

// Filters above the table: gender chips, age and grade selects, „jen s
// poznámkou“; the shown count, CSV download and „zrušit filtry“.
const filters = defineModel({ type: Object, required: true })
defineProps({
  schoolYearLabel: { type: String, required: true }, // „2027/28“
  noteCount: { type: Number, required: true },
  shown: { type: Number, required: true },
  total: { type: Number, required: true },
  filtered: { type: Boolean, required: true },
})
defineEmits(['csv', 'clear'])

const set = (key, value) => (filters.value = { ...filters.value, [key]: value })

const chip =
  'flex h-[38px] cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-3.5 text-[15px]'
const select =
  'h-[38px] rounded-[10px] border-[1.5px] border-line bg-paper px-2.5 text-[15px] text-ink'
</script>

<template>
  <div class="flex flex-wrap items-end gap-x-[18px] gap-y-3.5">
    <div class="flex flex-col gap-1.5" role="group" aria-labelledby="filter-gender">
      <span id="filter-gender" class="text-[13px] text-muted-2">Pohlaví</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="c in GENDER_CHIPS"
          :key="c.value"
          type="button"
          :aria-pressed="filters.gender === c.value"
          :class="[
            chip,
            filters.gender === c.value
              ? 'border-ink bg-ink text-cream'
              : 'border-line bg-paper text-ink hover:border-trail',
          ]"
          @click="set('gender', c.value)"
        >
          <span class="size-2.5 rounded-full" :style="{ background: c.dot }" />{{ c.label }}
        </button>
      </div>
    </div>
    <label class="flex flex-col gap-1.5">
      <span class="text-[13px] text-muted-2">Věk</span>
      <select :class="select" :value="filters.age" @change="set('age', $event.target.value)">
        <option v-for="o in AGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-[13px] text-muted-2">Třída {{ schoolYearLabel }}</span>
      <select :class="select" :value="filters.grade" @change="set('grade', $event.target.value)">
        <option v-for="o in GRADE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </label>
    <button
      type="button"
      :aria-pressed="filters.noteOnly"
      :class="[
        chip,
        'text-ink',
        filters.noteOnly ? 'border-gold bg-gold-light' : 'border-line bg-paper hover:border-trail',
      ]"
      @click="set('noteOnly', !filters.noteOnly)"
    >
      <NoteIcon class="size-[18px]" />jen s poznámkou ({{ noteCount }})
    </button>
    <div class="flex w-full flex-wrap items-center gap-x-3.5 gap-y-2 lg:ml-auto lg:w-auto">
      <span class="text-[14.5px] text-muted-2" role="status">
        zobrazeno {{ shown }} z {{ total
        }}<span class="hidden lg:inline"> · řaďte kliknutím na ↕ v záhlaví</span>
      </span>
      <button
        type="button"
        title="Stáhne právě zobrazené řádky"
        class="flex h-9 cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] border-green bg-paper px-3.5 text-[14.5px] text-green hover:bg-green-light"
        @click="$emit('csv')"
      >
        <svg
          viewBox="0 0 24 24"
          class="block size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4 L12 15 M7.5 10.5 L12 15 L16.5 10.5 M5 19 L19 19" />
        </svg>
        Stáhnout CSV
      </button>
      <button
        v-if="filtered"
        type="button"
        class="cursor-pointer border-0 bg-transparent px-0 py-2 text-[14.5px] text-red underline underline-offset-[3px]"
        @click="$emit('clear')"
      >
        zrušit filtry
      </button>
    </div>
  </div>
</template>
