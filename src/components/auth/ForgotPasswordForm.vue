<script setup>
import { computed, ref, useTemplateRef } from 'vue'
import { EMAIL_RE } from '@shared/waitlistRules'
import { useAuthStore } from '@/stores/auth'
import { useFormErrors } from '@/composables/useFormErrors'
import FormField from '@/components/form/FormField.vue'
import CardTitle from './CardTitle.vue'
import FormMessage from './FormMessage.vue'
import { authErrorMessage } from './authText'

// Password reset e-mail (Firebase's hosted reset page) — SPEC §2.4 state 2.
defineEmits(['back'])

const auth = useAuthStore()
const email = ref('')
const sending = ref(false)
const sent = ref(false)
const failure = ref('')

const validation = computed(() => ({ email: !EMAIL_RE.test(email.value.trim()) }))
const formEl = useTemplateRef('formEl')
const { errors, attempt } = useFormErrors(validation, { email: 'Zadej platný e-mail.' }, formEl)

async function submit() {
  if (sending.value || !attempt()) return
  sending.value = true
  failure.value = ''
  sent.value = false
  try {
    await auth.sendPasswordReset(email.value.trim())
    sent.value = true
  } catch (e) {
    // Don't reveal whether an account exists.
    if (e.code === 'auth/user-not-found') sent.value = true
    else failure.value = authErrorMessage(e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <CardTitle>Zapomenuté heslo</CardTitle>
    <p class="m-0 mb-5 text-base leading-relaxed text-muted">
      Napiš e-mail, kterým se přihlašuješ. Pošleme na něj odkaz na nastavení nového hesla — platí 60
      minut.
    </p>

    <form ref="formEl" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FormField label="E-mail" :error="errors.email" v-slot="{ id, describedBy }">
        <input
          :id="id"
          v-model="email"
          :aria-describedby="describedBy"
          :aria-invalid="!!errors.email"
          type="email"
          autocomplete="email"
          placeholder="rodic@email.cz"
          class="field-input"
        />
      </FormField>
      <button type="submit" class="btn-primary mt-1 w-full" :disabled="sending">
        {{ sending ? 'Posílám…' : 'Poslat odkaz →' }}
      </button>
    </form>
    <FormMessage
      :error="failure"
      :success="sent ? 'Hotovo — mrkni do e-mailu (i do spamu).' : ''"
    />

    <p class="m-0 mt-4 text-[14.5px] leading-normal text-brown">
      Přihlašuješ se Googlem? Pak heslo řešit nemusíš — stačí tlačítko Googlem.
    </p>
    <button type="button" class="btn-link mt-3" @click="$emit('back')">← zpět na přihlášení</button>
  </div>
</template>
