<script setup>
import FormField from '@/components/form/FormField.vue'
import YesNoToggle from '@/components/form/YesNoToggle.vue'

// „Znáte někoho z oddílu?“ Ano / Ne, and „Koho?“ when yes.
const knowsSomeone = defineModel('knowsSomeone', { default: null }) // true | false | null
const knowsWhom = defineModel('knowsWhom', { type: String, default: '' })
defineProps({
  errors: { type: Object, required: true }, // { knowsSomeone, knowsWhom } messages
})
</script>

<template>
  <div class="flex flex-col gap-3.5" :data-invalid="errors.knowsSomeone ? '' : undefined">
    <YesNoToggle v-model="knowsSomeone" :invalid="!!errors.knowsSomeone" />
    <span v-if="errors.knowsSomeone" class="text-sm text-red">{{ errors.knowsSomeone }}</span>
    <FormField
      v-if="knowsSomeone"
      label="Koho?"
      :error="errors.knowsWhom"
      v-slot="{ id, describedBy }"
    >
      <input
        :id="id"
        v-model="knowsWhom"
        :aria-describedby="describedBy"
        :aria-invalid="!!errors.knowsWhom"
        type="text"
        placeholder="jméno nebo přezdívka — dítě, vedoucí, rodič…"
        class="field-input"
      />
    </FormField>
  </div>
</template>
