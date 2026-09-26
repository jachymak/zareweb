import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
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

// All accounts, live (Administration — admins only).
export function subscribeUsers(callback, onError) {
  return onSnapshot(users, (snap) => callback(fromQuery(snap)), onError)
}

export function setUserRole(uid, role) {
  return updateDoc(doc(users, uid), { role })
}

// Rejects or ends access (role `none`) and unpairs the account's children.
export function revokeAccess(uid, memberIds = []) {
  const batch = writeBatch(db)
  batch.update(doc(users, uid), { role: 'none' })
  for (const id of memberIds) {
    batch.update(doc(db, 'members', id), { parentUids: arrayRemove(uid) })
  }
  return batch.commit()
}

// Deletes an account without access: Auth account, profile, pairings.
const deleteAccountCallable = httpsCallable(functions, 'deleteAccount')

export async function deleteAccount(uid) {
  await deleteAccountCallable({ uid })
}

export function linkUserToPerson(uid, personId) {
  return updateDoc(doc(users, uid), { personId })
}
