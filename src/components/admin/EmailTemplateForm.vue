<script setup>
import { computed, ref } from 'vue'
import { EMAILS, emailTemplate, missingPlaceholders } from '@shared/emails'
import { useSaveState } from '@/composables/useSaveState'
import { updateEmailSettings } from '@/services/settings'
import FormField from '@/components/form/FormField.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import EmailPreview from './EmailPreview.vue'
import SaveBar from './SaveBar.vue'

// Text of one automated e-mail (settings/emails.{emailKey}) with a live
// preview; switchable e-mails can be turned off. Collapsed to a bar with the
// subject until opened.
const props = defineProps({
  emailKey: { type: String, required: true }, // key of EMAILS
  stored: { type: Object, default: null }, // saved { subject, body, enabled? }
  title: { type: String, required: true },
  description: { type: String, required: true },
  samples: { type: Object, default: () => ({}) }, // preview values
})

const spec = EMAILS[props.emailKey]
const tag = (name) => `{${name}}`
const saved = ref(emailTemplate(props.emailKey, props.stored))
const subject = ref(saved.value.subject)
const body = ref(saved.value.body)
const enabled = ref(saved.value.enabled)
const errors = ref({})

const summary = computed(() => (saved.value.enabled ? saved.value.subject : 'neposílá se'))

const dirty = computed(
  () =>
    subject.value !== saved.value.subject ||
    body.value !== saved.value.body ||
    enabled.value !== saved.value.enabled,
)
const isDefault = computed(
  () => subject.value === spec.default.subject && body.value === spec.default.body,
)

function restoreDefault() {
  subject.value = spec.default.subject
  body.value = spec.default.body
}

const saveState = useSaveState()

async function submit() {
  const missing = missingPlaceholders(props.emailKey, body.value)
  errors.value = {
    ...(subject.value.trim() ? {} : { subject: 'Vyplň předmět.' }),
    ...(missing.length
      ? { body: `Text musí obsahovat ${missing.map((p) => `{${p}}`).join(', ')}.` }
      : {}),
  }
  if (Object.keys(errors.value).length) return
  const template = {
    subject: subject.value.trim(),
    body: body.value.trim(),
    ...(spec.switchable && { enabled: enabled.value }),
  }
  if (await saveState.save(() => updateEmailSettings({ [props.emailKey]: template }))) {
    saved.value = emailTemplate(props.emailKey, template)
    subject.value = saved.value.subject
    body.value = saved.value.body
  }
}
</script>

<template>
  <CollapsibleSection
    tag="form"
    novalidate
    :title="title"
    :summary="summary"
    :data-testid="`email-${emailKey}`"
    @submit.prevent="submit"
  >
    <p class="m-0 mb-3 max-w-[70ch] text-[14.5px] leading-normal text-muted">
      {{ description }}
    </p>

    <label
      v-if="spec.switchable"
      class="mb-3 flex cursor-pointer items-center gap-2.5 text-[15.5px] font-medium text-ink"
    >
      <input v-model="enabled" type="checkbox" class="size-[18px] accent-green" />
      posílat tenhle e-mail
    </label>

    <template v-if="enabled">
      <p class="m-0 mb-4 text-[14px] leading-normal text-muted-2">
        Odstavce odděl prázdným řádkem. Doplní se:
        <template v-for="(desc, name, i) in spec.placeholders" :key="name">
          {{ i ? ' · ' : '' }}<code class="text-ink">{{ tag(name) }}</code> {{ desc }}
        </template>
      </p>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3.5">
          <FormField v-slot="{ id, describedBy }" label="Předmět" :error="errors.subject">
            <input
              :id="id"
              v-model="subject"
              type="text"
              maxlength="120"
              class="field-input py-2.5"
              :aria-invalid="!!errors.subject"
              :aria-describedby="describedBy"
            />
          </FormField>
          <FormField v-slot="{ id, describedBy }" label="Text" :error="errors.body">
            <textarea
              :id="id"
              v-model="body"
              rows="12"
              class="field-input resize-y py-2.5 text-[15.5px] leading-[1.6]"
              :aria-invalid="!!errors.body"
              :aria-describedby="describedBy"
            />
          </FormField>
        </div>
        <div class="min-w-0">
          <p class="m-0 mb-[7px] text-[15px] font-medium text-ink">Náhled</p>
          <EmailPreview
            :template="{ subject, body }"
            :placeholders="spec.placeholders"
            :samples="samples"
          />
        </div>
      </div>
    </template>
    <p v-else class="m-0 mb-1 text-[15px] text-muted italic">Tenhle e-mail se neposílá.</p>

    <SaveBar
      class="mt-4"
      :saving="saveState.saving.value"
      :saved="saveState.saved.value"
      :dirty="dirty"
      :error="saveState.error.value"
    >
      <button v-if="enabled && !isDefault" type="button" class="btn-link" @click="restoreDefault">
        vrátit původní text
      </button>
    </SaveBar>
  </CollapsibleSection>
</template>
