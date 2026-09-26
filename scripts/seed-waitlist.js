// Seeds the Firestore emulator with a waiting list as the public form and the
// annual resets would have built it: ~35 active entries signed up over the last
// years (some renewed, some with a leaders' note), plus one entry awaiting
// renewal and one admitted child, which the leaders' list must not show.
// Dates are relative to today. Replaces the whole `waitlist` collection and
// `waitlistResets`. Usage: npm run seed:waitlist. Writes bypass security rules.

import { createHash } from 'node:crypto'
import { gradeSchoolYear, pragueToday } from '../functions/src/shared/schoolYear.js'
import { dedupeKey, suggestGrade } from '../functions/src/shared/waitlistRules.js'

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const DOCS = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }

// settings/public.lastWaitlistReset as `npm run seed` writes it; resets happen late in August.
export const LAST_RESET = '2026-08-24'
const RESET_DAY = '08-24'

const GIRLS = [
  'Anežka',
  'Eliška',
  'Tereza',
  'Karolína',
  'Adéla',
  'Natálie',
  'Ema',
  'Rozálie',
  'Barbora',
  'Klára',
  'Johana',
  'Sofie',
]
const BOYS = [
  'Jakub',
  'Tomáš',
  'Matyáš',
  'Vojtěch',
  'Adam',
  'Filip',
  'Šimon',
  'David',
  'Lukáš',
  'Matěj',
  'Kryštof',
  'Antonín',
]
const SURNAMES = [
  ['Novák', 'Nováková'],
  ['Svoboda', 'Svobodová'],
  ['Dvořák', 'Dvořáková'],
  ['Černý', 'Černá'],
  ['Procházka', 'Procházková'],
  ['Kučera', 'Kučerová'],
  ['Veselý', 'Veselá'],
  ['Horák', 'Horáková'],
  ['Němec', 'Němcová'],
  ['Pokorný', 'Pokorná'],
  ['Král', 'Králová'],
  ['Fiala', 'Fialová'],
]
const PARENTS = [
  'Petra',
  'Lucie',
  'Jana',
  'Martin',
  'Petr',
  'Kateřina',
  'Tomáš',
  'Veronika',
  'Pavel',
]
const KNOWS = [
  'Bára Fialová z Vlčušek',
  'vedoucí Kuba (Medvěd)',
  'sestra Ema, 222. oddíl',
  'Naše Anička chodí do Vlčušek už druhým rokem a moc ji to baví, mladší sestra se nemůže dočkat, až bude moct taky. Vedoucí Bára nás zná z táborů.',
  'spolužák Šimon Král',
]

// Entries with a leaders' note (by index), shown with the gold frame.
const NOTES = {
  4: 'Sestřenice vedoucí Lucky — nebude se účastnit výběru nováčků.',
  17: 'Rodiče volali 3/2025, dítě má celiakii — probrat před případným přijetím.',
}

const ascii = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export const entryId = (entry) =>
  createHash('sha256').update(dedupeKey(entry)).digest('hex').slice(0, 24)

// The seeded entries (plain values; dates as `YYYY-MM-DD`), deterministic for a given day.
export function buildWaitlist(today = pragueToday()) {
  let seed = 20260924
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const pick = (list) => list[Math.floor(random() * list.length)]
  const schoolYear = gradeSchoolYear(LAST_RESET, today)

  const entries = []
  for (let i = 0; i < 35; i++) {
    const x = random()
    const gender = i === 9 ? 'other' : x < 0.48 ? 'girl' : 'boy'
    const [he, she] = SURNAMES[i % SURNAMES.length]
    // Surnames repeat every 12 entries, first names shift by one each round: unique names.
    const nameIndex = (i + Math.floor(i / SURNAMES.length)) % GIRLS.length
    const firstName =
      gender === 'girl' ? GIRLS[nameIndex] : gender === 'boy' ? BOYS[nameIndex] : 'Robin'
    const lastName = gender === 'girl' ? she : he
    // Ages 2–13, sign-ups at least half a year after birth, up to 5 years back.
    const ageDays = Math.round((2 + random() * 11) * 365.25)
    const birthDate = addDays(today, -ageDays)
    const waitDays = Math.round(10 + random() ** 0.8 * Math.min(5 * 365, ageDays - 180))
    const signedUp = addDays(today, -waitDays)
    const renewals = []
    for (let y = Number(signedUp.slice(0, 4)); `${y}-${RESET_DAY}` <= LAST_RESET; y++) {
      const reset = `${y}-${RESET_DAY}`
      if (reset > signedUp) renewals.push(addDays(reset, 3))
    }
    const parentFirst = pick(PARENTS)
    const parentLast = /[ae]$/.test(parentFirst) ? she : he
    const knowsSomeone = random() < 0.38
    entries.push({
      firstName,
      lastName,
      gender,
      birthDate,
      grade: suggestGrade(birthDate, schoolYear),
      gradeSchoolYear: schoolYear,
      parentName: `${parentFirst} ${parentLast}`,
      email: `${ascii(parentFirst)}.${ascii(parentLast)}${i}@example.cz`,
      phone: `+420${pick(['602', '604', '721', '737'])}${String(100000 + Math.floor(random() * 900000))}`,
      knowsSomeone,
      knowsWhom: knowsSomeone ? pick(KNOWS) : '',
      firstSignedUpAt: signedUp,
      status: 'active',
      renewalDates: renewals,
      leaderNote: NOTES[i] ?? '',
    })
  }
  const base = {
    gradeSchoolYear: schoolYear,
    knowsSomeone: false,
    knowsWhom: '',
    leaderNote: '',
    renewalDates: [],
  }
  entries.push(
    {
      ...base,
      firstName: 'Petr',
      lastName: 'Neodpověděl',
      gender: 'boy',
      birthDate: addDays(today, -9 * 365),
      grade: 3,
      parentName: 'Jan Neodpověděl',
      email: 'jan.neodpovedel@example.cz',
      phone: '+420602111222',
      firstSignedUpAt: addDays(today, -800),
      status: 'awaitingRenewal',
    },
    {
      ...base,
      firstName: 'Alžběta',
      lastName: 'Přijatá',
      gender: 'girl',
      birthDate: addDays(today, -8 * 365),
      grade: 2,
      parentName: 'Eva Přijatá',
      email: 'eva.prijata@example.cz',
      phone: '+420602333444',
      firstSignedUpAt: addDays(today, -600),
      status: 'admitted',
    },
  )
  return entries.map((e) => ({ id: entryId(e), ...e }))
}

// ---- Firestore REST ----

const timestamp = (iso) => ({ timestampValue: `${iso}T10:00:00Z` })

function toValue(v) {
  if (v === null) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map((d) => timestamp(d)) } }
  throw new Error(`Unsupported value: ${v}`)
}

async function list(path) {
  const res = await fetch(`${DOCS}/${path}?pageSize=300`, { headers: OWNER })
  return (await res.json()).documents ?? []
}

async function clear(collection) {
  for (const d of await list(collection)) {
    await fetch(`http://${HOST}/v1/${d.name}`, { method: 'DELETE', headers: OWNER })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await clear('waitlist')
  await clear('waitlistResets')
  const entries = buildWaitlist()
  for (const { id, firstSignedUpAt, ...entry } of entries) {
    const fields = Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, toValue(v)]))
    fields.firstSignedUpAt = timestamp(firstSignedUpAt)
    fields.statusChangedAt = timestamp(entry.renewalDates.at(-1) ?? firstSignedUpAt)
    fields.renewalTokenHash = { nullValue: null }
    const res = await fetch(`${DOCS}/waitlist/${id}`, {
      method: 'PATCH',
      headers: OWNER,
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) throw new Error(`waitlist/${id}: ${res.status} ${await res.text()}`)
  }
  const active = entries.filter((e) => e.status === 'active').length
  console.log(`${entries.length} waiting-list entries (${active} active)`)
}
