import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { fromDoc, fromQuery } from './utils'

// Leaders imported from skautIS; document id = skautIS person id.
const people = collection(db, 'skautisPeople')

export async function getPerson(personId) {
  return fromDoc(await getDoc(doc(people, personId)))
}

export async function listLeaders({ activeOnly = true } = {}) {
  const q = activeOnly ? query(people, where('active', '==', true)) : people
  return fromQuery(await getDocs(q))
}

// All leaders incl. inactive ones, live (Administration — pairing accounts).
export function subscribeLeaders(callback, onError) {
  return onSnapshot(people, (snap) => callback(fromQuery(snap)), onError)
}
