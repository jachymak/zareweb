import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { fromDoc, fromQuery } from './utils'

const users = collection(db, 'users')

export async function getUser(uid) {
  return fromDoc(await getDoc(doc(users, uid)))
}

export function subscribeUser(uid, callback) {
  return onSnapshot(doc(users, uid), (snap) => callback(fromDoc(snap)))
}

// New accounts always start as pending (enforced by firestore.rules).
export function createUserProfile(uid, { email, displayName, pairingRequest = null }) {
  return setDoc(doc(users, uid), {
    email,
    displayName,
    role: 'pending',
    pairingRequest,
    createdAt: serverTimestamp(),
  })
}

export async function listUsers() {
  return fromQuery(await getDocs(users))
}

export function setUserRole(uid, role) {
  return updateDoc(doc(users, uid), { role })
}

export function linkUserToPerson(uid, personId) {
  return updateDoc(doc(users, uid), { personId })
}
