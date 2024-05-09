<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  type: String
})

const badgeClass = computed(() => {
  switch (props.type) {
    case "v":
      return "badge text-bg-warning me-2"
    case "s":
      return "badge text-bg-danger me-2"
    case "a":
      return "badge text-bg-primary me-2"
    default:
      return "badge text-bg-secondary me-2"
  }
})

const badgeLabel = computed(() => {
  switch (props.type) {
    case "v":
      return "VLČ"
    case "s":
      return "S&S"
    case "a":
      return "VŠI"
    default:
      return props.type
  }
})

</script>

<template>
  <span :class="badgeClass" >{{ badgeLabel }}</span>
</template>
