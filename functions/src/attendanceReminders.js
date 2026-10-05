import { FieldValue } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/scheduler'
import { db } from './admin.js'
import { APP_URL, sendEmails } from './mail.js'
import { MAIL_OPTIONS } from './options.js'
import { emailTemplate, renderEmail } from './shared/emails.js'
import {
  meetingRecorders,
  meetingSchedule,
  meetsOn,
  REMINDER_DELAY_MINUTES,
  timeAfter,
  weekdayOf,
} from './shared/meetingDays.js'
import { nicknameOf } from './shared/names.js'
import { pragueToday } from './shared/schoolYear.js'

// Reminder about unrecorded attendance — SPEC §4.2, §7: an hour after today's
// meeting ends, if `meetings/{troop_date}` doesn't exist yet (neither recorded
// nor „schůzka nebyla“), the leaders set in Administration (schůzky) to record
// that meeting day get an e-mail with a link to it. Once per meeting
// (`attendanceReminders/{troop_date}`), only when enabled in Administration (e-maily).

const TROOP_NAMES = { vlc: 'vlčušky', ss: 'skauti a skautky' }
const WEEKDAY_NAMES = { mon: 'pondělí', tue: 'úterý', wed: 'středa', thu: 'čtvrtek', fri: 'pátek' }

const pragueTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Prague',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// `2026-10-05` → `pondělí 5. 10.`
const dayLabel = (date) =>
  `${WEEKDAY_NAMES[weekdayOf(date)]} ${Number(date.slice(8))}. ${Number(date.slice(5, 7))}.`

// [{ to, jmeno }] of the active leaders: the e-mail of their linked account,
// else the one from skautIS; one per address.
async function recipients(personIds) {
  const people = (await db.getAll(...personIds.map((id) => db.doc(`skautisPeople/${id}`)))).filter(
    (p) => p.exists && p.get('active') !== false,
  )
  if (!people.length) return []
  const accounts = await db
    .collection('users')
    .where(
      'personId',
      'in',
      people.map((p) => p.id),
    )
    .get()
  const accountEmail = Object.fromEntries(
    accounts.docs
      .filter((u) => ['leader', 'admin'].includes(u.get('role')))
      .map((u) => [u.get('personId'), u.get('email')]),
  )
  const seen = new Set()
  return people
    .map((p) => ({ to: accountEmail[p.id] || p.get('email'), jmeno: nicknameOf(p.data()) }))
    .filter(({ to }) => {
      const key = to?.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

// Sends the reminders due at `now`; exported for the emulator test script.
export async function sendAttendanceReminders(now = new Date()) {
  const today = pragueToday(now)
  const time = pragueTime.format(now)
  const schedule = meetingSchedule((await db.doc('settings/meetings').get()).data())
  const due = ['vlc', 'ss'].filter((troop) => {
    const remindAt = timeAfter(schedule[troop].end, REMINDER_DELAY_MINUTES)
    return meetsOn(schedule, troop, today) && remindAt && time >= remindAt
  })
  if (!due.length) return

  const template = emailTemplate(
    'attendanceReminder',
    (await db.doc('settings/emails').get()).get('attendanceReminder'),
  )
  if (!template.enabled) return
  const recorders = meetingRecorders((await db.doc('settings/recorders').get()).data())

  for (const troop of due) {
    const personIds = recorders[troop][weekdayOf(today)] ?? []
    if (!personIds.length) continue
    const id = `${troop}_${today}`
    if ((await db.doc(`meetings/${id}`).get()).exists) continue
    // Claims the meeting first, so a run that overlaps never sends twice.
    try {
      await db.doc(`attendanceReminders/${id}`).create({
        troop,
        date: today,
        createdAt: FieldValue.serverTimestamp(),
      })
    } catch (e) {
      if (e.code === 6) continue // ALREADY_EXISTS — sent before
      throw e
    }
    const odkaz = `${APP_URL}/vedouci/dochazka?oddil=${troop}&schuzka=${today}`
    const values = { oddil: TROOP_NAMES[troop], den: dayLabel(today), odkaz }
    const emails = (await recipients(personIds)).map(({ to, jmeno }) => ({
      to,
      ...renderEmail(template, { ...values, jmeno }),
    }))
    await sendEmails('attendanceReminder', emails)
  }
}

export const remindAttendance = onSchedule(
  // Meetings are Mon–Fri; on the hour and half past, so a meeting ending at :00 or :30
  // gets the reminder right an hour later.
  { ...MAIL_OPTIONS, schedule: '0,30 * * * 1-5', timeZone: 'Europe/Prague' },
  () => sendAttendanceReminders(),
)
