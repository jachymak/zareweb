import { onMounted, ref } from 'vue'
import { emailTemplate } from '@shared/emails'
import { getEmailSettings } from '@/services/settings'

// Whether the e-mail `key` is turned on in Administration (settings/emails);
// on until loaded or when loading fails.
export function useEmailEnabled(key) {
  const enabled = ref(true)
  onMounted(async () => {
    try {
      enabled.value = emailTemplate(key, (await getEmailSettings())?.[key]).enabled
    } catch (e) {
      console.error('Loading e-mail settings failed', e)
    }
  })
  return enabled
}
