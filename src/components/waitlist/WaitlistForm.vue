<script setup>
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import { pragueToday } from '@shared/schoolYear'
import { ageOn, parseBirthDate, suggestGrade, validateWaitlistEntry } from '@shared/waitlistRules'
import { submitWaitlist } from '@/services/waitlist'
import { useFormErrors } from '@/composables/useFormErrors'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import FormStep from '@/components/form/FormStep.vue'
import FormField from '@/components/form/FormField.vue'
import GenderPicker from './GenderPicker.vue'
import BirthDateInput from './BirthDateInput.vue'
import GradePicker from './GradePicker.vue'
import ParentContactFields from './ParentContactFields.vue'
import KnowsSomeoneFields from './KnowsSomeoneFields.vue'
import TooOldNotice from './TooOldNotice.vue'
import { FIELD_MESSAGES, ageWarningText, formatAge } from './waitlistText'

// Waiting-list sign-up form — SPEC §2.2.
const props = defineProps({
  schoolYear: { type: Number, required: true }, // start year the grade refers to
  schoolYearLabel: { type: String, required: true },
  warnAge: { type: Number, required: true },
  maxAge: { type: Number, required: true },
  // Parent contact carried over from the previous sign-up („Zapsat další dítě“).
  initialParent: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['submitted']) // ({ firstName, parent: { parentName, email, phone } })

const form = reactive({
  firstName: '',
  lastName: '',
  gender: '',
  day: '',
  month: '',
  year: '',
  gradeManual: null, // set once a grade is clicked; overrides the suggestion
  parentName: props.initialParent.parentName ?? '',
  email: props.initialParent.email ?? '',
  phone: props.initialParent.phone ?? '',
  knowsSomeone: null,
  knowsWhom: '',
})

const today = pragueToday()
const birthDate = computed(() => parseBirthDate(form.day, form.month, form.year))
const age = computed(() => (birthDate.value ? ageOn(birthDate.value, today) : null))
const suggestedGrade = computed(() =>
  age.value ? suggestGrade(birthDate.value, props.schoolYear) : null,
)
const grade = computed(() => form.gradeManual ?? suggestedGrade.value)

const entry = computed(() => ({
  firstName: form.firstName,
  lastName: form.lastName,
  gender: form.gender,
  birthDate: birthDate.value,
  grade: grade.value,
  parentName: form.parentName,
  email: form.email,
  phone: form.phone,
  knowsSomeone: form.knowsSomeone,
  knowsWhom: form.knowsWhom,
}))

const validation = computed(() =>
  validateWaitlistEntry(entry.value, { today, maxAge: props.maxAge }),
)
const tooOld = computed(() => !!validation.value.tooOld)

const ageText = computed(() => formatAge(age.value, form.gender))
const ageWarning = computed(() =>
  age.value && !tooOld.value && age.value.years >= props.warnAge
    ? ageWarningText(props.warnAge, form.gender)
    : '',
)

// ---- submit ----

const formEl = useTemplateRef('formEl')
const { serverErrors, errors, hasErrors, attempt, applyServerErrors } = useFormErrors(
  validation,
  FIELD_MESSAGES,
  formEl,
)
const submitting = ref(false)
const duplicateName = ref('')
const failed = ref(false)

watch(entry, () => {
  serverErrors.value = {}
  duplicateName.value = ''
  failed.value = false
})

async function submit() {
  if (tooOld.value || submitting.value || !attempt()) return

  submitting.value = true
  try {
    const status = await submitWaitlist(entry.value)
    if (status === 'duplicate') {
      duplicateName.value = form.firstName.trim()
      return
    }
    emit('submitted', {
      firstName: form.firstName.trim(),
      parent: { parentName: form.parentName, email: form.email.trim(), phone: form.phone },
    })
  } catch (e) {
    if (!applyServerErrors(e)) {
      console.error('submitWaitlist failed', e)
      failed.value = true
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <HandDrawnBox stroke="var(--color-trail)" shape="tall">
    <form
      ref="formEl"
      novalidate
      class="flex flex-col gap-[30px] px-5 pt-[38px] pb-10 sm:px-11"
      @submit.prevent="submit"
    >
      <FormStep :number="1" title="O dítěti" />

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Jméno" :error="errors.firstName" v-slot="{ id, describedBy }">
          <input
            :id="id"
            :aria-describedby="describedBy"
            v-model="form.firstName"
            type="text"
            autocomplete="off"
            class="field-input"
            :aria-invalid="!!errors.firstName"
          />
        </FormField>
        <FormField label="Příjmení" :error="errors.lastName" v-slot="{ id, describedBy }">
          <input
            :id="id"
            :aria-describedby="describedBy"
            v-model="form.lastName"
            type="text"
            autocomplete="off"
            class="field-input"
            :aria-invalid="!!errors.lastName"
          />
        </FormField>
      </div>

      <FormField tag="fieldset" label="Pohlaví" :error="errors.gender">
        <GenderPicker v-model="form.gender" :invalid="!!errors.gender" />
      </FormField>

      <FormField tag="fieldset" label="Datum narození" :error="errors.birthDate">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <BirthDateInput
            v-model:day="form.day"
            v-model:month="form.month"
            v-model:year="form.year"
            :invalid="!!errors.birthDate"
          />
          <span
            v-if="ageText"
            data-testid="age"
            class="font-hand text-[28px] leading-tight font-bold text-green"
            aria-live="polite"
          >
            {{ ageText }}
          </span>
        </div>
        <span v-if="ageWarning" class="note-warm max-w-[60ch]">{{ ageWarning }}</span>
      </FormField>

      <TooOldNotice v-if="tooOld" :max-age="maxAge" />

      <template v-else>
        <FormField
          tag="fieldset"
          :label="`Do jaké třídy půjde ve školním roce ${schoolYearLabel}?`"
          :error="errors.grade"
        >
          <GradePicker
            :model-value="grade"
            :invalid="!!errors.grade"
            @update:model-value="form.gradeManual = $event"
          />
          <span
            v-if="form.gradeManual === null && suggestedGrade !== null"
            class="font-hand text-[22px] leading-tight text-green"
          >
            předvyplněno podle data narození — upravte, pokud nesedí
          </span>
        </FormField>

        <hr class="my-1 border-0 border-t-[1.5px] border-dashed border-line-soft" />

        <FormStep :number="2" title="Kontakt na rodiče" />

        <ParentContactFields
          v-model:parent-name="form.parentName"
          v-model:email="form.email"
          v-model:phone="form.phone"
          :errors="errors"
        />

        <hr class="my-1 border-0 border-t-[1.5px] border-dashed border-line-soft" />

        <FormStep :number="3" title="Znáte někoho z oddílu?" />

        <KnowsSomeoneFields
          v-model:knows-someone="form.knowsSomeone"
          v-model:knows-whom="form.knowsWhom"
          :errors="errors"
        />

        <div class="flex flex-wrap items-center gap-x-5 gap-y-3.5 pt-2">
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Odesílám…' : 'Zapsat na čekací listinu' }}
          </button>
          <p v-if="hasErrors" class="m-0 text-[15px] text-red" role="alert">
            Doplňte prosím zvýrazněná pole.
          </p>
          <p
            v-else-if="duplicateName"
            data-testid="duplicate"
            class="m-0 text-[15px] font-medium text-ink"
            role="status"
          >
            {{ duplicateName }} už na čekací listině je.
          </p>
          <p v-else-if="failed" class="m-0 text-[15px] text-red" role="alert">
            Zápis se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.
          </p>
        </div>
      </template>
    </form>
  </HandDrawnBox>
</template>
