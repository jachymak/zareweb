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

export function subscribeUser(uid, callback, onError) {
  return onSnapshot(doc(users, uid), (snap) => callback(fromDoc(snap)), onError)
}

// New accounts always start as pending (enforced by firestore.rules).
export function createUserProfile(uid, { email, displayName, note = null }) {
  return setDoc(doc(users, uid), {
    email,
    displayName,
    role: 'pending',
    note,
    createdAt: serverTimestamp(),
  })
}

// The pending user's note for the admin (who they are, which children).
export function setUserNote(uid, note) {
  return updateDoc(doc(users, uid), { note })
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
