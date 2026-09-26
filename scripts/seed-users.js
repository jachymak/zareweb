// Creates test accounts in the Auth + Firestore emulators, one per role,
// all with the password `heslo1234`. Existing accounts are reused.
// Usage: npm run seed:users (emulators must be running). Writes bypass security rules.

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'

export const PASSWORD = 'heslo1234'
export const USERS = [
  { email: 'spravce@zare.test', displayName: 'Správce Testovací', role: 'admin' },
  { email: 'vedouci@zare.test', displayName: 'Vedoucí Testovací', role: 'leader' },
  { email: 'rodic@zare.test', displayName: 'Rodič Testovací', role: 'parent' },
  {
    email: 'cekajici@zare.test',
    displayName: 'Čekající Testovací',
    role: 'pending',
    note: 'Anna Nováková (Žabka), vlčušky',
  },
  { email: 'zamitnuty@zare.test', displayName: 'Zamítnutý Testovací', role: 'none' },
]

async function identityToolkit(method, body) {
  const url = `http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=demo`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  })
  return res.json()
}

// Uid of the account, created if it doesn't exist yet.
async function ensureAccount(email) {
  const created = await identityToolkit('signUp', { email, password: PASSWORD })
  if (created.localId) return created.localId
  const signedIn = await identityToolkit('signInWithPassword', { email, password: PASSWORD })
  if (!signedIn.localId) throw new Error(`${email}: ${JSON.stringify(signedIn.error ?? created)}`)
  return signedIn.localId
}

const str = (v) => (v == null ? { nullValue: null } : { stringValue: v })

async function writeProfile(uid, { email, displayName, role, note = null }) {
  const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`
  const fields = {
    email: str(email),
    displayName: str(displayName),
    role: str(role),
    note: str(note),
    createdAt: { timestampValue: new Date().toISOString() },
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`users/${uid}: ${res.status} ${await res.text()}`)
}

for (const user of USERS) {
  const uid = await ensureAccount(user.email)
  await writeProfile(uid, user)
  console.log(`${user.role.padEnd(8)} ${user.email}  (uid ${uid})`)
}
console.log(`password for all: ${PASSWORD}`)
