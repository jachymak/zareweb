<script setup>
import { computed } from 'vue'

// Optional link of a news item; only http(s) URLs are shown.
const props = defineProps({
  item: { type: Object, required: true },
})
const safe = computed(() => /^https?:\/\//i.test(props.item.linkUrl ?? ''))
</script>

<template>
  <p v-if="safe" class="m-0 mt-2 text-[15.5px]">
    <a :href="item.linkUrl" target="_blank" rel="noopener">{{ item.linkLabel || item.linkUrl }}</a>
  </p>
</template>
