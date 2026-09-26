<script setup>
import { useId } from 'vue'

// Label + control + error message. The slot receives `{ id, describedBy }`
// to bind on the control. Use `tag="fieldset"` for groups of buttons.
const props = defineProps({
  label: { type: String, required: true },
  error: { type: String, default: '' },
  tag: { type: String, default: 'div' },
})

const id = useId()
const errorId = `${id}-error`
</script>

<template>
  <component
    :is="tag"
    class="m-0 flex min-w-0 flex-col gap-[7px] border-0 p-0"
    :data-invalid="error ? '' : undefined"
    :aria-describedby="tag === 'fieldset' && error ? errorId : undefined"
  >
    <legend v-if="tag === 'fieldset'" class="mb-[7px] p-0 text-[15px] font-medium text-ink">
      {{ label }}
    </legend>
    <label v-else :for="id" class="text-[15px] font-medium text-ink">{{ label }}</label>
    <slot :id="id" :described-by="error ? errorId : undefined" />
    <span v-if="error" :id="errorId" class="text-sm text-red">{{ error }}</span>
  </component>
</template>
