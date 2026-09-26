// Seeds the Firestore emulator with children (as the skautIS sync will import
// them) and their parents' contacts. Pairs `rodic@zare.test` with two children
// (one per troop) and sets some meeting days (normally set in Administration).
// Run after `seed-users.js`. Usage: npm run seed:members. Writes bypass security rules.

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const DOCS = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }

// id = skautIS person id. `pairedWith`: e-mails of seeded accounts to pair.
// `meetingDay`: web data, not from skautIS.
export const MEMBERS = [
  {
    id: '900101',
    firstName: 'Anna',
    lastName: 'Nováková',
    nickname: 'Žabka',
    troop: 'vlc',
    birthDate: '2017-05-14',
    parents: [{ name: 'Jana Nováková', email: 'cekajici@zare.test', phone: '+420 731 111 222' }],
  },
  {
    id: '900102',
    firstName: 'Klára',
    lastName: 'Krejčí',
    nickname: 'Sojka',
    troop: 'vlc',
    birthDate: '2016-11-02',
    meetingDay: 'thu',
    parents: [{ name: 'Rodič Testovací', email: 'rodic@zare.test', phone: '+420 602 333 444' }],
    pairedWith: ['rodic@zare.test'],
  },
  {
    id: '900103',
    firstName: 'Eliška',
    lastName: 'Dubová',
    nickname: 'Liška',
    troop: 'vlc',
    birthDate: '2018-02-20',
    meetingDay: 'mon',
    parents: [
      { name: 'Tomáš Dub', email: 'dub.tomas@example.cz', phone: '+420 777 555 666' },
      { name: 'Petra Dubová', email: 'petra.dubova@example.cz', phone: null },
    ],
  },
  {
    id: '900104',
    firstName: 'Antonín',
    lastName: 'Registrovaný',
    nickname: 'Kulíšek',
    troop: 'vlc',
    birthDate: '2017-09-30',
    parents: [{ name: 'Jana Registrovaná', email: 'jana.jina@example.cz', phone: null }],
  },
  {
    id: '900201',
    firstName: 'Tomáš',
    lastName: 'Dub',
    nickname: 'Bobr',
    troop: 'ss',
    birthDate: '2013-04-08',
    meetingDay: 'tue',
    parents: [
      { name: 'Tomáš Dub', email: 'dub.tomas@example.cz', phone: '+420 777 555 666' },
      { name: 'Rodič Testovací', email: 'rodic@zare.test', phone: '+420 602 333 444' },
    ],
    pairedWith: ['rodic@zare.test'],
  },
  {
    id: '900202',
    firstName: 'Matěj',
    lastName: 'Pokorný',
    nickname: 'Vydra',
    troop: 'ss',
    birthDate: '2012-12-12',
    meetingDay: 'tue',
    parents: [{ name: 'Jiří Pokorný', email: 'pokorny.j@example.cz', phone: '+420 608 777 888' }],
  },
  {
    id: '900203',
    firstName: 'Jakub',
    lastName: 'Horák',
    nickname: 'Ježek',
    troop: 'ss',
    birthDate: '2011-07-01',
    parents: [{ name: 'Eva Horáková', email: 'horakova@example.cz', phone: null }],
    active: false, // left the group — no longer in skautIS
  },
]

// Plain JS values → Firestore REST values.
function toValue(v) {
  if (v === null) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  return { mapValue: { fields: toFields(v) } }
}
const toFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]))

async function put(path, data) {
  const res = await fetch(`${DOCS}/${path}`, {
    method: 'PATCH',
    headers: OWNER,
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
}

async function uidsByEmail() {
  const res = await fetch(`${DOCS}/users?pageSize=300`, { headers: OWNER })
  const docs = (await res.json()).documents ?? []
  return Object.fromEntries(
    docs.map((d) => [d.fields.email?.stringValue, d.name.split('/').at(-1)]),
  )
}

const uids = await uidsByEmail()
const now = new Date()
for (const { id, parents, pairedWith = [], active = true, meetingDay = null, ...child } of MEMBERS) {
  const parentUids = pairedWith.map((email) => uids[email]).filter(Boolean)
  await put(`members/${id}`, {
    skautisPersonId: Number(id),
    ...child,
    meetingDay,
    parentUids,
    active,
    syncedAt: now,
  })
  await put(`members/${id}/private/contacts`, { parents })
  console.log(
    `${child.troop.padEnd(3)} ${child.nickname.padEnd(8)} ${child.firstName} ${child.lastName}`,
  )
}
