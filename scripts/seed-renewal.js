// Creates a waiting-list entry awaiting renewal in the Firestore emulator and
// prints its renewal link — a stand-in for the annual reset, which is not built yet.
// Usage: npm run seed:renewal [-- --too-old]

import { createHash } from 'node:crypto'
import { hashRenewalToken, newRenewalToken } from '../functions/src/renewalTokens.js'
import { dedupeKey } from '../functions/src/shared/waitlistRules.js'

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

const tooOld = process.argv.includes('--too-old')
const token = newRenewalToken()

const entry = {
  firstName: tooOld ? 'Matěj' : 'Eliška',
  lastName: tooOld ? 'Starší' : 'Obnovená',
  gender: tooOld ? 'boy' : 'girl',
  birthDate: tooOld ? '2010-05-20' : '2017-10-02',
  grade: tooOld ? 9 : 2,
  gradeSchoolYear: 2026,
  parentName: 'Jana Obnovená',
  email: 'jana.obnovena@example.cz',
  phone: '+420731222333',
  knowsSomeone: true,
  knowsWhom: 'Tonda z Vlčušek',
  status: 'awaitingRenewal',
  leaderNote: '',
  renewalTokenHash: hashRenewalToken(token),
}

const value = (v) =>
  typeof v === 'string'
    ? { stringValue: v }
    : typeof v === 'boolean'
      ? { booleanValue: v }
      : { integerValue: String(v) }

const fields = Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, value(v)]))
fields.firstSignedUpAt = { timestampValue: '2024-03-11T10:00:00Z' }
fields.statusChangedAt = { timestampValue: new Date().toISOString() }
fields.renewalDates = { arrayValue: { values: [{ timestampValue: '2025-08-26T08:00:00Z' }] } }

const id = createHash('sha256').update(dedupeKey(entry)).digest('hex').slice(0, 24)
const url = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents/waitlist/${id}`
const res = await fetch(url, {
  method: 'PATCH',
  headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields }),
})
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)

console.log(`${entry.firstName} ${entry.lastName} awaits renewal:`)
console.log(`${APP_URL}/cekaci-listina/obnovit/${token}`)
