import { computed, nextTick, ref } from 'vue'

// Field errors shown only after the first submit attempt, merged with errors
// returned by the server. `validation` is a computed object of failed checks.
export function useFormErrors(validation, messages, formEl) {
  const tried = ref(false)
  const serverErrors = ref({})

  const errors = computed(() => {
    const failed = tried.value ? { ...validation.value, ...serverErrors.value } : {}
    return Object.fromEntries(Object.keys(messages).map((k) => [k, failed[k] ? messages[k] : '']))
  })
  const hasErrors = computed(() => Object.values(errors.value).some(Boolean))

  async function focusFirstError() {
    await nextTick()
    const field = formEl.value?.querySelector('[data-invalid]')
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field?.querySelector('input, button')?.focus({ preventScroll: true })
  }

  // Marks the form as submitted; returns true when it is valid.
  function attempt() {
    tried.value = true
    if (Object.values(errors.value).some(Boolean)) {
      focusFirstError()
      return false
    }
    return true
  }

  // Applies `details.errors` of an `invalid-argument` callable error; false otherwise.
  function applyServerErrors(e) {
    if (e.code !== 'functions/invalid-argument' || !e.details?.errors) return false
    serverErrors.value = e.details.errors
    focusFirstError()
    return true
  }

  return { tried, serverErrors, errors, hasErrors, attempt, applyServerErrors }
}
