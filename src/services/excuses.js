import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db, getDoc } from './firebase'
import { fromDoc, fromQuery } from './utils'

// Excuses from meetings (SPEC §3.1, §4.2): a parent excuses their child on the
// meeting day, a leader any time. An excused child still counts as absent.
const excuses = collection(db, 'excuses')

// e.g. vlc_2026-03-19_123456
export function excuseId(troop, date, memberId) {
  return `${troop}_${date}_${memberId}`
}

export async function getExcuse(troop, date, memberId) {
  return fromDoc(await getDoc(doc(excuses, excuseId(troop, date, memberId))))
}

// Live excuses of a troop between two YYYY-MM-DD dates (inclusive); leaders only.
export function subscribeExcuses({ troop, fromDate, toDate }, callback, onError) {
  const q = query(
    excuses,
    where('troop', '==', troop),
    where('date', '>=', fromDate),
    where('date', '<=', toDate),
    orderBy('date'),
  )
  return onSnapshot(q, (snap) => callback(fromQuery(snap)), onError)
}

// `by`: 'parent' | 'leader'
export function excuse({ troop, date, memberId, reason, by }) {
  return setDoc(doc(excuses, excuseId(troop, date, memberId)), {
    troop,
    date,
    memberId,
    reason: reason.trim(),
    by,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  })
}

export function cancelExcuse({ troop, date, memberId }) {
  return deleteDoc(doc(excuses, excuseId(troop, date, memberId)))
}
