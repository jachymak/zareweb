// Contacts from a skautIS person export — SPEC §4.8 skautIS „Kontakty z exportu“.
// The admin uploads the export in Administration; the web reads it in the
// browser (rows of strings) and this module turns it into what is stored:
// parents' and children's own contacts, leaders' birthdays. Dependency-free.

import { normalizePhone } from './waitlistRules.js'

// Column headers of the export template (the header row starts with „Jméno“).
const COLUMNS = {
  firstName: 'Jméno',
  lastName: 'Příjmení',
  nickname: 'Přezdívka',
  birthDate: 'Datum narození',
  category: 'Kategorie',
  emailMain: 'E-mail (hlavní)',
  emailOther: 'E-mail (další)',
  phoneMain: 'Mobil / telefon (hlavní)',
  mobileOther: 'Mobil (další)',
  phoneOther: 'Telefon (další)',
}
const PARENTS = [
  { prefix: 'Otec', label: 'otec' },
  { prefix: 'Matka', label: 'matka' },
  { prefix: 'Ostatní', label: null }, // the label is its „typ“
]
const PARENT_FIELDS = {
  first: 'jméno',
  last: 'příjmení',
  email: 'mail',
  phone: 'telefon',
  note: 'poznámka',
  type: 'typ',
}
export const REQUIRED_COLUMNS = Object.values(COLUMNS).slice(0, 5)

export const EXPORT_CHILD_CATEGORIES = ['Vlče', 'Světluška', 'Skaut', 'Skautka']
export const EXPORT_LEADER_CATEGORIES = ['Rover', 'Ranger']

// Lower case without diacritics and extra spaces — for matching names.
export const foldText = (s = '') =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

const clean = (v) => String(v ?? '').trim()
// „(jméno otce)“ and the like stand for a missing value.
const value = (v) => (/^\(.*\)$/.test(clean(v)) ? '' : clean(v))
const values = (v) =>
  value(v)
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)

// „13.08.2018“ (or an Excel date number, after re-saving in Excel) →
// „2018-08-13“; anything else → null.
function isoDate(text) {
  const t = clean(text)
  if (/^\d{4,5}(\.0+)?$/.test(t)) {
    return new Date(Date.UTC(1899, 11, 30) + Number(t) * 86400000).toISOString().slice(0, 10)
  }
  const m = t.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

const phoneKey = (p) => normalizePhone(p) ?? p.replace(/\s+/g, '')
const emailKey = (e) => e.toLowerCase()
const EMAIL = /[^\s@,;:()<>"']+@[^\s@,;:()<>"']+\.[^\s@,;:()<>"'.]{2,}/g

// E-mails written in a parent's note in skautIS: kept as contacts, but the
// conference and the web's e-mails don't use them (SPEC §4.8 skautIS).
const noteEmailsOf = (note) => uniqueBy(String(note ?? '').match(EMAIL) ?? [], emailKey)

// All e-mails of a parent: the main one, then the ones from the note.
export const parentEmails = (p) => [p.email, ...(p.noteEmails ?? [])].filter(Boolean)

function uniqueBy(list, key) {
  const seen = new Set()
  return list.filter((x) => !seen.has(key(x)) && seen.add(key(x)))
}

/**
 * Rows of the export (arrays of cell strings, as in the sheet) → people.
 * Returns { people, missingColumns } — missingColumns lists required headers
 * that are not there (then people is empty).
 * person: { firstName, lastName, nickname, birthDate, category, kind: 'child'
 * | 'leader' | null, phone, email (the main ones), parents: [{ name, email,
 * phone, label, noteEmails }], own: { phones, emails, mailedEmails } }
 */
export function parseExport(rows) {
  const headerAt = rows.findIndex((r) => clean(r[0]) === COLUMNS.firstName)
  if (headerAt < 0) return { people: [], missingColumns: REQUIRED_COLUMNS }
  const header = rows[headerAt].map(clean)
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !header.includes(c))
  if (missingColumns.length) return { people: [], missingColumns }
  const col = (name) => header.indexOf(name)

  const people = rows
    .slice(headerAt + 1)
    .filter((r) => r.some((c) => clean(c)))
    .map((r) => {
      const get = (name) => (col(name) >= 0 ? r[col(name)] : '')
      const parents = PARENTS.map(({ prefix, label }) => {
        const field = (f) => get(`${prefix}: ${PARENT_FIELDS[f]}`)
        const name = [value(field('first')), value(field('last'))].filter(Boolean).join(' ')
        const email = values(field('email'))[0] ?? null
        const phone = values(field('phone'))[0] ?? null
        const noteEmails = noteEmailsOf(field('note')).filter(
          (e) => !email || emailKey(e) !== emailKey(email),
        )
        if (!email && !phone && !noteEmails.length) return null
        return {
          name,
          email,
          phone,
          label: label ?? (value(field('type')) || 'jiný kontakt'),
          noteEmails,
        }
      }).filter(Boolean)

      const phones = uniqueBy(
        [COLUMNS.phoneMain, COLUMNS.mobileOther, COLUMNS.phoneOther].flatMap((c) => values(get(c))),
        phoneKey,
      )
      const emails = uniqueBy(
        [COLUMNS.emailMain, COLUMNS.emailOther].flatMap((c) => values(get(c))),
        emailKey,
      )
      const category = clean(get(COLUMNS.category))
      return {
        firstName: clean(get(COLUMNS.firstName)),
        lastName: clean(get(COLUMNS.lastName)),
        nickname: clean(get(COLUMNS.nickname)),
        birthDate: isoDate(get(COLUMNS.birthDate)),
        category,
        kind: EXPORT_CHILD_CATEGORIES.includes(category)
          ? 'child'
          : EXPORT_LEADER_CATEGORIES.includes(category)
            ? 'leader'
            : null,
        phone: values(get(COLUMNS.phoneMain))[0] ?? null,
        email: values(get(COLUMNS.emailMain))[0] ?? null,
        parents,
        phones,
        emails,
      }
    })
  return { people: mergeRows(people).map(withOwnContacts), missingColumns: [] }
}

// skautIS gives a person with several „Ostatní“ one row per contact (the
// rest of the rows repeats) — one person per name and birth date.
function mergeRows(rows) {
  const byKey = new Map()
  for (const row of rows) {
    const key = foldText(`${row.firstName} ${row.lastName} ${row.birthDate ?? ''}`)
    const seen = byKey.get(key)
    if (!seen) {
      byKey.set(key, row)
      continue
    }
    seen.parents = uniqueBy([...seen.parents, ...row.parents], (p) => JSON.stringify(p))
    seen.phones = uniqueBy([...seen.phones, ...row.phones], phoneKey)
    seen.emails = uniqueBy([...seen.emails, ...row.emails], emailKey)
  }
  return [...byKey.values()]
}

// „Ostatní“ of type „dítě“ is no parent: the parents want the troop's e-mails
// to go to the child too (SPEC §4.8 skautIS) — its e-mail is the child's own
// one that gets them (`mailedEmails`), its phone the child's own.
const isChildEntry = (p) => foldText(p.label) === 'dite'

// The child's own contacts: all of its phones and e-mails without its parents'.
function withOwnContacts({ phones, emails, ...person }) {
  const entries = person.parents.filter(isChildEntry)
  const parents = person.parents.filter((p) => !isChildEntry(p))
  const ofParents = new Set(parents.flatMap(parentEmails).map(emailKey))
  const parentPhones = new Set(parents.filter((p) => p.phone).map((p) => phoneKey(p.phone)))
  const mailedEmails = uniqueBy(
    entries.flatMap((p) => [p.email].filter(Boolean)),
    emailKey,
  )
  return {
    ...person,
    parents,
    own: {
      phones: uniqueBy(
        [...phones, ...entries.map((p) => p.phone).filter(Boolean)],
        phoneKey,
      ).filter((p) => !parentPhones.has(phoneKey(p))),
      emails: uniqueBy([...emails, ...mailedEmails], emailKey).filter(
        (e) => !ofParents.has(emailKey(e)) || mailedEmails.some((m) => emailKey(m) === emailKey(e)),
      ),
      mailedEmails,
    },
  }
}

// What is compared and stored of a child's contacts.
const contactsOf = (c) => ({
  parents: (c?.parents ?? []).map(({ name, email, phone, label, noteEmails }) => ({
    name: name ?? '',
    email: email ?? null,
    phone: phone ?? null,
    label: label ?? null,
    noteEmails: noteEmails ?? [],
  })),
  own: {
    phones: c?.own?.phones ?? [],
    emails: c?.own?.emails ?? [],
    mailedEmails: c?.own?.mailedEmails ?? [],
  },
})
const sameContacts = (a, b) => JSON.stringify(contactsOf(a)) === JSON.stringify(contactsOf(b))
const samePhone = (a, b) => !a || !b || phoneKey(a) === phoneKey(b)
const sameEmail = (a, b) => !a || !b || emailKey(a) === emailKey(b)

// Index of active records by a key; a key shared by two records is ambiguous (null).
function indexBy(list, key) {
  const map = new Map()
  for (const item of list) {
    const k = key(item)
    map.set(k, map.has(k) ? null : item)
  }
  return map
}

/**
 * What the import would change. Inputs: people from parseExport; members and
 * leaders (`skautisPeople`) with ids; contacts: { memberId: private/contacts };
 * details: { personId: private/details }.
 * Returns { children: { changed: [{ id, member, before, after }], unchanged },
 * birthdays: { changed: [{ id, person, before, after }], unchanged },
 * notOnWeb: [person], notInExport: { children: [member], leaders: [person] },
 * differences: [{ name, field, web, export }] }.
 */
export function planContactsImport({ people, members, leaders, contacts = {}, details = {} }) {
  const activeMembers = members.filter((m) => m.active !== false)
  const activeLeaders = leaders.filter((p) => p.active !== false)
  const memberIndex = indexBy(activeMembers, (m) =>
    foldText(`${m.firstName} ${m.lastName} ${m.birthDate ?? ''}`),
  )
  // A child whose birth date differs is still found by the name alone (and the difference shown).
  const memberByName = indexBy(activeMembers, (m) => foldText(`${m.firstName} ${m.lastName}`))
  const leaderIndex = indexBy(activeLeaders, (p) => foldText(p.name))

  const plan = {
    children: { changed: [], unchanged: 0 },
    birthdays: { changed: [], unchanged: 0 },
    notOnWeb: [],
    notInExport: { children: [], leaders: [] },
    differences: [],
  }
  const seenMembers = new Set()
  const seenLeaders = new Set()
  const differ = (name, field, web, exported) =>
    plan.differences.push({ name, field, web: web || '—', export: exported || '—' })

  for (const person of people) {
    const name = `${person.firstName} ${person.lastName}`.trim()
    if (person.kind === 'child') {
      const member =
        memberIndex.get(foldText(`${name} ${person.birthDate ?? ''}`)) ??
        memberByName.get(foldText(name))
      if (!member || seenMembers.has(member.id)) {
        plan.notOnWeb.push(person)
        continue
      }
      seenMembers.add(member.id)
      if ((member.birthDate ?? null) !== person.birthDate)
        differ(name, 'datum narození', member.birthDate, person.birthDate)
      if ((member.nickname ?? '') !== person.nickname)
        differ(name, 'přezdívka', member.nickname, person.nickname)
      const before = contacts[member.id] ?? null
      const after = contactsOf(person)
      if (before && sameContacts(before, after)) plan.children.unchanged++
      else plan.children.changed.push({ id: member.id, member, before, after })
    } else if (person.kind === 'leader') {
      const leader = leaderIndex.get(foldText(name))
      if (!leader || seenLeaders.has(leader.id)) {
        plan.notOnWeb.push(person)
        continue
      }
      seenLeaders.add(leader.id)
      if ((leader.nickname ?? '') !== person.nickname)
        differ(name, 'přezdívka', leader.nickname, person.nickname)
      if (!samePhone(leader.phone, person.phone))
        differ(name, 'telefon', leader.phone, person.phone)
      if (!sameEmail(leader.email, person.email)) differ(name, 'e-mail', leader.email, person.email)
      const before = details[leader.id]?.birthDate ?? null
      if (before === person.birthDate) plan.birthdays.unchanged++
      else
        plan.birthdays.changed.push({
          id: leader.id,
          person: leader,
          before,
          after: person.birthDate,
        })
    }
  }
  plan.notInExport.children = activeMembers.filter((m) => !seenMembers.has(m.id))
  plan.notInExport.leaders = activeLeaders.filter((p) => !seenLeaders.has(p.id))
  return plan
}
