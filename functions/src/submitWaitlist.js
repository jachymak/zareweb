import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { sendEmails } from './mail.js'
import { emailTemplate, renderEmail } from './shared/emails.js'
import { db } from './admin.js'
import { ENFORCE_APP_CHECK, MAIL_OPTIONS } from './options.js'
import { gradeSchoolYear, pragueToday } from './shared/schoolYear.js'
import {
  DEFAULT_MAX_AGE,
  dedupeKey,
  normalizePhone,
  validateWaitlistEntry,
} from './shared/waitlistRules.js'

const FIELDS = [
  'firstName',
  'lastName',
  'gender',
  'birthDate',
  'grade',
  'parentName',
  'email',
  'phone',
  'knowsSomeone',
  'knowsWhom',
]

const clean = (s) => s.trim().replace(/\s+/g, ' ')

/**
 * Public waiting-list sign-up — SPEC §2.2.
 * Returns `{ status: 'created' }` or `{ status: 'duplicate' }`.
 *
 * The document id is derived from the child's name and date of birth, so a
 * duplicate (any status) is detected atomically by `create()` failing.
 */
export const submitWaitlist = onCall(
  {
    ...MAIL_OPTIONS,
    enforceAppCheck: ENFORCE_APP_CHECK,
  },
  async (request) => {
    const input = request.data ?? {}
    const entry = Object.fromEntries(FIELDS.map((k) => [k, input[k]]))

    const settings = (await db.doc('settings/public').get()).data() ?? {}
    const today = pragueToday()
    const errors = validateWaitlistEntry(entry, {
      today,
      maxAge: settings.waitlistMaxAge ?? DEFAULT_MAX_AGE,
    })
    if (Object.keys(errors).length) {
      throw new HttpsError('invalid-argument', 'Invalid sign-up.', { errors })
    }

    const key = dedupeKey(entry)
    const id = createHash('sha256').update(key).digest('hex').slice(0, 24)
    const now = FieldValue.serverTimestamp()

    try {
      await db
        .collection('waitlist')
        .doc(id)
        .create({
          firstName: clean(entry.firstName),
          lastName: clean(entry.lastName),
          gender: entry.gender,
          birthDate: entry.birthDate,
          grade: entry.grade,
          gradeSchoolYear: gradeSchoolYear(settings.lastWaitlistReset, today),
          parentName: clean(entry.parentName),
          email: entry.email.trim().toLowerCase(),
          phone: normalizePhone(entry.phone),
          knowsSomeone: entry.knowsSomeone,
          knowsWhom: entry.knowsSomeone ? clean(entry.knowsWhom) : '',
          firstSignedUpAt: now,
          status: 'active',
          statusChangedAt: now,
          renewalDates: [],
          renewalTokenHash: null,
          leaderNote: '',
        })
    } catch (e) {
      // gRPC ALREADY_EXISTS
      if (e.code === 6) return { status: 'duplicate' }
      throw e
    }

    logger.info('Waitlist sign-up created', { id })
    const stored = (await db.doc('settings/emails').get()).get('waitlistConfirmation')
    const email = renderEmail(emailTemplate('waitlistConfirmation', stored), {
      dite: `${clean(entry.firstName)} ${clean(entry.lastName)}`,
    })
    await sendEmails('Waitlist confirmation', [{ to: entry.email.trim().toLowerCase(), ...email }])
    return { status: 'created' }
  },
)
