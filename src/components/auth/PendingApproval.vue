<script setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFormErrors } from '@/composables/useFormErrors'
import CardTitle from './CardTitle.vue'
import FormMessage from './FormMessage.vue'
import NoteField from './NoteField.vue'

// Signed in, waiting for the admin's approval — SPEC §2.4 state 4.
// The profile is live, so the page moves on by itself once approved.
defineEmits(['sign-out'])

const auth = useAuthStore()
const savedNote = computed(() => auth.profile?.note ?? '')

const editing = ref(false)
const note = ref('')
const saving = ref(false)
const failure = ref('')
const showForm = computed(() => editing.value || !savedNote.value)

const steps = computed(() => [
  { text: 'Účet vytvořený', done: true },
  { text: 'Napsáno, koho u nás máš', done: !!savedNote.value },
  { text: 'Schválení správcem — čeká se', done: false },
])

const validation = computed(() => ({ note: !note.value.trim() }))
const formEl = useTemplateRef('formEl')
const { errors, attempt } = useFormErrors(
  validation,
  { note: 'Napiš, koho u nás máš — podle toho účet schválíme.' },
  formEl,
)

function edit() {
  note.value = savedNote.value
  editing.value = true
}

async function submit() {
  if (saving.value || !attempt()) return
  saving.value = true
  failure.value = ''
  try {
    await auth.saveNote(note.value.trim())
    editing.value = false
  } catch (e) {
    console.error('Saving the note failed', e)
    failure.value = 'Poznámku se nepodařilo uložit. Zkus to prosím znovu.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <CardTitle>Čekáme na schválení</CardTitle>
    <p class="m-0 mb-4 text-base leading-relaxed text-muted">
      Správce účet ověří a propojí s tvými dětmi. Pak ti přijde e-mail na
      <strong class="font-medium break-words text-ink">{{ auth.user?.email }}</strong>
      a uvidíš docházku, akce i fotky.
    </p>

    <div class="mb-5 rounded-lg bg-[#f6efdc] px-4 py-3.5">
      <p class="m-0 mb-2 text-[12.5px] tracking-widest text-[#8a7b5e] uppercase">Stav účtu</p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="step in steps" :key="step.text" class="flex items-baseline gap-2.5">
          <span
            class="w-4 flex-none font-hand text-[20px] leading-none font-bold"
            :class="step.done ? 'text-green' : 'text-red'"
            aria-hidden="true"
          >
            {{ step.done ? '✓' : '…' }}
          </span>
          <span class="text-[15.5px] leading-normal" :class="step.done ? 'text-muted' : 'text-ink'">
            {{ step.text }}
          </span>
        </li>
      </ul>
    </div>

    <form
      v-if="showForm"
      ref="formEl"
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="submit"
    >
      <NoteField v-model="note" :error="errors.note" />
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Ukládám…' : 'Uložit →' }}
        </button>
        <button v-if="editing" type="button" class="btn-link" @click="editing = false">
          zrušit
        </button>
      </div>
      <FormMessage :error="failure" />
    </form>

    <div v-else>
      <p class="m-0 text-[14.5px] text-brown">Tvoje poznámka pro správce:</p>
      <p
        class="m-0 mt-1 text-[15.5px] leading-normal break-words whitespace-pre-line text-ink"
        data-testid="saved-note"
      >
        {{ savedNote }}
      </p>
      <button type="button" class="btn-link mt-1" @click="edit">upravit poznámku</button>
    </div>

    <button type="button" class="btn-link mt-5 block" @click="$emit('sign-out')">
      odhlásit se
    </button>
  </div>
</template>
