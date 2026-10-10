// Seeds the Firestore emulator with the settings documents the app expects.
// Usage: npm run seed (emulators must be running). Writes bypass security rules.
// settings/meetings, settings/emails and settings/recorders are removed, so their defaults apply
// (DEFAULT_MEETING_SCHEDULE, DEFAULT_RENEWAL_EMAIL).

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'

const docs = {
  'settings/public': { lastWaitlistReset: '2026-08-24', waitlistWarnAge: 12, waitlistMaxAge: 15 },
  'settings/app': {
    campRequirements: { vlc: { trips: 4, meetingPct: 60 }, ss: { trips: 4, meetingPct: 60 } },
    webAdmin: { name: 'Hobit', email: 'spravce@zare.test' },
  },
}
const removed = ['settings/meetings', 'settings/emails', 'settings/recorders']

// Plain JS values → Firestore REST `fields`.
function toValue(v) {
  if (v === null) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'number') return { doubleValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  if (typeof v === 'object') {
    return {
      mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) },
    }
  }
  throw new Error(`Unsupported value: ${v}`)
}

for (const [path, data] of Object.entries(docs)) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toValue(v)]))
  const url = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  console.log(`seeded ${path}`)
}

for (const path of removed) {
  const url = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  console.log(`reset ${path} (defaults)`)
}
