import { randomInt } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db, requireLeader } from './admin.js'
import { hashPassword } from './carddav.js'
import { BASE_OPTIONS } from './options.js'

// The leader's password for the phone address book (CardDAV) — SPEC §4.10.

// Without look-alike characters (0/o, 1/l/i), so it can be typed from the screen.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

// „k7mq-3vxa-…“: 16 random characters (~79 bits) in groups of four.
function generatePassword() {
  const chars = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)])
  return chars.join('').match(/.{4}/g).join('-')
}

// Creates a new password for the caller (the old one stops working) and
// returns it once with the user name (the account e-mail).
export const createPhonePassword = onCall(BASE_OPTIONS, async (request) => {
  const uid = await requireLeader(request)
  const email = (await db.doc(`users/${uid}`).get()).get('email')?.trim().toLowerCase()
  if (!email) throw new HttpsError('failed-precondition', 'The account has no e-mail.')

  const password = generatePassword()
  const batch = db.batch()
  batch.set(db.doc(`phonePasswords/${uid}`), {
    email,
    hash: hashPassword(password),
    createdAt: FieldValue.serverTimestamp(),
  })
  batch.set(
    db.doc(`phoneContacts/${uid}`),
    { passwordSetAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
  await batch.commit()
  logger.info('Phone password created', { uid })
  return { password, user: email }
})
