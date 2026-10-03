import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  getDoc as firestoreGetDoc,
  getDocFromServer,
  getDocs as firestoreGetDocs,
  getDocsFromServer,
  getFirestore,
} from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const env = import.meta.env

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'europe-west3')
export const storage = getStorage(app)

if (env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

// Firestore can wait for minutes on a connection that died silently (the
// computer slept, the network changed, the browser froze a background tab);
// a reload fixes it. So the connection is restarted right when that may have
// happened, before the user clicks anywhere, and as a fallback when a read
// (getDoc / getDocs below) takes longer than READ_STALL_MS — it then runs again
// from the server. A restart lets pending reads resolve from the (possibly
// empty) cache, so such results and offline errors are retried from the server.
const READ_STALL_MS = 6000
const STALLED = Symbol('stalled')
let reconnecting = null
let lastReconnectAt = 0

// Restarts the connection unless that already happened since `since`.
function reconnect(since, reason) {
  if (!reconnecting && lastReconnectAt < since) {
    lastReconnectAt = Date.now()
    console.warn(`Firestore reconnecting (${reason})`)
    reconnecting = disableNetwork(db)
      .then(() => enableNetwork(db))
      .finally(() => (reconnecting = null))
  }
  return reconnecting
}

// Moments after which the connection may be dead: waking from sleep (a timer
// fires much later than set), coming back online, returning to a tab hidden
// for a while (Chrome throttles or freezes those).
const WAKE_CHECK_MS = 10000
const LONG_HIDDEN_MS = 5 * 60000
if (typeof window !== 'undefined') {
  let lastTick = Date.now()
  setInterval(() => {
    const now = Date.now()
    if (now - lastTick > 3 * WAKE_CHECK_MS) reconnect(now, 'woke up')
    lastTick = now
  }, WAKE_CHECK_MS)
  window.addEventListener('online', () => reconnect(Date.now(), 'back online'))
  let hiddenAt = null
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now()
    else if (hiddenAt && Date.now() - hiddenAt > LONG_HIDDEN_MS) reconnect(Date.now(), 'tab shown')
  })
}

async function resilientRead(read, readFromServer, ref) {
  const startedAt = Date.now()
  const first = read(ref)
  first.catch(() => {}) // may settle after it was given up on
  let timer
  const stalled = new Promise((resolve) => (timer = setTimeout(resolve, READ_STALL_MS, STALLED)))
  let snap
  try {
    snap = await Promise.race([first, stalled])
  } catch (e) {
    if (e.code !== 'unavailable') throw e
  } finally {
    clearTimeout(timer)
  }
  if (snap && snap !== STALLED && !snap.metadata.fromCache) return snap
  await (snap === STALLED ? reconnect(startedAt, 'read stalled') : reconnecting)
  return readFromServer(ref)
}

export const getDoc = (ref) => resilientRead(firestoreGetDoc, getDocFromServer, ref)
export const getDocs = (query) => resilientRead(firestoreGetDocs, getDocsFromServer, query)

// App Check (SPEC §2.2) guards the public functions (waiting list, renewal), so it is
// started only before calling them, not on every page. Fraud Defense (reCAPTCHA
// Enterprise), key in VITE_RECAPTCHA_SITE_KEY; none with the emulators.
let appCheck = null
export function ensureAppCheck() {
  if (env.VITE_USE_EMULATORS === 'true' || !env.VITE_RECAPTCHA_SITE_KEY) return Promise.resolve()
  appCheck ??= import('firebase/app-check').then(
    ({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: false,
      })
    },
  )
  return appCheck
}
