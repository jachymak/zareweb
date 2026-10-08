import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/https'

// Imported by every function module, so the app exists before first use.
initializeApp()
export const db = getFirestore()

// For callables of the admin only; returns the caller's uid.
export async function requireAdmin(request) {
  const caller = request.auth?.uid
  if (!caller) throw new HttpsError('unauthenticated', 'Sign in first.')
  const callerDoc = await db.doc(`users/${caller}`).get()
  if (callerDoc.get('role') !== 'admin') throw new HttpsError('permission-denied', 'Admins only.')
  return caller
}

// For callables of leaders and admins; returns the caller's uid.
export async function requireLeader(request) {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.')
  const role = (await db.doc(`users/${uid}`).get()).get('role')
  if (!['leader', 'admin'].includes(role))
    throw new HttpsError('permission-denied', 'Leaders only.')
  return uid
}
