<script setup>
  const props = defineProps({
    month: {
      type: String,
      required: true,
    }
  });
</script>

<template>
  <div class="mt-4">
    <h5>{{ month }}</h5>
    <slot />
  </div>
</template>
