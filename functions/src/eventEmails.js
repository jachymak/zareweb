import { FieldValue } from 'firebase-admin/firestore'
import { onDocumentUpdated } from 'firebase-functions/firestore'
import { db } from './admin.js'
import { APP_URL, sendEmails } from './mail.js'
import { MAIL_OPTIONS } from './options.js'
import { emailTemplate, renderEmail } from './shared/emails.js'
import { canJoin, formatEventDates, registrationState, sendsEventEmails } from './shared/events.js'
import { pragueToday } from './shared/schoolYear.js'
import { nicknameOf } from './shared/names.js'
import { parentEmails } from './shared/skautisExport.js'

// E-mails to parents about an event — SPEC §6.5, §7: when leaders start the
// registration (registrationOpened) or publish the poster (posterPublished,
// which also reminds of a running registration; it replaces the registration
// e-mail when both happen at once). Each is sent once per event
// (registrationNotifiedAt, posterNotifiedAt) and only when enabled in Administration.
// Recipients: parents of the active children who can join, at their main
// e-mails from skautIS (as the troop's conference) and the child's own e-mail
// when the parents want it to get them too (`own.mailedEmails`) — the e-mail of a paired
// parent account only for a child with no parent e-mail in skautIS at all, and
// never an address from a parent's note (they don't want mass e-mails).
// One e-mail per address.

const joinNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} a ${names.at(-1)}` : names[0]

const emailKey = (email) => email?.trim().toLowerCase() || null

// { email: [child names] } for the event.
async function recipients(event) {
  const members = (await db.collection('members').where('active', '==', true).get()).docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => canJoin(event, m))
  const uids = [...new Set(members.flatMap((m) => m.parentUids ?? []))]
  const users = uids.length ? await db.getAll(...uids.map((uid) => db.doc(`users/${uid}`))) : []
  const accountEmail = Object.fromEntries(
    users.filter((u) => u.get('role') === 'parent').map((u) => [u.id, u.get('email')]),
  )
  const contacts = members.length
    ? await db.getAll(...members.map((m) => db.doc(`members/${m.id}/private/contacts`)))
    : []
  const parentsOf = members.map((m, i) => contacts[i].get('parents') ?? [])
  const mailedOwnOf = members.map((m, i) => contacts[i].get('own')?.mailedEmails ?? [])
  const quiet = new Set(parentsOf.flat().flatMap((p) => (p.noteEmails ?? []).map(emailKey)))

  const byEmail = new Map()
  const add = (email, name) => {
    const key = emailKey(email)
    if (!key || quiet.has(key)) return
    if (!byEmail.has(key)) byEmail.set(key, [])
    if (!byEmail.get(key).includes(name)) byEmail.get(key).push(name)
  }
  members.forEach((m, i) => {
    const name = nicknameOf(m)
    const parents = parentsOf[i]
    for (const parent of parents) add(parent.email, name)
    for (const email of mailedOwnOf[i]) add(email, name)
    if (!parents.some((p) => parentEmails(p).length)) {
      for (const uid of m.parentUids ?? []) add(accountEmail[uid], name)
    }
  })
  return byEmail
}

export const onEventUpdated = onDocumentUpdated(
  { ...MAIL_OPTIONS, document: 'events/{eventId}' },
  async ({ data, params }) => {
    const before = data.before.data()
    const event = data.after.data()
    const today = pragueToday()
    if (!sendsEventEmails(event, today)) return

    const opened =
      !before.registrationOpen && event.registrationOpen && !event.registrationNotifiedAt
    const published =
      before.posterStatus !== 'published' &&
      event.posterStatus === 'published' &&
      !event.posterNotifiedAt
    const kind = published ? 'posterPublished' : opened ? 'registrationOpened' : null
    if (!kind) return

    const stored = (await db.doc('settings/emails').get()).get(kind)
    const template = emailTemplate(kind, stored)
    if (!template.enabled) return

    const registrationOpen = registrationState(event, today) === 'open'
    const deadline = event.registrationDeadline ? formatEventDates(event.registrationDeadline) : ''
    const values = {
      akce: event.title,
      termin: formatEventDates(event.startDate, event.endDate),
      uzaverka: deadline,
      prihlasovani: registrationOpen
        ? `Přihlásit můžete na webu oddílu do ${deadline}: ${APP_URL}/clenove`
        : '',
      odkaz:
        kind === 'posterPublished'
          ? `${APP_URL}/clenove/akce/${params.eventId}`
          : `${APP_URL}/clenove`,
    }
    const emails = [...(await recipients(event))].map(([to, names]) => ({
      to,
      ...renderEmail(template, { ...values, dite: joinNames(names) }),
    }))

    await sendEmails(kind, emails)
    await data.after.ref.update({
      ...(published && { posterNotifiedAt: FieldValue.serverTimestamp() }),
      ...((opened || (published && registrationOpen)) && {
        registrationNotifiedAt: FieldValue.serverTimestamp(),
      }),
    })
  },
)
