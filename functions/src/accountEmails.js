import { FieldValue } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/firestore'
import { db } from './admin.js'
import { APP_URL, sendEmails } from './mail.js'
import { BASE_OPTIONS } from './options.js'
import { emailTemplate, renderEmail } from './shared/emails.js'

// E-mails about accounts — SPEC §2.4, §7:
// - to the admins when a pending account has its note (right at registration,
//   after a first Google login once the note is filled in); once per account
//   (adminNotifiedAt). The text is fixed, only admins read it.
// - to the user when the admin approves the account (pending → parent / leader
//   / admin), with the paired children for parents; only the first approval
//   (approvalNotifiedAt), so unpairing and pairing again sends nothing.

const APPROVED = ['parent', 'leader', 'admin']
const TROOP_NAMES = { vlc: 'vlčušky', ss: 'skauti a skautky' }

const joinNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} a ${names.at(-1)}` : names[0]

async function notifyAdmins(user) {
  const admins = await db.collection('users').where('role', '==', 'admin').get()
  const emails = admins.docs
    .map((d) => d.get('email'))
    .filter(Boolean)
    .map((to) => ({
      to,
      subject: `Nový účet čeká na schválení: ${user.email}`,
      text: [
        `Na webu oddílu si založil/a účet ${user.displayName || 'bez jména'} (${user.email}).`,
        `Poznámka:\n${user.note}`,
        `Schválit nebo zamítnout ho můžeš v Administraci: ${APP_URL}/vedouci/administrace?zalozka=ucty`,
      ].join('\n\n'),
    }))
  await sendEmails('newAccount', emails)
}

async function notifyApproved(uid, user) {
  const template = emailTemplate(
    'accountApproved',
    (await db.doc('settings/emails').get()).get('accountApproved'),
  )
  let deti = ''
  if (user.role === 'parent') {
    const children = (
      await db.collection('members').where('parentUids', 'array-contains', uid).get()
    ).docs
      .map((d) => d.data())
      .filter((m) => m.active !== false)
      .map((m) => `${m.nickname || m.firstName} (${TROOP_NAMES[m.troop] ?? m.troop})`)
    if (children.length) deti = `Přiřadili jsme k němu: ${joinNames(children)}.`
  }
  const odkaz = `${APP_URL}${user.role === 'parent' ? '/clenove' : '/vedouci'}`
  await sendEmails('accountApproved', [
    { to: user.email, ...renderEmail(template, { deti, odkaz }) },
  ])
}

export const onUserWritten = onDocumentWritten(
  { ...BASE_OPTIONS, document: 'users/{uid}' },
  async ({ data, params }) => {
    const before = data.before.exists ? data.before.data() : null
    const user = data.after.exists ? data.after.data() : null
    if (!user?.email) return
    const update = {}

    if (user.role === 'pending' && user.note && !user.adminNotifiedAt) {
      await notifyAdmins(user)
      update.adminNotifiedAt = FieldValue.serverTimestamp()
    }
    if (before?.role === 'pending' && APPROVED.includes(user.role) && !user.approvalNotifiedAt) {
      await notifyApproved(params.uid, user)
      update.approvalNotifiedAt = FieldValue.serverTimestamp()
    }
    if (Object.keys(update).length) await data.after.ref.update(update)
  },
)
