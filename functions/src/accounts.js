import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db } from './admin.js'
import { BASE_OPTIONS } from './options.js'

// Account management by the admin — SPEC §4.8 „účty a párování“.

// Deletes an account without access (role `none`): the Auth account, the
// profile and any pairings. The client can't delete other Auth accounts.
export const deleteAccount = onCall(BASE_OPTIONS, async (request) => {
  const caller = request.auth?.uid
  if (!caller) throw new HttpsError('unauthenticated', 'Sign in first.')
  const callerDoc = await db.doc(`users/${caller}`).get()
  if (callerDoc.get('role') !== 'admin') throw new HttpsError('permission-denied', 'Admins only.')

  const uid = request.data?.uid
  if (typeof uid !== 'string' || !uid || uid === caller) {
    throw new HttpsError('invalid-argument', 'Invalid account.')
  }
  const ref = db.doc(`users/${uid}`)
  const profile = await ref.get()
  if (!profile.exists || profile.get('role') !== 'none') {
    throw new HttpsError('failed-precondition', 'Only accounts without access can be deleted.')
  }

  const paired = await db.collection('members').where('parentUids', 'array-contains', uid).get()
  const batch = db.batch()
  paired.forEach((m) => batch.update(m.ref, { parentUids: FieldValue.arrayRemove(uid) }))
  batch.delete(ref)
  await batch.commit()

  try {
    await getAuth().deleteUser(uid)
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e
  }
  logger.info('Account deleted', { uid, by: caller })
  return { deleted: true }
})
