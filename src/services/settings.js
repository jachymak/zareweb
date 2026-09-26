import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// settings/public — public; settings/app — logged-in users;
// settings/emails, settings/skautis — leaders (SPEC §5).
async function getSettings(name) {
  const snap = await getDoc(doc(db, 'settings', name))
  return snap.exists() ? snap.data() : null
}

function updateSettings(name, fields) {
  return setDoc(doc(db, 'settings', name), fields, { merge: true })
}

export const getPublicSettings = () => getSettings('public')
export const getAppSettings = () => getSettings('app')
export const getEmailSettings = () => getSettings('emails')
export const getSkautisSettings = () => getSettings('skautis')

export const updatePublicSettings = (fields) => updateSettings('public', fields)
export const updateAppSettings = (fields) => updateSettings('app', fields)
export const updateEmailSettings = (fields) => updateSettings('emails', fields)
