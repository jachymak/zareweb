<script setup>
// „uložit“ with the save state next to it (useSaveState).
defineProps({
  saving: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  dirty: { type: Boolean, default: false }, // unsaved changes
  error: { type: String, default: '' },
  label: { type: String, default: 'uložit' },
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <button type="submit" class="btn-primary px-7 py-3" :disabled="saving">
      {{ saving ? 'ukládám…' : label }}
    </button>
    <slot />
    <p v-if="error" role="alert" class="m-0 text-[15px] text-red">{{ error }}</p>
    <p v-else-if="saved && !dirty" role="status" class="m-0 font-hand text-[22px] text-green">
      uloženo ✓
    </p>
    <p v-else-if="dirty" class="m-0 text-[14.5px] text-brown">neuložené změny</p>
  </div>
</template>
