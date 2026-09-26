<script setup>
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { EMAIL_RE } from '@shared/waitlistRules'
import { useAuthStore } from '@/stores/auth'
import { useFormErrors } from '@/composables/useFormErrors'
import FormField from '@/components/form/FormField.vue'
import CardTitle from './CardTitle.vue'
import FormMessage from './FormMessage.vue'
import GoogleButton from './GoogleButton.vue'
import OrDivider from './OrDivider.vue'
import { authErrorMessage } from './authText'

// Login with Google or e-mail + password — SPEC §2.4 state 1.
defineEmits(['forgot', 'register'])

const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const failure = ref('')

const validation = computed(() => ({
  email: !EMAIL_RE.test(form.email.trim()),
  password: !form.password,
}))
const formEl = useTemplateRef('formEl')
const { errors, attempt } = useFormErrors(
  validation,
  { email: 'Zadej platný e-mail.', password: 'Zadej heslo.' },
  formEl,
)

async function signIn(action) {
  failure.value = ''
  try {
    await action()
  } catch (e) {
    failure.value = authErrorMessage(e)
  }
}

function submit() {
  if (auth.busy || !attempt()) return
  signIn(() => auth.signInWithEmail(form.email.trim(), form.password))
}
</script>

<template>
  <div>
    <CardTitle>Přihlášení</CardTitle>
    <GoogleButton class="mt-3" :disabled="auth.busy" @click="signIn(auth.signInWithGoogle)" />
    <OrDivider />

    <form ref="formEl" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FormField label="E-mail" :error="errors.email" v-slot="{ id, describedBy }">
        <input
          :id="id"
          v-model="form.email"
          :aria-describedby="describedBy"
          :aria-invalid="!!errors.email"
          type="email"
          autocomplete="email"
          placeholder="rodic@email.cz"
          class="field-input"
        />
      </FormField>
      <FormField label="Heslo" :error="errors.password" v-slot="{ id, describedBy }">
        <input
          :id="id"
          v-model="form.password"
          :aria-describedby="describedBy"
          :aria-invalid="!!errors.password"
          type="password"
          autocomplete="current-password"
          class="field-input"
        />
      </FormField>
      <button type="submit" class="btn-primary mt-1 w-full" :disabled="auth.busy">
        {{ auth.busy ? 'Přihlašuji…' : 'Přihlásit se →' }}
      </button>
    </form>
    <FormMessage :error="failure" />

    <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1">
      <button type="button" class="btn-link" @click="$emit('forgot')">zapomenuté heslo</button>
      <button type="button" class="btn-link" @click="$emit('register')">
        nemám účet, chci ho založit
      </button>
    </div>
  </div>
</template>
