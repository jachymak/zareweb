<script setup>
defineProps({
  label: { type: String, default: 'Logo oddílu Záře' },
})
</script>

<template>
  <svg viewBox="0 0 100 58" role="img" :aria-label="label" class="block h-auto flex-none">
    <g fill="none" stroke-linecap="round">
      <path d="M6 52 A44 44 0 0 1 94 52" stroke="#E5A83C" stroke-width="6.5" />
      <path d="M22 52 A28 28 0 0 1 78 52" stroke="#D5762D" stroke-width="6" />
      <path d="M37 52 A13 13 0 0 1 63 52" stroke="#C0492A" stroke-width="5.5" />
    </g>
  </svg>
</template>
