import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db, requireAdmin } from './admin.js'
import { BASE_OPTIONS } from './options.js'
import { SKAUTIS } from './shared/skautis.js'
import { SkautisError, skautisClient } from './skautis/client.js'
import { FIXTURE_TOKENS, fixtureClient } from './skautis/fixture.js'
import { loadFromSkautis } from './skautis/load.js'
import { MEMBER_FIELDS, PERSON_FIELDS, planSummary, planSync } from './skautis/plan.js'

// skautIS sync — SPEC §4.8 skautIS. The admin logs in to skautIS, the web
// passes the login token to previewSkautisSync, which loads both troops,
// keeps the loaded data in skautisSync/pending and returns what would change;
// applySkautisSync then writes exactly that (compared again with the current
// data). Admins only.

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PENDING = 'skautisSync/pending'
const PENDING_MAX_AGE_MS = 60 * 60 * 1000
const BATCH_SIZE = 400 // Firestore allows 500 writes per batch

const isFixture = (token) =>
  process.env.FUNCTIONS_EMULATOR === 'true' && FIXTURE_TOKENS.includes(token)

async function loadCurrent() {
  const [membersSnap, peopleSnap] = await Promise.all([
    db.collection('members').get(),
    db.collection('skautisPeople').get(),
  ])
  const contacts = membersSnap.size
    ? await db.getAll(...membersSnap.docs.map((d) => d.ref.collection('private').doc('contacts')))
    : []
  return {
    members: membersSnap.docs.map((d, i) => ({
      id: d.id,
      ...d.data(),
      parents: contacts[i].get('parents') ?? [],
    })),
    people: peopleSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  }
}

// Maps a failed load to an error the web explains (details.reason).
function loadError(e) {
  if (e.code === 'no-role' || e.code === 'unit-not-found') {
    return new HttpsError('failed-precondition', e.message, {
      reason: e.code,
      regNumber: e.regNumber,
    })
  }
  if (e instanceof SkautisError) {
    if (e.loggedOut) {
      return new HttpsError('failed-precondition', e.message, { reason: 'login-expired' })
    }
    return new HttpsError('unavailable', e.message, { reason: 'skautis', message: e.message })
  }
  return e
}

// data: { token } — the skautIS login token. Returns { units, skipped,
// parentsUnavailable, members, people } (planSummary).
export const previewSkautisSync = onCall(
  { ...BASE_OPTIONS, timeoutSeconds: 300 },
  async (request) => {
    const caller = await requireAdmin(request)
    const token = request.data?.token
    if (typeof token !== 'string' || !(GUID.test(token) || isFixture(token))) {
      throw new HttpsError('invalid-argument', 'Invalid skautIS token.')
    }

    const call = isFixture(token)
      ? fixtureClient(SKAUTIS.units, token)
      : skautisClient({ url: SKAUTIS.url, appId: SKAUTIS.appId, token })
    let loaded
    try {
      loaded = await loadFromSkautis(call, token, SKAUTIS.units)
    } catch (e) {
      logger.warn('skautIS load failed', { message: e.message })
      throw loadError(e)
    } finally {
      // The token is not needed any more: log out of skautIS.
      await call('UserManagement', 'LoginUpdateLogout', { ID: token }).catch(() => {})
    }

    const { members, people } = await loadCurrent()
    const plan = planSync(loaded, members, people)
    await db.doc(PENDING).set({ loaded, createdBy: caller, createdAt: Timestamp.now() })
    logger.info('skautIS sync previewed', {
      by: caller,
      children: loaded.children.length,
      leaders: loaded.leaders.length,
      parentsUnavailable: loaded.parentsUnavailable,
    })
    return {
      units: loaded.units,
      skipped: loaded.skipped,
      parentsUnavailable: loaded.parentsUnavailable,
      ...planSummary(plan),
    }
  },
)

// Writes the previewed sync. Returns { members: { added, changed, removed },
// people: { … } } (counts).
export const applySkautisSync = onCall(BASE_OPTIONS, async (request) => {
  const caller = await requireAdmin(request)
  const pendingRef = db.doc(PENDING)
  const pending = await pendingRef.get()
  if (!pending.exists) {
    throw new HttpsError('failed-precondition', 'Nothing to apply.', { reason: 'no-pending' })
  }
  if (Date.now() - pending.get('createdAt').toMillis() > PENDING_MAX_AGE_MS) {
    await pendingRef.delete()
    throw new HttpsError('failed-precondition', 'The preview is too old.', { reason: 'expired' })
  }

  const { members, people } = await loadCurrent()
  const plan = planSync(pending.get('loaded'), members, people)
  const now = FieldValue.serverTimestamp()
  const pick = (record, fields) => Object.fromEntries(fields.map((f) => [f, record[f] ?? null]))
  const memberFields = MEMBER_FIELDS.filter((f) => f !== 'parents')
  // Parents' contacts are written only when skautIS gave them.
  const withParents = !pending.get('loaded').parentsUnavailable
  const ops = []

  for (const m of plan.members.added) {
    const ref = db.doc(`members/${m.id}`)
    ops.push((b) =>
      b.set(ref, {
        skautisPersonId: Number(m.id),
        ...pick(m, memberFields),
        meetingDay: null,
        parentUids: [],
        active: true,
        syncedAt: now,
      }),
    )
    if (withParents) {
      ops.push((b) => b.set(ref.collection('private').doc('contacts'), { parents: m.parents }))
    }
  }
  for (const m of plan.members.changed) {
    const ref = db.doc(`members/${m.id}`)
    ops.push((b) => b.update(ref, { ...pick(m, memberFields), active: true, syncedAt: now }))
    if (m.fields.some((f) => f.field === 'parents')) {
      ops.push((b) => b.set(ref.collection('private').doc('contacts'), { parents: m.parents }))
    }
  }
  for (const m of plan.members.removed) {
    ops.push((b) => b.update(db.doc(`members/${m.id}`), { active: false, syncedAt: now }))
  }

  for (const p of plan.people.added) {
    ops.push((b) =>
      b.set(db.doc(`skautisPeople/${p.id}`), {
        ...pick(p, PERSON_FIELDS),
        troop: p.troop, // first guess of the home troop, the admin can change it
        roleTitle: null,
        active: true,
        syncedAt: now,
      }),
    )
  }
  for (const p of plan.people.changed) {
    ops.push((b) =>
      b.update(db.doc(`skautisPeople/${p.id}`), {
        ...pick(p, PERSON_FIELDS),
        active: true,
        syncedAt: now,
      }),
    )
  }
  for (const p of plan.people.removed) {
    ops.push((b) => b.update(db.doc(`skautisPeople/${p.id}`), { active: false, syncedAt: now }))
  }

  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db.batch()
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch))
    await batch.commit()
  }
  await db.doc('settings/skautis').set({ lastSyncAt: now, lastSyncBy: caller }, { merge: true })
  await pendingRef.delete()

  const counts = (d) => ({
    added: d.added.length,
    changed: d.changed.length,
    removed: d.removed.length,
  })
  const result = { members: counts(plan.members), people: counts(plan.people) }
  logger.info('skautIS sync applied', { by: caller, ...result })
  return result
})
