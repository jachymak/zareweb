import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, getDoc, getDocs } from './firebase'
import { fromDoc, fromQuery } from './utils'

// Children imported from skautIS; document id = skautIS person id.
const members = collection(db, 'members')
const users = collection(db, 'users')

export async function getMember(memberId) {
  return fromDoc(await getDoc(doc(members, memberId)))
}

export async function listMembers({ troop, activeOnly = true } = {}) {
  const filters = []
  if (troop) filters.push(where('troop', '==', troop))
  if (activeOnly) filters.push(where('active', '==', true))
  return fromQuery(await getDocs(query(members, ...filters)))
}

// All members, including inactive ones (Administration).
export function subscribeMembers(callback, onError) {
  return onSnapshot(members, (snap) => callback(fromQuery(snap)), onError)
}

export async function listChildrenOfParent(uid) {
  return fromQuery(await getDocs(query(members, where('parentUids', 'array-contains', uid))))
}

// The child and its siblings — every child paired with any of its parents
// (leaders' preview of the parent home). Just the child when it has no parent.
export async function listChildrenSeenWith(memberId) {
  const member = await getMember(memberId)
  if (!member) return []
  const parentUids = (member.parentUids ?? []).slice(0, 30) // array-contains-any limit
  if (!parentUids.length) return [member]
  const q = query(members, where('parentUids', 'array-contains-any', parentUids))
  return fromQuery(await getDocs(q))
}

export function setMeetingDay(memberId, meetingDay) {
  return updateDoc(doc(members, memberId), { meetingDay })
}

// Pairing is stored only in members.parentUids (SPEC §5).
export function pairParent(memberId, uid) {
  return updateDoc(doc(members, memberId), { parentUids: arrayUnion(uid) })
}

// Approves a pending account as a parent with all the chosen children in one
// write, so the approval e-mail (onUserWritten) lists them all.
export function approveParent(uid, memberIds) {
  const batch = writeBatch(db)
  for (const id of memberIds) batch.update(doc(members, id), { parentUids: arrayUnion(uid) })
  batch.update(doc(users, uid), { role: 'parent' })
  return batch.commit()
}

// A parent may stay without children (e.g. the child moved on to the leaders).
export function unpairParent(memberId, uid) {
  return updateDoc(doc(members, memberId), { parentUids: arrayRemove(uid) })
}

// Parents' contacts from skautIS — leaders only.
export async function getParentContacts(memberId) {
  const snap = await getDoc(doc(members, memberId, 'private', 'contacts'))
  return snap.exists() ? snap.data().parents : []
}

// { memberId: parents[] } for the given members.
export async function getParentContactsOf(memberIds) {
  const entries = await Promise.all(memberIds.map(async (id) => [id, await getParentContacts(id)]))
  return Object.fromEntries(entries)
}
