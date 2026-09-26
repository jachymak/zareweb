import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPublicSettings } from '@/services/settings'
import { formatSchoolYear, gradeSchoolYear, recruitmentYears } from '@shared/schoolYear'
import { DEFAULT_MAX_AGE, DEFAULT_WARN_AGE } from '@shared/waitlistRules'

// settings/public — recruitment years and waiting-list age limits (SPEC §5, §6.1).
export const usePublicSettingsStore = defineStore('publicSettings', () => {
  const settings = ref(null)
  const loaded = ref(false)
  const error = ref(null)
  let pending = null

  function load() {
    pending ??= getPublicSettings()
      .then((data) => {
        settings.value = data
        error.value = null
      })
      .catch((e) => {
        console.error('Failed to load settings/public', e)
        error.value = e
        pending = null // allow a retry
      })
      .finally(() => {
        loaded.value = true
      })
    return pending
  }

  // Formatted years (`2026/27`), or null when the last reset date is unknown.
  const recruitment = computed(() => {
    const lastReset = settings.value?.lastWaitlistReset
    if (!lastReset) return null
    const { doneYear, nextYear } = recruitmentYears(lastReset)
    return { doneYear: formatSchoolYear(doneYear), nextYear: formatSchoolYear(nextYear) }
  })

  // Waiting-list form parameters; defaults apply until (or unless) settings load.
  const waitlistForm = computed(() => {
    const schoolYear = gradeSchoolYear(settings.value?.lastWaitlistReset)
    return {
      schoolYear,
      schoolYearLabel: formatSchoolYear(schoolYear),
      warnAge: settings.value?.waitlistWarnAge ?? DEFAULT_WARN_AGE,
      maxAge: settings.value?.waitlistMaxAge ?? DEFAULT_MAX_AGE,
    }
  })

  return { settings, loaded, error, load, recruitment, waitlistForm }
})
