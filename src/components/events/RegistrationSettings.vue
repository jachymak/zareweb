<script setup>
import { computed, ref, watch } from 'vue'
import { registrationState } from '@shared/events'
import { setRegistration } from '@/services/events'
import { formatDay, SAVE_ERROR } from '@/components/parent/parentText'

// „Spustit přihlašování“ + the deadline (last day parents can sign up).
const props = defineProps({
  event: { type: Object, required: true },
  today: { type: String, required: true },
})

const open = ref(false)
const deadline = ref('')
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
  if (!deadline.value) return 'Vyber datum uzávěrky.'
  if (deadline.value > props.event.startDate)
    return 'Uzávěrka musí být nejpozději v den začátku akce.'
  return ''
})

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
        Rodiče můžou děti přihlašovat do {{ formatDay(event.registrationDeadline) }}.
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
      <label v-if="open" class="flex flex-col gap-1 text-[14px] text-muted">
        přihlášky do
        <input
          v-model="deadline"
          type="date"
          :max="event.startDate"
          class="field-input py-2! text-[15px]!"
          :aria-invalid="submitted && !!error"
        />
      </label>
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
    <p v-if="open && !event.registrationOpen" class="m-0 mt-2 text-[13.5px] text-[#8a7b5e]">
      Až budou fungovat e-maily, dostanou rodiče dětí, které můžou jet, zprávu, že se přihlašuje.
    </p>
  </section>
</template>
