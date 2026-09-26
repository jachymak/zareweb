<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { DEFAULT_MAX_AGE, DEFAULT_WARN_AGE, MAX_AGE_ABSOLUTE } from '@shared/waitlistRules'
import { useSaveState } from '@/composables/useSaveState'
import { updatePublicSettings } from '@/services/settings'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import FormField from '@/components/form/FormField.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import SaveBar from './SaveBar.vue'

// Waiting-list age limits (settings/public) — SPEC §4.8 Čekací listina.
const publicSettings = usePublicSettingsStore()
const form = reactive({ waitlistWarnAge: DEFAULT_WARN_AGE, waitlistMaxAge: DEFAULT_MAX_AGE })
const saved = ref({ ...form })
const errors = ref({})
const loading = ref(true)

onMounted(async () => {
  await publicSettings.load()
  for (const key of Object.keys(form)) {
    const value = publicSettings.settings?.[key]
    if (Number.isInteger(value)) form[key] = value
  }
  saved.value = { ...form }
  loading.value = false
})

const summary = computed(() =>
  loading.value
    ? ''
    : `upozornit od ${saved.value.waitlistWarnAge} let · hranice ${saved.value.waitlistMaxAge} let`,
)
const dirty = computed(() => Object.keys(form).some((k) => form[k] !== saved.value[k]))

function validate() {
  const e = {}
  for (const key of Object.keys(form)) {
    const v = form[key]
    if (!Number.isInteger(v) || v < 1 || v > MAX_AGE_ABSOLUTE) {
      e[key] = `Zadej celé číslo 1–${MAX_AGE_ABSOLUTE}.`
    }
  }
  if (!e.waitlistWarnAge && !e.waitlistMaxAge && form.waitlistWarnAge >= form.waitlistMaxAge) {
    e.waitlistWarnAge = 'Upozornění musí být na nižší věk, než je hranice.'
  }
  errors.value = e
  return !Object.keys(e).length
}

const saveState = useSaveState()

async function submit() {
  if (!validate()) return
  const values = { ...form }
  if (await saveState.save(() => updatePublicSettings(values))) {
    saved.value = values
    // The waiting-list form opened later in this session uses the new limits.
    publicSettings.settings = { ...publicSettings.settings, ...values }
  }
}

const FIELDS = [
  { key: 'waitlistWarnAge', label: 'Upozornit od (let)' },
  { key: 'waitlistMaxAge', label: 'Hranice (let)' },
]
</script>

<template>
  <CollapsibleSection
    tag="form"
    novalidate
    title="Věk na čekací listině"
    :summary="summary"
    data-testid="waitlist-ages"
    @submit.prevent="submit"
  >
    <p class="m-0 mb-3.5 max-w-[70ch] text-[14.5px] leading-normal text-muted">
      Od upozornění formulář rodičům připomene, že nabíráme mladší děti; starší než hranice zapsat
      nejde (ani obnovit zájem).
    </p>
    <p v-if="loading" class="m-0 font-hand text-xl text-muted">načítám…</p>
    <template v-else>
      <div class="grid max-w-[26rem] grid-cols-2 gap-3">
        <FormField
          v-for="f in FIELDS"
          :key="f.key"
          v-slot="{ id, describedBy }"
          :label="f.label"
          :error="errors[f.key]"
        >
          <input
            :id="id"
            v-model.number="form[f.key]"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_AGE_ABSOLUTE"
            step="1"
            class="field-input py-2.5"
            :aria-invalid="!!errors[f.key]"
            :aria-describedby="describedBy"
          />
        </FormField>
      </div>
      <SaveBar
        class="mt-4"
        :saving="saveState.saving.value"
        :saved="saveState.saved.value"
        :dirty="dirty"
        :error="saveState.error.value"
      />
    </template>
  </CollapsibleSection>
</template>
