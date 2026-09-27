import { CHILD_CATEGORIES, LEADER_CATEGORIES } from '../shared/skautis.js'
import { SkautisError } from './client.js'

// Loads the children and leaders of both troops from skautIS — SPEC §4.8.
// A troop = one oddíl (by registration number). Members are split by their
// membership category: children (vlče, světluška, skaut, skautka) and leaders
// (rover, ranger — whatever their age); other categories are left out, only
// counted. Before reading an oddíl the login switches to a role that can see
// it: a role on the oddíl itself (vedoucí/admin first), else one of a unit
// above it (e.g. the středisko).

const CONCURRENCY = 6

async function mapLimit(items, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const fullName = (first, last) => [clean(first), clean(last)].filter(Boolean).join(' ')

// Roles that may see the unit, most likely first: roles on the unit, then on
// units above it (registration number is a prefix), vedoucí/admin roles first.
function candidateRoles(roles, unit) {
  const rank = (r) => {
    const onUnit = r.ID_Unit === unit.ID
    const above =
      !onUnit &&
      r.RegistrationNumber &&
      unit.RegistrationNumber.startsWith(`${r.RegistrationNumber}.`)
    if (!onUnit && !above) return null
    const admin = /vedouc|admin/i.test(`${r.Key ?? ''} ${r.Role ?? ''}`)
    return (onUnit ? 0 : 2) + (admin ? 0 : 1)
  }
  return roles
    .map((r) => ({ r, rank: rank(r) }))
    .filter((x) => x.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.r)
}

// Switches to a role that can list the unit's members; returns the members.
async function membersWithRole(call, token, roles, unit) {
  for (const role of candidateRoles(roles, unit)) {
    await call('UserManagement', 'LoginUpdate', { ID: token, ID_UserRole: role.ID })
    try {
      return await call('OrganizationUnit', 'MembershipAll', {
        ID_Unit: unit.ID,
        OnlyDirectMember: false,
        IsValid: true,
      })
    } catch (e) {
      if (!(e instanceof SkautisError) || !e.denied) throw e
    }
  }
  return null
}

async function loadChild(call, m, troop) {
  const [person, parents] = await Promise.all([
    call('OrganizationUnit', 'PersonDetail', { ID: m.ID_Person }),
    call('OrganizationUnit', 'PersonParentAll', { ID_Person: m.ID_Person }),
  ])
  return {
    id: m.ID_Person,
    firstName: clean(person.FirstName) ?? '',
    lastName: clean(person.LastName) ?? '',
    nickname: clean(person.NickName) ?? '',
    troop,
    birthDate: (person.Birthday ?? m.Birthday ?? '').slice(0, 10) || null,
    parents: parents.map((p) => ({
      name: fullName(p.FirstName, p.LastName) || clean(p.Parent) || '',
      email: clean(p.Email),
      phone: clean(p.Phone),
    })),
  }
}

async function loadLeader(call, m, troop) {
  const [person, contacts] = await Promise.all([
    call('OrganizationUnit', 'PersonDetail', { ID: m.ID_Person }),
    call('OrganizationUnit', 'PersonContactAll', { ID_Person: m.ID_Person }),
  ])
  const contact = (type) =>
    clean(contacts.find((c) => c.ID_ContactType === `${type}_hlavni`)?.Value) ??
    clean(contacts.find((c) => c.ID_ContactType?.startsWith(type))?.Value)
  return {
    id: m.ID_Person,
    name: fullName(person.FirstName, person.LastName),
    nickname: clean(person.NickName) ?? '',
    phone: contact('telefon'),
    email: contact('email') ?? clean(person.Email),
    troop,
  }
}

// units: { vlc: '116.22.220', ss: '116.22.222' } (registration numbers).
// Returns { units: { troop: { regNumber, name } }, children, leaders,
// skipped: { [category name]: count } }. Throws SkautisError, or an Error
// with `code` 'unit-not-found' / 'no-role' and `regNumber`.
export async function loadFromSkautis(call, token, units) {
  const user = await call('UserManagement', 'UserDetail', {})
  const roles = await call('UserManagement', 'UserRoleAll', { ID_User: user.ID, IsActive: true })

  const result = { units: {}, children: new Map(), leaders: new Map(), skipped: {} }
  for (const [troop, regNumber] of Object.entries(units)) {
    const unit = (
      await call('OrganizationUnit', 'UnitAll', { RegistrationNumber: regNumber })
    ).find((u) => u.RegistrationNumber === regNumber)
    if (!unit)
      throw Object.assign(new Error(`Unit ${regNumber} not found`), {
        code: 'unit-not-found',
        regNumber,
      })
    result.units[troop] = { regNumber, name: unit.DisplayName }

    const members = await membersWithRole(call, token, roles, unit)
    if (!members)
      throw Object.assign(new Error(`No role for ${regNumber}`), { code: 'no-role', regNumber })

    // One record per person: within a troop a regular membership wins over a
    // guest one; across troops the first troop wins.
    const regularFirst = [...members].sort(
      (a, b) => (a.ID_MembershipType !== 'radne') - (b.ID_MembershipType !== 'radne'),
    )
    const children = []
    const leaders = []
    for (const m of regularFirst) {
      const category = m.ID_MembershipCategory
      if (CHILD_CATEGORIES.includes(category)) {
        if (!result.children.has(m.ID_Person) && !children.some((c) => c.ID_Person === m.ID_Person))
          children.push(m)
      } else if (LEADER_CATEGORIES.includes(category)) {
        if (!result.leaders.has(m.ID_Person) && !leaders.some((l) => l.ID_Person === m.ID_Person))
          leaders.push(m)
      } else {
        const name = m.MembershipCategory || category || '?'
        result.skipped[name] = (result.skipped[name] ?? 0) + 1
      }
    }
    for (const c of await mapLimit(children, (m) => loadChild(call, m, troop)))
      result.children.set(c.id, c)
    for (const l of await mapLimit(leaders, (m) => loadLeader(call, m, troop)))
      result.leaders.set(l.id, l)
  }
  return {
    units: result.units,
    children: [...result.children.values()],
    leaders: [...result.leaders.values()],
    skipped: result.skipped,
  }
}
