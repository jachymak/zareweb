import {
  arrayRemove,
  collection,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions, getDoc, getDocs } from './firebase'
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

// Rejects or ends access (role `none`), unpairs the account's children and
// unlinks its skautIS leader.
export function revokeAccess(uid, memberIds = []) {
  const batch = writeBatch(db)
  batch.update(doc(users, uid), { role: 'none', personId: deleteField() })
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

// Links a leader account to its skautIS person (`skautisPeople` id); null unlinks.
export function linkUserToPerson(uid, personId) {
  return updateDoc(doc(users, uid), { personId: personId ?? deleteField() })
}

// Approves a pending account as a leader linked to its skautIS person, in one write.
export function approveLeader(uid, personId) {
  return updateDoc(doc(users, uid), { role: 'leader', personId })
}

// Parent invitations — SPEC §4.8 „děti bez účtu“ (admins only).
const inviteParentCallable = httpsCallable(functions, 'inviteParent')

export async function inviteParent(email) {
  await inviteParentCallable({ email })
}

// Sent invitations, live: [{ id: lower-case e-mail, email, sentAt }].
export function subscribeInvitations(callback, onError) {
  return onSnapshot(collection(db, 'invitations'), (snap) => callback(fromQuery(snap)), onError)
}
