// Seeds the Firestore emulator with the settings documents the app expects.
// Usage: npm run seed (emulators must be running). Writes bypass security rules.

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'

const docs = {
  'settings/public': { lastWaitlistReset: '2026-08-24', waitlistWarnAge: 12, waitlistMaxAge: 15 },
  'settings/app': { campMinTrips: 4, campMinMeetingPct: 60 },
}

// Plain JS values → Firestore REST `fields`.
function toValue(v) {
  if (typeof v === 'string') return { stringValue: v }
  if (Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'number') return { doubleValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
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
