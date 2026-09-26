import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { fromDoc, fromQuery } from './utils'

const meetings = collection(db, 'meetings')

// e.g. vlc_2026-03-19
export function meetingId(troop, date) {
  return `${troop}_${date}`
}

// Recorded meetings of a troop between two YYYY-MM-DD dates (inclusive).
export async function listMeetings({ troop, fromDate, toDate }) {
  const q = query(
    meetings,
    where('troop', '==', troop),
    where('date', '>=', fromDate),
    where('date', '<=', toDate),
    orderBy('date'),
  )
  return fromQuery(await getDocs(q))
}

export function subscribeMeeting(troop, date, callback) {
  return onSnapshot(doc(meetings, meetingId(troop, date)), (snap) => callback(fromDoc(snap)))
}

// Saving presence or the cancelled flag creates the meeting, i.e. marks it recorded.
function saveMeeting({ troop, date, weekday }, fields) {
  return setDoc(
    doc(meetings, meetingId(troop, date)),
    {
      troop,
      date,
      weekday,
      ...fields,
      updatedBy: auth.currentUser.uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function setPresence(meeting, presentIds) {
  return saveMeeting(meeting, { presentIds, cancelled: false })
}

export function setCancelled(meeting, cancelled) {
  return saveMeeting(meeting, { cancelled })
}
