// What a skautIS sync changes — SPEC §4.8 skautIS. Pure: compares the loaded
// data with the current `members` (+ parents' contacts) and `skautisPeople`.
// Only skautIS fields are compared and written; web data (meeting day,
// pairings, a leader's home troop and role title) is kept.

export const MEMBER_FIELDS = ['firstName', 'lastName', 'nickname', 'troop', 'birthDate', 'parents']
export const PERSON_FIELDS = ['name', 'nickname', 'phone', 'email']

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

// incoming: [{ id, ...fields }] from skautIS; current: [{ id, active, ...fields }].
// Returns { added, changed: [{ ...record, fields: [{ field, from, to }] }],
// removed, unchanged: number }; a returning (inactive) record is `changed`
// with field `active`.
function diff(incoming, current, fields) {
  const byId = new Map(current.map((r) => [r.id, r]))
  const seen = new Set(incoming.map((r) => r.id))
  const added = []
  const changed = []
  let unchanged = 0
  for (const record of incoming) {
    const old = byId.get(record.id)
    if (!old) {
      added.push(record)
      continue
    }
    const changes = fields
      .filter((f) => !same(old[f], record[f]))
      .map((f) => ({ field: f, from: old[f] ?? null, to: record[f] ?? null }))
    if (!old.active) changes.unshift({ field: 'active', from: false, to: true })
    // Fields not compared (e.g. a leader's home troop) stay as they are.
    const updated = Object.fromEntries(fields.map((f) => [f, record[f]]))
    if (changes.length) changed.push({ ...old, ...updated, fields: changes })
    else unchanged++
  }
  const removed = current.filter((r) => r.active && !seen.has(r.id))
  return { added, changed, removed, unchanged }
}

// Without parents' contacts from skautIS (loaded.parentsUnavailable) the
// stored ones are neither compared nor overwritten.
const comparedMemberFields = (loaded) =>
  loaded.parentsUnavailable ? MEMBER_FIELDS.filter((f) => f !== 'parents') : MEMBER_FIELDS

// loaded: loadFromSkautis() result; members: current members with `parents`
// from their private contacts; people: current skautisPeople.
export function planSync(loaded, members, people) {
  return {
    members: diff(loaded.children, members, comparedMemberFields(loaded)),
    people: diff(loaded.leaders, people, PERSON_FIELDS),
  }
}

// Short labels for the Administration list.
export const memberLabel = (m) => ({
  id: m.id,
  troop: m.troop,
  nickname: m.nickname || null,
  name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
})
export const personLabel = (p) => ({
  id: p.id,
  troop: p.troop ?? null,
  nickname: p.nickname || null,
  name: p.name ?? '',
})

// The plan as returned to the web: labels and changed fields only.
export function planSummary(plan) {
  const side = (d, label) => ({
    added: d.added.map(label),
    changed: d.changed.map((r) => ({ ...label(r), fields: r.fields })),
    removed: d.removed.map(label),
    unchanged: d.unchanged,
  })
  return { members: side(plan.members, memberLabel), people: side(plan.people, personLabel) }
}
