import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './utils'

// Name, nickname, phone and e-mail come from skautisPeople via personId.
const contacts = collection(db, 'contacts')

export async function listContacts() {
  return fromQuery(await getDocs(query(contacts, orderBy('order'))))
}

export async function createContact({ personId, group, photoUrl = null, order }) {
  const ref = await addDoc(contacts, { personId, group, photoUrl, order })
  return ref.id
}

export function updateContact(contactId, fields) {
  return updateDoc(doc(contacts, contactId), fields)
}

export function deleteContact(contactId) {
  return deleteDoc(doc(contacts, contactId))
}
