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
import { db } from './firebase'
import { fromQuery } from './utils'

// Leader-side access only. Public sign-up, renewal and the annual reset
// go through Cloud Functions (not implemented yet).
const waitlist = collection(db, 'waitlist')

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
