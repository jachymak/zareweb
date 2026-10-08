// The leaders' directory — SPEC §4.10. Entries for the web list and the vCards
// for the phone (CardDAV and „uložit do telefonu“). Dependency-free.

import { CARD_MARK, buildVCard } from './vcard.js'
import { foldText } from './skautisExport.js'

// Groups a leader can have in the phone (`phoneContacts.groups`).
export const PHONE_GROUPS = [
  { key: 'vlcParents', label: 'rodiče vlčušek' },
  { key: 'ssParents', label: 'rodiče skautů a skautek' },
  { key: 'vlcChildren', label: 'vlčušky (jejich vlastní čísla)' },
  { key: 'ssChildren', label: 'skauti a skautky (jejich vlastní čísla)' },
  { key: 'leaders', label: 'vedoucí' },
  { key: 'others', label: 'ostatní (starosta u tábora a tak)' },
]
export const ALL_GROUPS = PHONE_GROUPS.map((g) => g.key)

// The troop as written on a card (company and category).
const TROOP_CARD_NAME = { vlc: 'vlčušky', ss: 'skauti' }

// Problems of a shared contact (`sharedContacts`): { name?, reach? } — a name
// and at least a phone or an e-mail.
export function sharedContactErrors({ name = '', phone = '', email = '' }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Vyplň jméno.'
  if (!phone.trim() && !email.trim()) errors.reach = 'Vyplň telefon nebo e-mail.'
  else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.reach = 'E-mail nevypadá správně.'
  return errors
}

/**
 * Directory entries of active children, leaders and the shared contacts of
 * „ostatní“, sorted by nickname (name).
 * contacts: { memberId: private/contacts }, details: { personId: private/details }.
 * child: { kind, id, troop, nickname, firstName, lastName, birthDate, parents, own }
 * leader: { kind, id, troop, nickname, name, phone, email, birthDate }
 * other: { kind, id, name, description, phone, email, createdByName }
 * Both have `display` (nickname, else first name) and `search` (folded text).
 */
export function directoryEntries({ members, leaders, others = [], contacts = {}, details = {} }) {
  const children = members
    .filter((m) => m.active !== false)
    .map((m) => {
      const c = contacts[m.id] ?? {}
      const parents = c.parents ?? []
      return {
        kind: 'child',
        id: m.id,
        troop: m.troop,
        nickname: m.nickname ?? '',
        firstName: m.firstName ?? '',
        lastName: m.lastName ?? '',
        birthDate: m.birthDate ?? null,
        parents,
        own: { phones: c.own?.phones ?? [], emails: c.own?.emails ?? [] },
        display: m.nickname?.trim() || m.firstName || '',
        search: foldText(
          [m.nickname, m.firstName, m.lastName, ...parents.map((p) => p.name)].join(' '),
        ),
      }
    })
  const people = leaders
    .filter((p) => p.active !== false)
    .map((p) => ({
      kind: 'leader',
      id: p.id,
      troop: p.troop ?? null,
      nickname: p.nickname ?? '',
      name: p.name ?? '',
      phone: p.phone || null,
      email: p.email || null,
      birthDate: details[p.id]?.birthDate ?? null,
      display: p.nickname?.trim() || p.name?.split(' ')[0] || '',
      search: foldText(`${p.nickname ?? ''} ${p.name ?? ''}`),
    }))
  const shared = others.map((o) => ({
    kind: 'other',
    id: o.id,
    name: o.name ?? '',
    description: o.description ?? '',
    phone: o.phone || null,
    email: o.email || null,
    createdByName: o.createdByName ?? '',
    display: o.name ?? '',
    search: foldText(`${o.name ?? ''} ${o.description ?? ''}`),
  }))
  return [...children, ...people, ...shared].sort((a, b) =>
    a.display.localeCompare(b.display, 'cs', { sensitivity: 'base' }),
  )
}

// „6. 10. 2026“
const czechDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}

/**
 * The vCard of an entry with the given groups, or null when it has nothing in
 * them. `savedOn` (YYYY-MM-DD) makes the downloaded copy: without ⚜️ (that marks
 * the synced CardDAV contacts) and with a note saying when.
 */
export function entryCard(entry, groups = ALL_GROUPS, { savedOn = null, rev = null } = {}) {
  const mark = savedOn ? '' : `${CARD_MARK} `
  const savedNote = savedOn ? `staženo z webu Záře ${czechDate(savedOn)}` : null
  const note = (text) => [text, savedNote].filter(Boolean).join('\n') || null

  if (entry.kind === 'other') {
    if (!groups.includes('others') || (!entry.phone && !entry.email)) return null
    return buildVCard({
      uid: `zare-other-${entry.id}`,
      given: `${mark}${entry.display}`,
      org: 'Záře · ostatní',
      phones: entry.phone ? [{ value: entry.phone }] : [],
      emails: entry.email ? [{ value: entry.email }] : [],
      note: note(entry.description),
      categories: ['ostatní'],
      rev,
    })
  }

  if (entry.kind === 'leader') {
    if (!groups.includes('leaders') || (!entry.phone && !entry.email)) return null
    return buildVCard({
      uid: `zare-leader-${entry.id}`,
      given: `${mark}${entry.display}`,
      org: 'Záře · vedoucí',
      phones: entry.phone ? [{ value: entry.phone }] : [],
      emails: entry.email ? [{ value: entry.email }] : [],
      birthday: entry.birthDate,
      note: note(entry.name),
      categories: ['vedoucí'],
      rev,
    })
  }

  const parents = groups.includes(`${entry.troop}Parents`) ? entry.parents : []
  const own = groups.includes(`${entry.troop}Children`) ? entry.own : { phones: [], emails: [] }
  const phones = [
    ...parents.filter((p) => p.phone).map((p) => ({ value: p.phone, label: p.label })),
    ...own.phones.map((value) => ({ value, label: 'dítě' })),
  ]
  const emails = [
    ...parents.filter((p) => p.email).map((p) => ({ value: p.email, label: p.label })),
    ...own.emails.map((value) => ({ value, label: 'dítě' })),
  ]
  if (!phones.length && !emails.length) return null
  const troopName = TROOP_CARD_NAME[entry.troop] ?? ''
  return buildVCard({
    uid: `zare-child-${entry.id}`,
    given: `${mark}${entry.display}`,
    family: `(${[entry.lastName, entry.firstName].filter(Boolean).join(' ')})`,
    org: `Záře · ${troopName}`,
    phones,
    emails,
    birthday: entry.birthDate,
    note: note(
      parents
        .filter((p) => p.name)
        .map((p) => `${p.label ?? 'rodič'}: ${p.name}`)
        .join(', '),
    ),
    categories: [troopName],
    rev,
  })
}
