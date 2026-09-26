import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { fromQuery } from './utils'

const waitlist = collection(db, 'waitlist')

// Public sign-up through the `submitWaitlist` Cloud Function (SPEC §2.2).
// Resolves to 'created' or 'duplicate'; invalid data rejects with
// `details.errors` (same keys as validateWaitlistEntry).
const submitWaitlistCallable = httpsCallable(functions, 'submitWaitlist')

export async function submitWaitlist(entry) {
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
  return (await getRenewalCallable({ token })).data
}

// answers: { grade, parentName, email, phone, knowsSomeone, knowsWhom }
export async function confirmRenewal(token, answers) {
  await confirmRenewalCallable({ token, ...answers })
}

export async function withdrawRenewal(token) {
  await withdrawRenewalCallable({ token })
}

// Leader-side access below. Renewal and the annual reset go through
// Cloud Functions (not implemented yet).

// status: 'active' | 'awaitingRenewal' | 'admitted'
export async function listWaitlist(status = 'active') {
  const q = query(waitlist, where('status', '==', status), orderBy('firstSignedUpAt'))
  return fromQuery(await getDocs(q))
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
