import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db } from './admin.js'
import { BASE_OPTIONS } from './options.js'
import { hashRenewalToken, newRenewalToken } from './renewalTokens.js'
import { renderRenewalEmail, renewalEmailTemplate } from './shared/renewalEmail.js'
import { pragueToday, recruitmentYears } from './shared/schoolYear.js'

// Annual waiting-list reset — SPEC §4.6. Entries are archived, not deleted:
// the admitted ones → `admitted`, all other active ones → `awaitingRenewal`
// with a renewal token for the e-mail to their parents. What the previous reset
// archived is deleted: entries still awaiting renewal (no answer for a whole
// year) and the children admitted then (in skautIS by now). Admins only.

// Where renewal links point (the web app); set APP_URL in functions/.env for production.
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const BATCH_SIZE = 400 // Firestore allows 500 writes per batch

async function commitInBatches(ops) {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db.batch()
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch))
    await batch.commit()
  }
}

// data: { admittedIds: string[] } — ids of active entries admitted this year.
// Returns { date, admittedCount, emailedCount, deletedCount }.
export const resetWaitlist = onCall(BASE_OPTIONS, async (request) => {
  const caller = request.auth?.uid
  if (!caller) throw new HttpsError('unauthenticated', 'Sign in first.')
  const callerDoc = await db.doc(`users/${caller}`).get()
  if (callerDoc.get('role') !== 'admin') {
    throw new HttpsError('permission-denied', 'Admins only.')
  }

  const admittedIds = request.data?.admittedIds ?? []
  if (!Array.isArray(admittedIds) || admittedIds.some((id) => typeof id !== 'string')) {
    throw new HttpsError('invalid-argument', 'admittedIds must be a list of entry ids.')
  }
  const admitted = new Set(admittedIds)

  const [active, archived, emailSettings] = await Promise.all([
    db.collection('waitlist').where('status', '==', 'active').get(),
    db.collection('waitlist').where('status', 'in', ['awaitingRenewal', 'admitted']).get(),
    db.doc('settings/emails').get(),
  ])
  const unknown = [...admitted].filter((id) => !active.docs.some((d) => d.id === id))
  if (unknown.length) {
    throw new HttpsError('failed-precondition', 'Some admitted entries are not on the list.', {
      unknown,
    })
  }

  const template = renewalEmailTemplate(emailSettings.get('waitlistRenewal'))
  const now = FieldValue.serverTimestamp()
  const ops = []
  const emails = []

  archived.forEach((doc) => ops.push((b) => b.delete(doc.ref)))
  active.forEach((doc) => {
    if (admitted.has(doc.id)) {
      ops.push((b) => b.update(doc.ref, { status: 'admitted', statusChangedAt: now }))
      return
    }
    const token = newRenewalToken()
    ops.push((b) =>
      b.update(doc.ref, {
        status: 'awaitingRenewal',
        statusChangedAt: now,
        renewalTokenHash: hashRenewalToken(token),
      }),
    )
    emails.push({
      to: doc.get('email'),
      childName: `${doc.get('firstName')} ${doc.get('lastName')}`,
      link: `${APP_URL}/cekaci-listina/obnovit/${token}`,
    })
  })
  await commitInBatches(ops)

  const date = pragueToday()
  await db.doc('settings/public').set({ lastWaitlistReset: date }, { merge: true })
  await db.collection('waitlistResets').add({
    at: now,
    byUid: caller,
    admittedCount: admitted.size,
    emailedCount: emails.length,
    deletedCount: archived.size,
    recruitmentYear: recruitmentYears(date, date).doneYear,
  })

  // TODO: send the e-mails over SMTP (SPEC §7). Until then the emulator logs
  // them, so the renewal links can be tried locally; production logs no links.
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    for (const email of emails) {
      logger.info(`Renewal e-mail to ${email.to}: ${template.subject}`, {
        text: renderRenewalEmail(template, email),
      })
    }
  }

  logger.info('Waitlist reset', {
    by: caller,
    admitted: admitted.size,
    emailed: emails.length,
    deleted: archived.size,
  })
  return {
    date,
    admittedCount: admitted.size,
    emailedCount: emails.length,
    deletedCount: archived.size,
  }
})
