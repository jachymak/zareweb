<script setup>
// Result line under a form: an error (role="alert") or a confirmation.
defineProps({
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})
</script>

<template>
  <p v-if="error" role="alert" class="m-0 mt-3 text-[15px] leading-normal text-red">
    {{ error }}
  </p>
  <p v-else-if="success" role="status" class="m-0 mt-3.5 font-hand text-[22px] text-green">
    {{ success }}
  </p>
</template>
