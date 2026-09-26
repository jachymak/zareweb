<script setup>
// Three illustrated cards: dívka / chlapec / jiné.
const model = defineModel({ type: String, default: '' }) // 'girl' | 'boy' | 'other' | ''
defineProps({
  invalid: { type: Boolean, default: false },
})

const options = [
  { value: 'girl', label: 'dívka', tilt: '-rotate-1' },
  { value: 'boy', label: 'chlapec', tilt: 'rotate-[.8deg]' },
  { value: 'other', label: 'jiné', tilt: '-rotate-[.6deg]' },
]
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value"
      class="relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 px-1 pt-3.5 pb-3 transition-colors"
      :class="[
        option.tilt,
        model === option.value
          ? 'border-green bg-green-light'
          : ['bg-paper hover:border-line-strong', invalid ? 'border-red' : 'border-line-soft'],
      ]"
      @click="model = option.value"
    >
      <svg
        viewBox="0 0 80 100"
        class="block h-[70px] w-14 sm:h-20 sm:w-16"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="option.value === 'girl'">
          <circle cx="40" cy="26" r="11" />
          <path d="M30 21 C22 22 19 31 23 36 M50 21 C58 22 61 31 57 36" />
          <path d="M34 39 L40 46 L46 39" stroke="var(--color-red)" />
          <path d="M40 37 L40 50 M40 46 L27 58 M40 46 L53 58" />
          <path d="M40 50 L28 72 L52 72 Z" fill="var(--color-gold-light)" />
          <path d="M34 72 L32 91 M46 72 L48 91" />
        </template>
        <template v-else-if="option.value === 'boy'">
          <circle cx="40" cy="26" r="11" />
          <path d="M29 23 C30 12 50 12 51 23 Z" fill="var(--color-green)" />
          <path d="M51 23 L61 25" />
          <path d="M34 39 L40 46 L46 39" stroke="var(--color-red)" />
          <path d="M40 37 L40 68 M40 47 L27 60 M40 47 L53 60 M40 68 L31 91 M40 68 L49 91" />
        </template>
        <template v-else>
          <circle cx="40" cy="27" r="11" />
          <path d="M24 20 L56 20" />
          <path d="M31 20 C32 9 48 9 49 20" fill="var(--color-gold)" />
          <path d="M34 40 L40 47 L46 40" stroke="var(--color-red)" />
          <path d="M40 38 L40 68 M40 48 L26 38 M40 48 L55 36 M40 68 L31 91 M40 68 L49 91" />
        </template>
      </svg>
      <span class="font-hand text-[23px] leading-none font-bold text-ink sm:text-[25px]">
        {{ option.label }}
      </span>
      <span
        v-if="model === option.value"
        class="absolute top-2 right-2.5 grid size-6 place-items-center rounded-full bg-green text-sm text-cream"
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  </div>
</template>
