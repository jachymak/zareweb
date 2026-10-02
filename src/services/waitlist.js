import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, ensureAppCheck, functions } from './firebase'
import { fromQuery } from './utils'

const waitlist = collection(db, 'waitlist')

// Public sign-up through the `submitWaitlist` Cloud Function (SPEC §2.2).
// Resolves to 'created' or 'duplicate'; invalid data rejects with
// `details.errors` (same keys as validateWaitlistEntry).
const submitWaitlistCallable = httpsCallable(functions, 'submitWaitlist')

// Starts App Check early (the form calls it on mount), so the sign-up isn't slowed by it.
export const prepareWaitlist = () => ensureAppCheck()

export async function submitWaitlist(entry) {
  await ensureAppCheck()
  const { data } = await submitWaitlistCallable(entry)
  return data.status
}

// Renewal by the token from the annual e-mail (SPEC §2.3). For an unknown or
// already used token getRenewal resolves to null; the others reject with
// code 'functions/not-found'.
const getRenewalCallable = httpsCallable(functions, 'getRenewal')
const confirmRenewalCallable = httpsCallable(functions, 'confirmRenewal')
const withdrawRenewalCallable = httpsCallable(functions, 'withdrawRenewal')

export async function getRenewal(token) {
  await ensureAppCheck()
  return (await getRenewalCallable({ token })).data
}

// answers: { grade, parentName, email, phone, knowsSomeone, knowsWhom }
export async function confirmRenewal(token, answers) {
  await ensureAppCheck()
  await confirmRenewalCallable({ token, ...answers })
}

export async function withdrawRenewal(token) {
  await ensureAppCheck()
  await withdrawRenewalCallable({ token })
}

// Leader-side access below (SPEC §4.6).

// Entries of one status, oldest sign-up first, followed live (leaders see each
// other's notes and deletions). Returns the unsubscribe function.
// status: 'active' | 'awaitingRenewal' | 'admitted'
export function subscribeWaitlist(status, callback, onError) {
  return onSnapshot(
    query(waitlist, where('status', '==', status), orderBy('firstSignedUpAt')),
    (snap) => callback(fromQuery(snap)),
    onError,
  )
}

export function updateLeaderNote(entryId, leaderNote) {
  return updateDoc(doc(waitlist, entryId), { leaderNote })
}

export function deleteWaitlistEntry(entryId) {
  return deleteDoc(doc(waitlist, entryId))
}

export async function listResets() {
  return fromQuery(await getDocs(query(collection(db, 'waitlistResets'), orderBy('at', 'desc'))))
}

// Annual reset through the `resetWaitlist` Cloud Function: the admitted
// entries leave the list, the others await renewal and their parents get the
// e-mail. Resolves to { date, admittedCount, emailedCount, deletedCount }.
const resetWaitlistCallable = httpsCallable(functions, 'resetWaitlist')

export async function resetWaitlist(admittedIds) {
  return (await resetWaitlistCallable({ admittedIds })).data
}
