<script setup>
import { computed, ref, watch } from 'vue'
import { eventEmailState, registrationState } from '@shared/events'
import { setRegistration } from '@/services/events'
import { useEmailEnabled } from '@/composables/useEmailEnabled'
import { formatDay, SAVE_ERROR } from '@/components/parent/parentText'
import DateInput from '@/components/form/DateInput.vue'
import { noEmailNote } from './eventsText'

// „Spustit přihlašování“ + the deadline (last day parents can sign up).
const props = defineProps({
  event: { type: Object, required: true },
  today: { type: String, required: true },
})

const open = ref(false)
const deadline = ref('')
const deadlineIncomplete = ref(false)
watch(
  () => [props.event.registrationOpen, props.event.registrationDeadline],
  ([isOpen, date]) => {
    open.value = !!isOpen
    deadline.value = date ?? ''
  },
  { immediate: true },
)

const state = computed(() => registrationState(props.event, props.today))
const changed = computed(
  () =>
    open.value !== !!props.event.registrationOpen ||
    (open.value && deadline.value !== (props.event.registrationDeadline ?? '')),
)
const error = computed(() => {
  if (!open.value) return ''
  if (deadlineIncomplete.value) return 'Zadej celé datum uzávěrky — DD. MM. RRRR.'
  if (!deadline.value) return 'Vyber datum uzávěrky.'
  if (deadline.value > props.event.startDate)
    return 'Uzávěrka musí být nejpozději v den začátku akce.'
  return ''
})

// Whether starting the registration e-mails parents (as onEventUpdated decides).
const emailEnabled = useEmailEnabled('registrationOpened')
const email = computed(() =>
  eventEmailState(props.event, props.today, {
    notified: props.event.registrationNotifiedAt,
    enabled: emailEnabled.value,
  }),
)

const saving = ref(false)
const saveError = ref(false)
const submitted = ref(false)

async function save() {
  submitted.value = true
  if (error.value) return
  saving.value = true
  saveError.value = false
  try {
    await setRegistration(props.event.id, {
      open: open.value,
      deadline: open.value ? deadline.value : (props.event.registrationDeadline ?? null),
    })
    submitted.value = false
  } catch (e) {
    console.error('Saving the registration failed', e)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section aria-labelledby="registration-title" class="rounded-lg bg-[#f6efdc] px-4 pt-3 pb-4">
    <h3 id="registration-title" class="m-0 mb-2 text-[17px] font-semibold text-ink">
      Přihlašování
    </h3>
    <p class="m-0 mb-3 text-[14.5px] text-muted" data-testid="registration-state">
      <template v-if="state === 'open'">
        Rodiče můžou děti přihlašovat do {{ formatDay(event.registrationDeadline) }}
      </template>
      <template v-else-if="state === 'ended'">
        Přihlašování skončilo {{ formatDay(event.registrationDeadline) }} — teď přihlašuješ jen ty.
      </template>
      <template v-else>Rodiče se zatím přihlašovat nemůžou.</template>
    </p>
    <form class="flex flex-wrap items-end gap-x-4 gap-y-3" novalidate @submit.prevent="save">
      <label class="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-text">
        <input v-model="open" type="checkbox" class="size-6 accent-green" />
        spustit přihlašování
      </label>
      <div v-if="open" class="flex flex-col gap-1 text-[14px] text-muted">
        přihlášky do
        <DateInput
          v-model="deadline"
          v-model:incomplete="deadlineIncomplete"
          label="přihlášky do"
          :invalid="submitted && !!error"
        />
      </div>
      <button
        type="submit"
        :disabled="!changed || saving"
        class="cursor-pointer rounded-full border-[1.5px] border-green bg-green px-5 py-2 text-[15px] text-cream hover:bg-green-hover disabled:cursor-default disabled:border-line disabled:bg-transparent disabled:text-faint"
      >
        uložit přihlašování
      </button>
    </form>
    <p v-if="submitted && error" class="m-0 mt-2 text-sm text-red">{{ error }}</p>
    <p v-if="saveError" role="alert" class="m-0 mt-2 text-sm text-red">{{ SAVE_ERROR }}</p>
    <p
      v-if="open && !event.registrationOpen"
      class="m-0 mt-2 text-[13.5px] text-[#8a7b5e]"
      data-testid="registration-email"
    >
      {{
        email === 'send'
          ? 'Po uložení odejde rodičům dětí, které můžou jet, e-mail, že se přihlašuje.'
          : noEmailNote(email, 'o přihlašování')
      }}
    </p>
  </section>
</template>
