<script setup>
import FormField from '@/components/form/FormField.vue'
import { NOTE_MAX } from './authText'

// The note for the admin: who the user is and which children they have.
const note = defineModel({ type: String, default: '' })
defineProps({
  error: { type: String, default: '' },
})
</script>

<template>
  <FormField label="Koho u nás máš?" :error="error" v-slot="{ id, describedBy }">
    <span class="-mt-0.5 text-[14.5px] leading-normal text-muted">
      Napiš jména (a přezdívky) dětí, které k nám chodí, a do kterého oddílu. Pokud jsi vedoucí,
      napiš svou přezdívku.
    </span>
    <textarea
      :id="id"
      v-model="note"
      :aria-describedby="describedBy"
      :aria-invalid="!!error"
      :maxlength="NOTE_MAX"
      rows="3"
      placeholder="Anna Nováková (Žabka), vlčušky"
      class="field-input resize-y"
    />
  </FormField>
</template>
