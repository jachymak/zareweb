<script setup>
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { EMAIL_RE } from '@shared/waitlistRules'
import { useAuthStore } from '@/stores/auth'
import { useFormErrors } from '@/composables/useFormErrors'
import FormField from '@/components/form/FormField.vue'
import CardTitle from './CardTitle.vue'
import FormMessage from './FormMessage.vue'
import GoogleButton from './GoogleButton.vue'
import HowApprovalWorks from './HowApprovalWorks.vue'
import NoteField from './NoteField.vue'
import OrDivider from './OrDivider.vue'
import { authErrorMessage } from './authText'

// Self-registration: account + pending profile with a note — SPEC §2.4 state 3.
// Google users fill in the note afterwards on the waiting screen.
defineEmits(['back'])

const PASSWORD_MIN = 8

const auth = useAuthStore()
const form = reactive({ name: '', email: '', password: '', note: '' })
const failure = ref('')

const validation = computed(() => ({
  name: !form.name.trim(),
  email: !EMAIL_RE.test(form.email.trim()),
  password: form.password.length < PASSWORD_MIN,
  note: !form.note.trim(),
}))
const formEl = useTemplateRef('formEl')
const { errors, attempt } = useFormErrors(
  validation,
  {
    name: 'Vyplň své jméno.',
    email: 'Zadej platný e-mail.',
    password: `Heslo musí mít alespoň ${PASSWORD_MIN} znaků.`,
    note: 'Napiš, koho u nás máš — podle toho účet schválíme.',
  },
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
  signIn(() =>
    auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      note: form.note.trim(),
    }),
  )
}
</script>

<template>
  <div>
    <CardTitle>Založení účtu</CardTitle>
    <p class="m-0 mb-4 text-base leading-relaxed text-muted">
      Máš u nás dítě v oddíle, nebo jsi vedoucí? Založ si účet a správce ti ho schválí.
    </p>
    <HowApprovalWorks />

    <GoogleButton
      class="mt-5"
      label="Založit účet přes Google"
      :disabled="auth.busy"
      @click="signIn(auth.signInWithGoogle)"
    />
    <OrDivider />

    <form ref="formEl" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FormField label="Tvoje jméno a příjmení" :error="errors.name" v-slot="{ id, describedBy }">
        <input
          :id="id"
          v-model="form.name"
          :aria-describedby="describedBy"
          :aria-invalid="!!errors.name"
          type="text"
          autocomplete="name"
          placeholder="Jana Nováková"
          class="field-input"
        />
      </FormField>
      <FormField label="E-mail" :error="errors.email" v-slot="{ id, describedBy }">
        <input
          :id="id"
          v-model="form.email"
          :aria-describedby="describedBy"
          :aria-invalid="!!errors.email"
          type="email"
          autocomplete="email"
          placeholder="jana@email.cz"
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
          autocomplete="new-password"
          :placeholder="`alespoň ${PASSWORD_MIN} znaků`"
          class="field-input"
        />
      </FormField>
      <NoteField v-model="form.note" :error="errors.note" />
      <button type="submit" class="btn-primary mt-1 w-full" :disabled="auth.busy">
        {{ auth.busy ? 'Zakládám účet…' : 'Založit účet →' }}
      </button>
    </form>
    <FormMessage :error="failure" />

    <button type="button" class="btn-link mt-4" @click="$emit('back')">← zpět na přihlášení</button>
  </div>
</template>
