import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { directoryEntries } from '@shared/directory'
import { db, functions, getDoc, getDocs } from './firebase'
import { fromQuery } from './utils'

// The leaders' directory — SPEC §4.10; contacts from the skautIS export — §4.8 skautIS.

const members = collection(db, 'members')
const people = collection(db, 'skautisPeople')
const shared = collection(db, 'sharedContacts')

// { parentId: data } of the `private/{name}` docs under the given records.
async function privateDocs(parent, ids, name) {
  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, parent, id, 'private', name))))
  return Object.fromEntries(
    snaps.filter((s) => s.exists()).map((s) => [s.ref.parent.parent.id, s.data()]),
  )
}

// Active members and leaders with their private contacts / details, and the
// shared contacts of „ostatní“ — what the directory and the export import work with.
export async function loadDirectoryData() {
  const [memberList, leaderList, others] = await Promise.all([
    getDocs(query(members, where('active', '==', true))).then(fromQuery),
    getDocs(query(people, where('active', '==', true))).then(fromQuery),
    getDocs(shared).then(fromQuery),
  ])
  const [contacts, details] = await Promise.all([
    privateDocs(
      'members',
      memberList.map((m) => m.id),
      'contacts',
    ),
    privateDocs(
      'skautisPeople',
      leaderList.map((p) => p.id),
      'details',
    ),
  ])
  return { members: memberList, leaders: leaderList, others, contacts, details }
}

// Directory entries of active children and leaders (shared/directory.js).
export async function loadDirectory() {
  return directoryEntries(await loadDirectoryData())
}

// --- shared contacts („ostatní“) ---------------------------------------------------

const sharedFields = ({ name, description, phone, email }) => ({
  name: name.trim(),
  description: description.trim(),
  phone: phone.trim() || null,
  email: email.trim() || null,
})

// fields: { name, description, phone, email }; by: { uid, name } of the leader.
export function addSharedContact(fields, by) {
  return addDoc(shared, {
    ...sharedFields(fields),
    createdBy: by.uid,
    createdByName: by.name,
    createdAt: serverTimestamp(),
    updatedBy: by.uid,
    updatedAt: serverTimestamp(),
  })
}

export function updateSharedContact(id, fields, by) {
  return updateDoc(doc(shared, id), {
    ...sharedFields(fields),
    updatedBy: by.uid,
    updatedAt: serverTimestamp(),
  })
}

export const deleteSharedContact = (id) => deleteDoc(doc(shared, id))

// Writes a planned export import (planContactsImport): children's contacts and
// leaders' birthdays, plus the date of the import.
export async function applyContactsImport(plan, uid) {
  const writes = [
    ...plan.children.changed.map(({ id, after }) => [
      doc(db, 'members', id, 'private', 'contacts'),
      { ...after, importedAt: serverTimestamp() },
    ]),
    ...plan.birthdays.changed.map(({ id, after }) => [
      doc(db, 'skautisPeople', id, 'private', 'details'),
      { birthDate: after },
    ]),
    [
      doc(db, 'settings', 'skautis'),
      { lastContactsImportAt: serverTimestamp(), lastContactsImportBy: uid },
    ],
  ]
  // A batch holds at most 500 writes.
  for (let i = 0; i < writes.length; i += 450) {
    const batch = writeBatch(db)
    for (const [ref, data] of writes.slice(i, i + 450)) batch.set(ref, data, { merge: true })
    await batch.commit()
  }
}

// --- the phone (CardDAV) ---------------------------------------------------------

// The leader's chosen groups and when the phone password was made, live.
export function subscribePhoneContacts(uid, callback, onError) {
  return onSnapshot(
    doc(db, 'phoneContacts', uid),
    (snap) => callback(snap.exists() ? snap.data() : {}),
    onError,
  )
}

export function setPhoneGroups(uid, groups) {
  return setDoc(doc(db, 'phoneContacts', uid), { groups }, { merge: true })
}

// A new phone password (shown once): { password, user }.
const createPasswordCallable = httpsCallable(functions, 'createPhonePassword')
export async function createPhonePassword() {
  return (await createPasswordCallable()).data
}

// Address of the CardDAV server (the `carddav` function).
export function carddavUrl() {
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID
  return import.meta.env.VITE_USE_EMULATORS === 'true'
    ? `http://127.0.0.1:5001/${project}/europe-west3/carddav/`
    : `https://europe-west3-${project}.cloudfunctions.net/carddav/`
}
