// Accounts & pairing (SPEC §4.8): labels, filters and pairing suggestions.
import { troopByCode } from '@/constants/troops'

export const ROLE_LABELS = {
  pending: 'čeká na schválení',
  parent: 'rodič',
  leader: 'vedoucí',
  admin: 'správce',
  none: 'bez přístupu',
}

// Filter tabs; each role belongs to exactly one.
export const FILTERS = [
  { id: 'pending', label: 'Čekající', roles: ['pending'] },
  { id: 'parents', label: 'Rodiče', roles: ['parent'] },
  { id: 'leaders', label: 'Vedoucí', roles: ['leader', 'admin'] },
  { id: 'none', label: 'Bez přístupu', roles: ['none'] },
]

// Lowercase, no diacritics, only letters/digits separated by single spaces.
export function normalizeText(s = '') {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .trim()
}

export const childName = (m) => `${m.firstName} ${m.lastName}`
export const troopTag = (code) => troopByCode(code)?.tag ?? code

// Children that probably belong to the account, not paired with it yet:
// a parent e-mail in skautIS equals the account e-mail, or the note names
// the child (first + last name, or nickname).
// Returns [{ member, reasons: string[] }], active children only.
export function suggestChildren(account, members, parentContacts) {
  const email = account.email?.trim().toLowerCase()
  const note = ` ${normalizeText(account.note ?? '')} `
  const hasWord = (w) => w && note.includes(` ${w} `)

  const suggestions = []
  for (const m of members) {
    if (!m.active || m.parentUids?.includes(account.id)) continue
    const reasons = []
    const parents = parentContacts[m.id] ?? []
    if (email && parents.some((p) => p.email?.trim().toLowerCase() === email)) {
      reasons.push('e-mail rodiče ve skautISu')
    }
    const named =
      (hasWord(normalizeText(m.firstName)) && hasWord(normalizeText(m.lastName))) ||
      hasWord(normalizeText(m.nickname))
    if (named) reasons.push('jméno v poznámce')
    if (reasons.length) suggestions.push({ member: m, reasons })
  }
  return suggestions
}

// Members matching a search text (name or nickname), active only.
export function searchMembers(members, text) {
  const q = normalizeText(text)
  return members
    .filter((m) => m.active)
    .filter((m) => !q || normalizeText(`${childName(m)} ${m.nickname}`).includes(q))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'cs'))
}

export function formatDate(ts) {
  const date = ts?.toDate?.()
  return date ? date.toLocaleDateString('cs-CZ') : ''
}
