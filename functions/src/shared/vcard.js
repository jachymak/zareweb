// vCard 3.0 for the leaders' address book — the CardDAV feed and the
// „uložit do telefonu“ download build the same cards. Dependency-free.

import { normalizePhone } from './waitlistRules.js'

// Marks the troop's contacts in the phone; a downloaded copy is prefixed with SAVED_MARK.
export const CARD_MARK = '⚜️'
export const SAVED_MARK = '[uloženo]'

const escape = (value) =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')

// Lines longer than 75 bytes are folded (RFC 6350 §3.2), never inside a UTF-8 character.
function fold(line) {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const parts = []
  let part = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(part)
      part = ''
      bytes = 0
    }
    part += char
    bytes += size
  }
  parts.push(part)
  return parts.join('\r\n ')
}

/**
 * One contact as a vCard 3.0 string.
 * `phones` / `emails`: [{ value, label }] — the label is shown in the phone
 * („otec“, „matka“, „dítě“) through Apple's `X-ABLabel`, which DAVx⁵ reads too.
 * `org`: the troop and group, „Záře · vlčušky“.
 * `birthday`: 'YYYY-MM-DD' or null.
 */
export function buildVCard({
  uid,
  given,
  family = '',
  org,
  phones = [],
  emails = [],
  birthday,
  note,
  categories = [],
  rev,
}) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `UID:${escape(uid)}`]
  lines.push(`N:${escape(family)};${escape(given)};;;`)
  lines.push(`FN:${escape([given, family].filter(Boolean).join(' '))}`)
  // The iPhone shows the company above the name — without it, „Unknown“ for CardDAV contacts.
  if (org) lines.push(`ORG:${escape(org)}`)
  let item = 0
  for (const { value, label } of phones) {
    const phone = normalizePhone(value) ?? value
    item++
    lines.push(`item${item}.TEL;TYPE=CELL:${escape(phone)}`)
    if (label) lines.push(`item${item}.X-ABLabel:${escape(label)}`)
  }
  for (const { value, label } of emails) {
    item++
    lines.push(`item${item}.EMAIL;TYPE=INTERNET:${escape(value)}`)
    if (label) lines.push(`item${item}.X-ABLabel:${escape(label)}`)
  }
  if (birthday) lines.push(`BDAY:${birthday}`)
  if (categories.length) lines.push(`CATEGORIES:${categories.map(escape).join(',')}`)
  if (note) lines.push(`NOTE:${escape(note)}`)
  if (rev) lines.push(`REV:${rev}`)
  lines.push('END:VCARD')
  return lines.map(fold).join('\r\n') + '\r\n'
}
