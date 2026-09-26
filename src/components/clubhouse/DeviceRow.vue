<script setup>
// One device: name + description, state chip, extra controls (slot) and the
// on/off toggle — disabled while the schedule drives the devices.
defineProps({
  name: { type: String, required: true },
  detail: { type: String, required: true },
  state: { type: String, required: true },
  active: { type: Boolean, default: false }, // green state chip
  on: { type: Boolean, required: true },
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-[#ede5d3] py-[15px] last:border-b-0"
  >
    <span class="flex min-w-0 flex-[1_1_190px] flex-col">
      <span class="font-hand text-[23px] leading-[1.1] font-bold text-ink">{{ name }}</span>
      <span class="text-[13.5px] text-brown">{{ detail }}</span>
    </span>
    <span
      class="flex-none rounded-full px-2.5 py-1 text-[12.5px] tracking-[.06em] uppercase"
      :class="active ? 'bg-[#e9f1ea] text-[#1f5138]' : 'bg-[#f2eee1] text-[#4b5749]'"
    >
      {{ state }}
    </span>
    <slot />
    <button
      type="button"
      :aria-pressed="on"
      :aria-label="`${name}: ${on ? 'zapnuto' : 'vypnuto'}`"
      :disabled="locked"
      class="cursor-pointer rounded-full border-[1.5px] px-4 py-[7px] text-[14.5px] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
      :class="
        on
          ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
          : 'border-[#c9bfa6] bg-transparent text-muted'
      "
      @click="emit('toggle')"
    >
      {{ on ? 'zapnuto' : 'vypnuto' }}
    </button>
  </div>
</template>
