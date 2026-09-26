// Shared helpers for the end-to-end tests. They drive the running dev server
// in the system Chrome and check the Firebase emulators over REST.
// Tests modify emulator data (e.g. they clear the `waitlist` collection).

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

export const REPO = fileURLToPath(new URL('..', import.meta.url))
export const SCREENSHOTS = fileURLToPath(new URL('./screenshots/', import.meta.url))
mkdirSync(SCREENSHOTS, { recursive: true })

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-zareweb'
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
export const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
export const FUNCTIONS = `http://127.0.0.1:5001/${PROJECT}/europe-west3`
const AUTH = 'http://127.0.0.1:9099'
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Admin access to the Firestore emulator (bypasses security rules).
const OWNER = { Authorization: 'Bearer owner' }

// ---- reporting ----

export function createReport() {
  const results = []
  return {
    check(name, ok, detail = '') {
      results.push({ name, ok: !!ok })
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
    },
    // Summary line; returns the number of failures.
    finish() {
      const failed = results.filter((r) => !r.ok).length
      console.log(`\n${results.length - failed}/${results.length} passed`)
      return failed
    },
  }
}

// ---- browser ----

export function launchBrowser() {
  return chromium.launch({ executablePath: CHROME })
}

// Opens a page in a fresh context and collects console errors and callable function calls.
// Waits for `load` only: Firestore keeps a connection open, so `networkidle` never happens.
export async function openPage(browser, path, { width = 1280, height = 900, mobile = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
  })
  const page = await ctx.newPage()
  const errors = []
  const calls = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => r.url().startsWith(FUNCTIONS) && calls.push(r.url().split('/').at(-1)))
  await page.goto(APP_URL + path, { waitUntil: 'load' })
  return { ctx, page, errors, calls }
}

export const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

// ---- Firestore emulator ----

export async function listDocs(collection) {
  const res = await fetch(`${FIRESTORE}/${collection}?pageSize=300`, { headers: OWNER })
  return (await res.json()).documents ?? []
}

export async function deleteDoc(path) {
  await fetch(`${FIRESTORE}/${path}`, { method: 'DELETE', headers: OWNER })
}

export async function clearCollection(collection) {
  for (const d of await listDocs(collection)) {
    await fetch(`http://127.0.0.1:8080/v1/${d.name}`, { method: 'DELETE', headers: OWNER })
  }
}

// Sets fields of a document; `fields` in Firestore REST format.
export async function patchDoc(path, fields) {
  const mask = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${f}`)
    .join('&')
  const res = await fetch(`${FIRESTORE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { ...OWNER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
}

// Plain value of a Firestore REST field.
export function fieldValue(f) {
  if (!f) return undefined
  if ('nullValue' in f) return null
  return f.stringValue ?? f.integerValue ?? f.booleanValue ?? f.timestampValue ?? f.doubleValue
}

// ---- Auth emulator ----

// Deletes every account in the Auth emulator.
export async function clearAuthAccounts() {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
}

// E-mail action codes the emulator "sent" (password reset, …).
export async function listOobCodes() {
  const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)
  return (await res.json()).oobCodes ?? []
}

async function identityToolkit(method, body) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  })
  const data = await res.json()
  return { uid: data.localId, idToken: data.idToken }
}

// Signs in over REST; returns { uid, idToken } (undefined when it fails).
export const signInRest = (email, password) =>
  identityToolkit('signInWithPassword', { email, password })

// Creates an Auth account over REST; returns { uid, idToken }.
export const signUpRest = (email, password) => identityToolkit('signUp', { email, password })

// Updates fields of a document as a signed-in user (security rules apply); returns the HTTP status.
export async function patchDocAs(idToken, path, fields) {
  const mask = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${f}`)
    .join('&')
  const res = await fetch(`${FIRESTORE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  return res.status
}

// Calls a callable function directly (bypassing the web form).
export async function callFunction(name, data) {
  const res = await fetch(`${FUNCTIONS}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  return res.json()
}

// Calls a callable function as a signed-in user; returns the parsed response.
export async function callFunctionAs(idToken, name, data) {
  const res = await fetch(`${FUNCTIONS}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data }),
  })
  return res.json()
}

// Runs a project script (e.g. `seed-emulator.js`) and returns its stdout.
export function runScript(script, ...args) {
  return execFileSync('node', [`scripts/${script}`, ...args], { cwd: REPO }).toString()
}

// Fails fast with a clear message when the dev server or emulators aren't running.
export async function assertRunning() {
  const targets = {
    'dev server (npm run dev)': APP_URL,
    'Firestore emulator (npm run emulators)': 'http://127.0.0.1:8080',
    'Functions emulator (npm run emulators)': 'http://127.0.0.1:5001',
    'Auth emulator (npm run emulators)': AUTH,
  }
  for (const [name, url] of Object.entries(targets)) {
    try {
      await fetch(url)
    } catch {
      throw new Error(`${name} is not running at ${url}`)
    }
  }
}

// ---- dates (tests must not depend on the day they run) ----

export { pragueToday } from '../functions/src/shared/schoolYear.js'

// Today minus `years` years and `days` days, as `YYYY-MM-DD` (Prague).
export function yearsAgo(today, years, days = 0) {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(Date.UTC(y - years, m - 1, d - days))
  return date.toISOString().slice(0, 10)
}

// `2018-03-14` → keys typed into the DD / MM / RRRR fields: `14032018`
export const dateKeys = (iso) => iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4)

const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)

// Expected age text as the form shows it, e.g. „je jí 8 let a 6 měsíců“.
export function czechAge({ years, months }, lead) {
  const parts = []
  if (years) parts.push(`${years} ${plural(years, 'rok', 'roky', 'let')}`)
  if (months || !years) parts.push(`${months} ${plural(months, 'měsíc', 'měsíce', 'měsíců')}`)
  return `${lead} ${parts.join(' a ')}`
}
