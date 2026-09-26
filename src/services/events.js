import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { fromDoc, fromQuery } from './utils'

const events = collection(db, 'events')

function posterRef(eventId) {
  return doc(events, eventId, 'poster', 'content')
}

function participantRef(eventId, memberId) {
  return doc(events, eventId, 'participants', memberId)
}

// ---- events ----

export async function listEvents({ fromDate, toDate } = {}) {
  const filters = [where('deleted', '==', false)]
  if (fromDate) filters.push(where('startDate', '>=', fromDate))
  if (toDate) filters.push(where('startDate', '<=', toDate))
  return fromQuery(await getDocs(query(events, ...filters, orderBy('startDate'))))
}

export async function getEvent(eventId) {
  return fromDoc(await getDoc(doc(events, eventId)))
}

// Event without poster = the camp (SPEC §4.3).
export async function createEvent({
  title,
  audience,
  organizerIds,
  startDate,
  endDate,
  withPoster,
}) {
  const ref = await addDoc(events, {
    title,
    audience,
    organizerIds,
    startDate,
    endDate,
    price: null,
    cancelled: false,
    deleted: false,
    registrationOpen: false,
    registrationDeadline: null,
    posterStatus: withPoster ? 'missing' : 'none',
    createdBy: auth.currentUser.uid,
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function updateEvent(eventId, fields) {
  return updateDoc(doc(events, eventId), { ...fields, updatedAt: serverTimestamp() })
}

export function setCancelled(eventId, cancelled) {
  return updateEvent(eventId, { cancelled })
}

// Soft delete — sign-ups and payments are kept.
export function deleteEvent(eventId) {
  return updateEvent(eventId, { deleted: true })
}

// Opening registration triggers the e-mail to parents (Cloud Function, later).
export function setRegistration(eventId, { open, deadline }) {
  return updateEvent(eventId, { registrationOpen: open, registrationDeadline: deadline })
}

// ---- poster ----

export async function getPoster(eventId) {
  const snap = await getDoc(posterRef(eventId))
  return snap.exists() ? snap.data() : null
}

// Saves poster content, price and status ('draft' | 'published') together.
export function savePoster(eventId, { content, price, publish }) {
  const batch = writeBatch(db)
  batch.set(posterRef(eventId), content)
  batch.update(doc(events, eventId), {
    price,
    posterStatus: publish ? 'published' : 'draft',
    updatedAt: serverTimestamp(),
  })
  return batch.commit()
}

// ---- participants ----

// Leaders only — parents read their children's docs one by one.
export async function listParticipants(eventId) {
  return fromQuery(await getDocs(collection(events, eventId, 'participants')))
}

export function subscribeParticipants(eventId, callback, onError) {
  return onSnapshot(
    collection(events, eventId, 'participants'),
    (snap) => callback(fromQuery(snap)),
    onError,
  )
}

export async function getParticipant(eventId, memberId) {
  return fromDoc(await getDoc(participantRef(eventId, memberId)))
}

// Used by parents (before the deadline) and leaders (any time).
export function setSignedUp(eventId, memberId, signedUp) {
  return setDoc(
    participantRef(eventId, memberId),
    { signedUp, signedUpBy: auth.currentUser.uid, signedUpAt: serverTimestamp() },
    { merge: true },
  )
}

// Leaders only: { attended, paid, amountPaid }.
export function setAttendance(eventId, memberId, fields) {
  return setDoc(participantRef(eventId, memberId), fields, { merge: true })
}
