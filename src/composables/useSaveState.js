import { ref } from 'vue'

// Saving state of a form with one „uložit“ button: busy flag, a short-lived
// „uloženo“ and an error message.
export function useSaveState() {
  const saving = ref(false)
  const saved = ref(false)
  const error = ref('')
  let timer = null

  async function save(write) {
    saving.value = true
    saved.value = false
    error.value = ''
    try {
      await write()
      saved.value = true
      clearTimeout(timer)
      timer = setTimeout(() => (saved.value = false), 3000)
      return true
    } catch (e) {
      console.error('Saving failed', e)
      error.value = 'Nepovedlo se to uložit. Zkus to znovu.'
      return false
    } finally {
      saving.value = false
    }
  }

  return { saving, saved, error, save }
}
