import { httpsCallable } from 'firebase/functions'
import { SKAUTIS_TEST, skautisLoginUrl } from '@shared/skautis'
import { functions } from './firebase'

// skautIS sync — SPEC §4.8 skautIS (admins only).

// The skautIS login page; afterwards skautIS sends the admin back to
// Administration with the login token in the URL hash (`#skautis=…`).
export const skautisLogin = () =>
  skautisLoginUrl(
    import.meta.env.VITE_SKAUTIS_URL || SKAUTIS_TEST.url,
    import.meta.env.VITE_SKAUTIS_APP_ID || SKAUTIS_TEST.appId,
  )

// Loads both troops from skautIS; returns what the sync would change:
// { units, skipped, members, people } — see previewSkautisSync.
const previewCallable = httpsCallable(functions, 'previewSkautisSync', { timeout: 300000 })
export async function previewSkautisSync(token) {
  return (await previewCallable({ token })).data
}

// Writes the previewed changes; returns their counts.
const applyCallable = httpsCallable(functions, 'applySkautisSync')
export async function applySkautisSync() {
  return (await applyCallable()).data
}
