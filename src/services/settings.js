import { doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db, getDoc } from './firebase'

// settings/public, settings/meetings — public; settings/app — logged-in users;
// settings/emails, settings/skautis, settings/recorders — leaders (SPEC §5).
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
export const getRecorderSettings = () => getSettings('recorders')

export const updatePublicSettings = (fields) => updateSettings('public', fields)
export const updateAppSettings = (fields) => updateSettings('app', fields)
export const updateEmailSettings = (fields) => updateSettings('emails', fields)
export const updateMeetingSettings = (schedule) => setDoc(doc(db, 'settings', 'meetings'), schedule)

// The schedule together with who records attendance on each meeting day, in one write.
export function updateMeetingAndRecorderSettings(schedule, recorders) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'settings', 'meetings'), schedule)
  batch.set(doc(db, 'settings', 'recorders'), recorders)
  return batch.commit()
}

// Live settings/meetings; callback(null) while it doesn't exist.
export function subscribeMeetingSettings(callback, onError) {
  return onSnapshot(
    doc(db, 'settings', 'meetings'),
    (snap) => callback(snap.exists() ? snap.data() : null),
    onError,
  )
}
