import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db } from './admin.js'
import { BASE_OPTIONS } from './options.js'
import { hashRenewalToken, isWellFormedToken } from './renewalTokens.js'
import { gradeSchoolYear, pragueToday } from './shared/schoolYear.js'
import { DEFAULT_MAX_AGE, normalizePhone, validateWaitlistEntry } from './shared/waitlistRules.js'

// Waiting-list renewal by token — SPEC §2.3. The token comes from the renewal
// e-mail sent by the annual reset. All three calls are public.

const OPTIONS = {
  ...BASE_OPTIONS,
  // TODO: enforce App Check once a real Firebase project exists.
  enforceAppCheck: false,
}

// Fields the parent may change; name, gender and date of birth are read-only.
const EDITABLE = ['grade', 'parentName', 'email', 'phone', 'knowsSomeone', 'knowsWhom']

const clean = (s) => s.trim().replace(/\s+/g, ' ')

// Finds the entry awaiting renewal for a token, or throws `not-found`.
async function findEntry(token, tx) {
  if (!isWellFormedToken(token)) throw new HttpsError('not-found', 'Unknown renewal token.')
  const q = db
    .collection('waitlist')
    .where('renewalTokenHash', '==', hashRenewalToken(token))
    .limit(1)
  const snap = tx ? await tx.get(q) : await q.get()
  const doc = snap.docs[0]
  if (!doc || doc.get('status') !== 'awaitingRenewal') {
    throw new HttpsError('not-found', 'Unknown renewal token.')
  }
  return doc
}

// Previous answers for pre-filling the questionnaire, or null for an unknown or
// used token (an expected outcome for old e-mails, so not an error).
export const getRenewal = onCall(OPTIONS, async (request) => {
  let doc
  try {
    doc = await findEntry(request.data?.token)
  } catch (e) {
    if (e.code === 'not-found') return null
    throw e
  }
  const d = doc.data()
  return {
    firstName: d.firstName,
    lastName: d.lastName,
    gender: d.gender,
    birthDate: d.birthDate,
    grade: d.grade,
    gradeSchoolYear: d.gradeSchoolYear,
    parentName: d.parentName,
    email: d.email,
    phone: d.phone,
    knowsSomeone: d.knowsSomeone,
    knowsWhom: d.knowsWhom,
    firstSignedUpAt: d.firstSignedUpAt.toDate().toISOString(),
  }
})

// „Potvrdit zájem“ — back to `active`, keeping the original `firstSignedUpAt`.
export const confirmRenewal = onCall(OPTIONS, async (request) => {
  const input = request.data ?? {}
  const settings = (await db.doc('settings/public').get()).data() ?? {}
  const today = pragueToday()

  await db.runTransaction(async (tx) => {
    const doc = await findEntry(input.token, tx)
    const stored = doc.data()
    const entry = { ...stored, ...Object.fromEntries(EDITABLE.map((k) => [k, input[k]])) }
    const errors = validateWaitlistEntry(entry, {
      today,
      maxAge: settings.waitlistMaxAge ?? DEFAULT_MAX_AGE,
    })
    if (Object.keys(errors).length) {
      throw new HttpsError('invalid-argument', 'Invalid renewal.', { errors })
    }
    tx.update(doc.ref, {
      grade: entry.grade,
      gradeSchoolYear: gradeSchoolYear(settings.lastWaitlistReset, today),
      parentName: clean(entry.parentName),
      email: entry.email.trim().toLowerCase(),
      phone: normalizePhone(entry.phone),
      knowsSomeone: entry.knowsSomeone,
      knowsWhom: entry.knowsSomeone ? clean(entry.knowsWhom) : '',
      status: 'active',
      statusChangedAt: FieldValue.serverTimestamp(),
      renewalDates: FieldValue.arrayUnion(Timestamp.now()),
      renewalTokenHash: null, // single use
    })
  })

  logger.info('Waitlist renewal confirmed')
  return { status: 'confirmed' }
})

// „O místo už nemáme zájem“ — the entry is deleted.
export const withdrawRenewal = onCall(OPTIONS, async (request) => {
  await db.runTransaction(async (tx) => {
    const doc = await findEntry(request.data?.token, tx)
    tx.delete(doc.ref)
  })
  logger.info('Waitlist entry withdrawn by parent')
  return { status: 'withdrawn' }
})
