import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { fromDoc, fromQuery } from './utils'

// Children imported from skautIS; document id = skautIS person id.
const members = collection(db, 'members')

export async function getMember(memberId) {
  return fromDoc(await getDoc(doc(members, memberId)))
}

export async function listMembers({ troop, activeOnly = true } = {}) {
  const filters = []
  if (troop) filters.push(where('troop', '==', troop))
  if (activeOnly) filters.push(where('active', '==', true))
  return fromQuery(await getDocs(query(members, ...filters)))
}

export async function listChildrenOfParent(uid) {
  return fromQuery(await getDocs(query(members, where('parentUids', 'array-contains', uid))))
}

export function setMeetingDay(memberId, meetingDay) {
  return updateDoc(doc(members, memberId), { meetingDay })
}

// Pairing is stored only in members.parentUids (SPEC §5).
export function pairParent(memberId, uid) {
  return updateDoc(doc(members, memberId), { parentUids: arrayUnion(uid) })
}

export function unpairParent(memberId, uid) {
  return updateDoc(doc(members, memberId), { parentUids: arrayRemove(uid) })
}

// Parents' contacts from skautIS — leaders only.
export async function getParentContacts(memberId) {
  const snap = await getDoc(doc(members, memberId, 'private', 'contacts'))
  return snap.exists() ? snap.data().parents : []
}
