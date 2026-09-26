<script setup>
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import { pragueToday } from '@shared/schoolYear'
import {
  GRADE_NONE,
  GRADE_SECONDARY,
  ageOn,
  formatPhone,
  validateWaitlistEntry,
} from '@shared/waitlistRules'
import { confirmRenewal, withdrawRenewal } from '@/services/waitlist'
import { useFormErrors } from '@/composables/useFormErrors'
import { GROUP_EMAIL } from '@/constants/troops'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import FormStep from '@/components/form/FormStep.vue'
import FormField from '@/components/form/FormField.vue'
import GradePicker from './GradePicker.vue'
import ParentContactFields from './ParentContactFields.vue'
import KnowsSomeoneFields from './KnowsSomeoneFields.vue'
import TooOldNotice from './TooOldNotice.vue'
import {
  FIELD_MESSAGES,
  GENDER_LABELS,
  ageWarningText,
  formatAge,
  formatDate,
} from './waitlistText'

// Renewal questionnaire — SPEC §2.3. Pre-filled with the previous answers;
// the child's name, gender and date of birth are read-only.
const props = defineProps({
  token: { type: String, required: true },
  entry: { type: Object, required: true }, // result of getRenewal
  schoolYear: { type: Number, required: true },
  schoolYearLabel: { type: String, required: true },
  warnAge: { type: Number, required: true },
  maxAge: { type: Number, required: true },
})
const emit = defineEmits(['confirmed', 'withdrawn', 'expired'])

const e = props.entry
const today = pragueToday()
const age = ageOn(e.birthDate, today)

// The previous grade referred to an earlier school year — move it forward.
const yearsLater = props.schoolYear - e.gradeSchoolYear
const shiftedGrade = Math.min(GRADE_SECONDARY, Math.max(GRADE_NONE, e.grade + yearsLater))

const form = reactive({
  grade: shiftedGrade,
  gradeTouched: false,
  parentName: e.parentName,
  email: e.email,
  phone: formatPhone(e.phone),
  knowsSomeone: e.knowsSomeone,
  knowsWhom: e.knowsWhom,
})

const answers = computed(() => ({
  grade: form.grade,
  parentName: form.parentName,
  email: form.email,
  phone: form.phone,
  knowsSomeone: form.knowsSomeone,
  knowsWhom: form.knowsWhom,
}))

const validation = computed(() =>
  validateWaitlistEntry({ ...e, ...answers.value }, { today, maxAge: props.maxAge }),
)
const tooOld = computed(() => !!validation.value.tooOld)
const ageWarning = computed(() =>
  !tooOld.value && age.years >= props.warnAge ? ageWarningText(props.warnAge, e.gender) : '',
)

const formEl = useTemplateRef('formEl')
const { serverErrors, errors, hasErrors, attempt, applyServerErrors } = useFormErrors(
  validation,
  FIELD_MESSAGES,
  formEl,
)
const busy = ref(false)
const failed = ref(false)
const confirmingWithdraw = ref(false)

watch(answers, () => {
  serverErrors.value = {}
  failed.value = false
})

function onGrade(grade) {
  form.grade = grade
  form.gradeTouched = true
}

async function run(action, onDone) {
  busy.value = true
  failed.value = false
  try {
    await action()
    onDone()
  } catch (err) {
    if (err.code === 'functions/not-found') emit('expired')
    else if (!applyServerErrors(err)) {
      console.error('Waitlist renewal failed', err)
      failed.value = true
    }
  } finally {
    busy.value = false
  }
}

function confirm() {
  if (tooOld.value || busy.value || !attempt()) return
  run(
    () => confirmRenewal(props.token, answers.value),
    () => emit('confirmed', { email: form.email.trim() }),
  )
}

function withdraw() {
  if (busy.value) return
  run(
    () => withdrawRenewal(props.token),
    () => emit('withdrawn'),
  )
}
</script>

<template>
  <HandDrawnBox stroke="var(--color-trail)" shape="tall">
    <form
      ref="formEl"
      novalidate
      class="flex flex-col gap-[30px] px-5 pt-[38px] pb-10 sm:px-11"
      @submit.prevent="confirm"
    >
      <FormStep :number="1" title="O dítěti" />

      <div class="flex flex-col gap-2" data-testid="child">
        <p class="m-0 text-[22px] leading-tight font-semibold text-ink">
          {{ e.firstName }} {{ e.lastName }}
        </p>
        <p class="m-0 text-[16.5px] text-muted">
          {{ GENDER_LABELS[e.gender] }} · narození {{ formatDate(e.birthDate) }}
        </p>
        <p class="m-0 font-hand text-[26px] leading-tight font-bold text-green">
          {{ formatAge(age, e.gender) }}
        </p>
        <p class="m-0 text-[14.5px] leading-normal text-muted-2">
          Jméno a datum narození měnit nejde. Pokud v nich je chyba, napište nám na
          <a :href="`mailto:${GROUP_EMAIL}`">{{ GROUP_EMAIL }}</a
          >.
        </p>
        <span v-if="ageWarning" class="note-warm mt-1 max-w-[60ch]">{{ ageWarning }}</span>
      </div>

      <TooOldNotice v-if="tooOld" :max-age="maxAge" />

      <template v-else>
        <FormField
          tag="fieldset"
          :label="`Do jaké třídy půjde ve školním roce ${schoolYearLabel}?`"
          :error="errors.grade"
        >
          <GradePicker
            :model-value="form.grade"
            :invalid="!!errors.grade"
            @update:model-value="onGrade"
          />
          <span v-if="!form.gradeTouched" class="font-hand text-[22px] leading-tight text-green">
            {{
              yearsLater > 0
                ? 'posunuto o rok podle minulé odpovědi — upravte, pokud nesedí'
                : 'podle minulé odpovědi — upravte, pokud nesedí'
            }}
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
          <button type="submit" class="btn-primary" :disabled="busy">
            {{ busy ? 'Odesílám…' : 'Potvrdit zájem' }}
          </button>
          <p v-if="hasErrors" class="m-0 text-[15px] text-red" role="alert">
            Doplňte prosím zvýrazněná pole.
          </p>
        </div>
      </template>

      <hr class="my-1 border-0 border-t-[1.5px] border-dashed border-line-soft" />

      <div class="flex flex-col items-start gap-3">
        <button
          v-if="!confirmingWithdraw"
          type="button"
          class="cursor-pointer bg-transparent py-2 text-[16.5px] text-red underline underline-offset-[3px]"
          @click="confirmingWithdraw = true"
        >
          O místo už nemáme zájem
        </button>
        <div
          v-else
          data-testid="withdraw-confirm"
          class="w-full rounded-[14px] border-[1.5px] border-red bg-red-light/60 px-5 py-4"
          role="alertdialog"
          aria-labelledby="withdraw-title"
        >
          <p id="withdraw-title" class="m-0 mb-1 font-semibold text-ink">Opravdu zápis smazat?</p>
          <p class="m-0 mb-3.5 text-[15.5px] leading-normal">
            {{ e.firstName }} {{ e.lastName }} tím z čekací listiny zmizí i s původním místem v
            pořadí. Tohle nejde vzít zpět.
          </p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              class="cursor-pointer rounded-full border-0 bg-red px-6 py-3 text-base font-medium text-cream disabled:cursor-wait disabled:opacity-70"
              :disabled="busy"
              @click="withdraw"
            >
              Ano, vyřadit
            </button>
            <button
              type="button"
              class="cursor-pointer bg-transparent py-2 text-base text-green underline underline-offset-[3px]"
              @click="confirmingWithdraw = false"
            >
              Ne, ponechat
            </button>
          </div>
        </div>
      </div>

      <p v-if="failed" class="m-0 text-[15px] text-red" role="alert">
        Nepodařilo se to odeslat. Zkuste to prosím za chvíli znovu.
      </p>
    </form>
  </HandDrawnBox>
</template>
