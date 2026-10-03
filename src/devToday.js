import { setTodayOverride } from '@shared/schoolYear'

// Dev server only: `?dnes=2026-10-08` makes the pages pretend that today is
// that day (meeting day, today card, sign-up deadlines, …), kept for the tab
// until `?dnes=` (empty) clears it. On the emulators the day is also written to
// `devToday/today`, which the rules accept as today for parents' excuses.
const KEY = 'devToday'
const env = import.meta.env

export function initDevToday() {
  const param = new URLSearchParams(window.location.search).get('dnes')
  let day = null
  try {
    if (param === '') sessionStorage.removeItem(KEY)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(param ?? '')) sessionStorage.setItem(KEY, param)
    day = sessionStorage.getItem(KEY)
  } catch {
    // no storage: no pretended day
  }
  setTodayOverride(day)
  if (env.VITE_USE_EMULATORS === 'true' && (param !== null || day)) syncEmulator(day)
  return day
}

// The owner token of the emulator bypasses the rules.
function syncEmulator(day) {
  const url =
    `http://127.0.0.1:8080/v1/projects/${env.VITE_FIREBASE_PROJECT_ID}` +
    '/databases/(default)/documents/devToday/today'
  const headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }
  const request = day
    ? fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: { date: { stringValue: day } } }),
      })
    : fetch(url, { method: 'DELETE', headers })
  request.catch((e) => console.warn('devToday: emulator not updated', e))
}
