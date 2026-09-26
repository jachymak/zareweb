// Seeds the Firestore emulator with the group's activity, as leaders will enter
// it on their pages: leaders (as the skautIS sync imports them) and contacts,
// events with sign-ups and attendance, news, and recorded meetings of this
// school year. Dates are relative to today, so the data always has upcoming,
// open, closed and past events. Replaces `skautisPeople`, `contacts`, `events`
// (incl. posters and participants), `news` and `meetings`.
// Run after `seed-members.js`. Usage: npm run seed:activity. Writes bypass security rules.

import { pragueToday, schoolYearRange } from '../functions/src/shared/schoolYear.js'

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const DOCS = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }

const today = pragueToday()

// today ± days as `YYYY-MM-DD`
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
const day = (n) => addDays(today, n)
const daysAgo = (n) => new Date(Date.now() - n * 86400000)

// id = skautIS person id.
export const LEADERS = [
  { id: '800001', nickname: 'Ondys', name: 'Ondřej Sýkora', roleTitle: 'rádce Bobrů', group: 'vlc', phone: '+420 608 117 442', email: 'ondys@example.cz' },
  { id: '800002', nickname: 'Nina', name: 'Nina Bártová', roleTitle: 'zástupkyně vedoucího', group: 'vlc', phone: '+420 721 404 118', email: 'nina@example.cz' },
  { id: '800003', nickname: 'Oskar', name: 'Oskar Beneš', roleTitle: 'rádce Veverek', group: 'vlc', phone: null, email: 'oskar@example.cz' },
  { id: '800011', nickname: 'Hobit', name: 'Theodor Mikolajek', roleTitle: 'vedoucí oddílu', group: 'ss', phone: '+420 776 772 777', email: 'hobit@example.cz' },
  { id: '800012', nickname: 'Jasmína', name: 'Jasmína Kolářová', roleTitle: 'zástupkyně vedoucího', group: 'ss', phone: '+420 608 213 900', email: 'jasmina@example.cz' },
  { id: '800013', nickname: 'Kuba', name: 'Jakub Horský', roleTitle: 'rádce Rysů', group: 'ss', phone: '+420 776 330 128', email: 'kuba@example.cz' },
  { id: '800021', nickname: 'Elina', name: 'Elina Procházková', roleTitle: 'hospodářka, vedoucí tábora', group: 'other', phone: '+420 704 889 210', email: 'elina@example.cz' },
  { id: '800022', nickname: 'Quido', name: 'Quido Hanulík', roleTitle: 'správce klubovny', group: 'other', phone: '+420 735 305 823', email: 'quido@example.cz' },
]

// `participants`: { memberId: fields }. Children: 900102 Sojka (vlc), 900201 Bobr (ss).
export const EVENTS = [
  // open for sign-up
  { id: 'seed-stredohori', title: 'Výprava do Středohoří', audience: 'vlc', startDate: day(10), endDate: day(11), organizerIds: ['800001'], registration: day(5), posterStatus: 'published', price: 350, participants: { 900102: { signedUp: true } } },
  { id: 'seed-kokorin', title: 'Podzimní výprava na Kokořín', audience: 'all', startDate: day(14), endDate: day(16), organizerIds: ['800012', '800002'], registration: day(8), posterStatus: 'missing' },
  // registration ended, not started yet
  { id: 'seed-uzly', title: 'Uzlovací závody', audience: 'ss', startDate: day(3), endDate: day(3), organizerIds: ['800013'], registration: day(-1), posterStatus: 'published' },
  // upcoming without registration
  { id: 'seed-okor', title: 'Jednodenní výprava na Okoř', audience: 'vlc', startDate: day(20), endDate: day(20), organizerIds: ['800001'], posterStatus: 'draft', cancelled: true },
  { id: 'seed-blanik', title: 'Výprava na Blaník', audience: 'ss', startDate: day(30), endDate: day(32), organizerIds: ['800011'], posterStatus: 'missing' },
  { id: 'seed-hra', title: 'Oddílová hra po Praze', audience: 'all', startDate: day(40), endDate: day(40), organizerIds: ['800002'], posterStatus: 'missing' },
  { id: 'seed-tabor', title: 'Letní tábor', audience: 'all', startDate: day(280), endDate: day(294), organizerIds: [], posterStatus: 'none' },
  { id: 'seed-smazana', title: 'Smazaná akce', audience: 'all', startDate: day(12), endDate: day(12), organizerIds: ['800002'], posterStatus: 'missing', deleted: true },
  // past
  { id: 'seed-zahajovaci', title: 'Zahajovací výprava', audience: 'all', startDate: day(-12), endDate: day(-11), organizerIds: ['800011'], registration: day(-16), posterStatus: 'published', participants: { 900102: { signedUp: true, attended: true }, 900201: { signedUp: true, attended: false } } },
  { id: 'seed-brdy', title: 'Výprava do Brd', audience: 'ss', startDate: day(-8), endDate: day(-7), organizerIds: ['800013'], registration: day(-11), posterStatus: 'published', participants: { 900201: { signedUp: true, attended: true } } },
  { id: 'seed-sarka', title: 'Hry v Šárce', audience: 'vlc', startDate: day(-5), endDate: day(-5), organizerIds: ['800001'], registration: day(-8), posterStatus: 'published', participants: { 900102: { signedUp: true, attended: true } } },
  { id: 'seed-odpoledne', title: 'Zahajovací odpoledne v klubovně', audience: 'all', startDate: day(-20), endDate: day(-20), organizerIds: ['800002'], posterStatus: 'none' },
]

// Newest first as parents see them; `important` is pinned on top.
export const NEWS = [
  { id: 'seed-satky', title: 'Vlčušky mají nové šátky', body: 'Na schůzkách jsme rozdali nové šátky. Kdo ho ještě nemá, ať se ozve na nejbližší schůzce.', audience: 'vlc', author: 'Ondys', age: 2 },
  { id: 'seed-piknik', title: 'Piknik s rodiči v Šárce', body: 'V sobotu odpoledne grilujeme a hrajeme s rodiči v Divoké Šárce. Přijďte, ať se poznáme.', audience: 'all', author: 'Nina', age: 4 },
  { id: 'seed-zkousky', title: 'Skautské zkoušky na podzim', body: 'Starší družiny budou skládat zkoušky druhé třídy. Co se k nim učit, rozdáme na schůzce.', audience: 'ss', author: 'Jasmína', age: 6 },
  { id: 'seed-prispevky', title: 'Členské příspěvky na školní rok', body: 'Prosíme o zaplacení 1 500 Kč na účet 2400123456/2010 do konce října, do zprávy napište přezdívku dítěte.', audience: 'all', author: 'Hobit', age: 10, important: true, linkLabel: 'platební údaje', linkUrl: 'https://example.cz/prispevky' },
  { id: 'seed-stazena', title: 'Stažená zpráva', body: 'Tuhle zprávu rodiče neuvidí.', audience: 'all', author: 'Hobit', age: 1, withdrawn: true },
]

const TROOP_DAYS = { vlc: ['mon', 'thu'], ss: ['tue', 'wed'] }
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]

// Past meeting dates of this school year per troop and weekday, oldest first.
// The 2nd meeting of each weekday was cancelled, the latest one is not recorded
// yet; a child misses every third recorded meeting.
export function buildMeetings(members) {
  const { from } = schoolYearRange(today)
  const meetings = []
  for (const [troop, weekdays] of Object.entries(TROOP_DAYS)) {
    for (const weekday of weekdays) {
      const dates = []
      for (let d = from; d < today; d = addDays(d, 1)) if (weekdayOf(d) === weekday) dates.push(d)
      const kids = members.filter((m) => m.troop === troop && m.meetingDay === weekday)
      dates.slice(0, -1).forEach((date, i) => {
        const cancelled = i === 1
        const presentIds = cancelled ? [] : kids.filter((_, k) => (i + k) % 3 !== 2).map((m) => m.id)
        meetings.push({ troop, date, weekday, cancelled, presentIds })
      })
    }
  }
  return meetings
}

// ---- Firestore REST ----

function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  return { mapValue: { fields: toFields(v) } }
}
const toFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]))

function fromValue(v) {
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromValue)
  if ('nullValue' in v) return null
  return v.stringValue ?? v.booleanValue ?? v.integerValue ?? v.timestampValue
}

async function put(path, data) {
  const res = await fetch(`${DOCS}/${path}`, {
    method: 'PATCH',
    headers: OWNER,
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
}

async function list(path) {
  const res = await fetch(`${DOCS}/${path}?pageSize=300`, { headers: OWNER })
  return (await res.json()).documents ?? []
}

const remove = (name) => fetch(`http://${HOST}/v1/${name}`, { method: 'DELETE', headers: OWNER })

async function clear(collection, subcollections = []) {
  for (const d of await list(collection)) {
    const path = d.name.split('/documents/')[1]
    for (const sub of subcollections) for (const s of await list(`${path}/${sub}`)) await remove(s.name)
    await remove(d.name)
  }
}

// ---- seed ----

if (import.meta.url === `file://${process.argv[1]}`) {
  const members = (await list('members'))
    .map((d) => ({
      id: d.name.split('/').at(-1),
      ...Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fromValue(v)])),
    }))
    .filter((m) => m.active)

  for (const c of ['skautisPeople', 'contacts', 'news', 'meetings']) await clear(c)
  await clear('events', ['participants', 'poster'])

  const now = new Date()
  for (const [order, { id, group, ...person }] of LEADERS.entries()) {
    await put(`skautisPeople/${id}`, {
      ...person,
      troop: group === 'other' ? null : group,
      active: true,
      syncedAt: now,
    })
    await put(`contacts/seed-${id}`, { personId: id, group, photoUrl: null, order })
  }
  console.log(`${LEADERS.length} leaders and contacts`)

  for (const { id, registration, participants = {}, ...event } of EVENTS) {
    await put(`events/${id}`, {
      price: null,
      cancelled: false,
      deleted: false,
      ...event,
      registrationOpen: !!registration,
      registrationDeadline: registration ?? null,
      createdBy: 'seed',
      updatedAt: now,
    })
    if (event.posterStatus === 'published') {
      await put(`events/${id}/poster/content`, {
        intro: `Pojeďte s námi — ${event.title}.`,
        packingItems: ['spacák', 'karimatka', 'pláštěnka'],
      })
    }
    for (const [memberId, fields] of Object.entries(participants)) {
      await put(`events/${id}/participants/${memberId}`, {
        signedUpBy: 'seed',
        signedUpAt: now,
        attended: null,
        paid: false,
        ...fields,
      })
    }
  }
  console.log(`${EVENTS.length} events`)

  for (const { id, author, age, important = false, withdrawn = false, ...news } of NEWS) {
    await put(`news/${id}`, {
      linkLabel: null,
      linkUrl: null,
      ...news,
      important,
      withdrawn,
      authorUid: 'seed',
      authorName: author,
      publishedAt: daysAgo(age),
    })
  }
  console.log(`${NEWS.length} news`)

  const meetings = buildMeetings(members)
  for (const m of meetings) {
    await put(`meetings/${m.troop}_${m.date}`, { ...m, updatedBy: 'seed', updatedAt: now })
  }
  console.log(`${meetings.length} recorded meetings since ${schoolYearRange(today).from}`)
}
