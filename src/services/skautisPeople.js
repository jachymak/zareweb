import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
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

// Only web-specific fields; skautIS fields are overwritten by the sync.
export function updateLeaderProfile(personId, { troop, roleTitle }) {
  return updateDoc(doc(people, personId), { troop, roleTitle })
}
