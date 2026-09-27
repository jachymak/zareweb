import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db, requireAdmin } from './admin.js'
import { APP_URL, sendEmails } from './mail.js'
import { BASE_OPTIONS } from './options.js'
import { emailTemplate, renderEmail } from './shared/emails.js'
import { EMAIL_RE } from './shared/waitlistRules.js'

// Account management by the admin — SPEC §4.8 „účty a párování“.

const joinNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} a ${names.at(-1)}` : names[0]

// Deletes an account without access (role `none`): the Auth account, the
// profile and any pairings. The client can't delete other Auth accounts.
export const deleteAccount = onCall(BASE_OPTIONS, async (request) => {
  const caller = await requireAdmin(request)

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

// Invites a parent from the skautIS contacts to create an account (from „děti
// bez účtu“): an informative e-mail naming their children, with a link to the
// login page (not personalised — they may register with another address, e.g.
// Google). Remembered in invitations/{e-mail} so the admin sees who was invited when.
export const inviteParent = onCall(BASE_OPTIONS, async (request) => {
  const caller = await requireAdmin(request)
  const email = typeof request.data?.email === 'string' ? request.data.email.trim() : ''
  if (!EMAIL_RE.test(email)) throw new HttpsError('invalid-argument', 'Invalid e-mail.')
  const key = email.toLowerCase()

  const members = (await db.collection('members').where('active', '==', true).get()).docs
  const contacts = members.length
    ? await db.getAll(...members.map((m) => m.ref.collection('private').doc('contacts')))
    : []
  const names = members
    .filter((m, i) =>
      (contacts[i].get('parents') ?? []).some((p) => p.email?.trim().toLowerCase() === key),
    )
    .map((m) => m.get('nickname') || m.get('firstName'))
  if (!names.length) {
    throw new HttpsError('failed-precondition', 'No active child has this parent e-mail.')
  }

  const template = emailTemplate(
    'parentInvitation',
    (await db.doc('settings/emails').get()).get('parentInvitation'),
  )
  await sendEmails('parentInvitation', [
    {
      to: email,
      ...renderEmail(template, { dite: joinNames(names), odkaz: `${APP_URL}/prihlaseni` }),
    },
  ])
  await db.doc(`invitations/${key}`).set({
    email,
    sentAt: FieldValue.serverTimestamp(),
    sentBy: caller,
  })
  logger.info('Parent invited', { by: caller })
  return { sent: true }
})
