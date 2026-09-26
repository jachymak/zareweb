<script setup>
import { formatPhone } from '@shared/waitlistRules'
import FormField from '@/components/form/FormField.vue'

// Parent name, e-mail and phone (formatted while typing).
const parentName = defineModel('parentName', { type: String, default: '' })
const email = defineModel('email', { type: String, default: '' })
const phone = defineModel('phone', { type: String, default: '' })
defineProps({
  errors: { type: Object, required: true }, // { parentName, email, phone } messages
})

function onPhone(event) {
  const value = formatPhone(event.target.value)
  phone.value = value
  event.target.value = value
}
</script>

<template>
  <FormField
    label="Jméno a příjmení rodiče"
    :error="errors.parentName"
    v-slot="{ id, describedBy }"
  >
    <input
      :id="id"
      v-model="parentName"
      :aria-describedby="describedBy"
      :aria-invalid="!!errors.parentName"
      type="text"
      autocomplete="name"
      class="field-input"
    />
  </FormField>

  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <FormField label="E-mail" :error="errors.email" v-slot="{ id, describedBy }">
      <input
        :id="id"
        v-model="email"
        :aria-describedby="describedBy"
        :aria-invalid="!!errors.email"
        type="email"
        autocomplete="email"
        class="field-input"
      />
    </FormField>
    <FormField label="Telefon" :error="errors.phone" v-slot="{ id, describedBy }">
      <input
        :id="id"
        :value="phone"
        :aria-describedby="describedBy"
        :aria-invalid="!!errors.phone"
        type="tel"
        autocomplete="tel"
        placeholder="+420 123 456 789"
        class="field-input"
        @input="onPhone"
      />
    </FormField>
  </div>
  <span class="note-warm -mt-3">
    Pečlivě zkontrolujte, prosím — údaje o rodiči slouží pro následnou komunikaci.
  </span>
</template>
