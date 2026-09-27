// Leader contacts — SPEC §4.8 Contacts and §5. Shared by the web
// (Administration, the parents' „Vedoucí“). Dependency-free.

export const CONTACT_GROUPS = ['vlc', 'ss', 'other']

// Contact photos are cropped to 3:4 and stored as JPEG of this size.
export const CONTACT_PHOTO = { width: 480, height: 640 }
export const MAX_CONTACT_PHOTO_BYTES = 2 * 1024 * 1024

export const contactPhotoPath = (contactId, fileId) => `contacts/${contactId}/${fileId}.jpg`

// What parents see of a contact: its own fields for a manual contact, the
// leader's details from skautIS otherwise (null when the leader has left).
// The role title from skautIS can be overridden per contact.
export function contactCard(contact, person) {
  const base = { id: contact.id, group: contact.group, photoUrl: contact.photoUrl ?? null }
  if (!contact.personId) {
    return {
      ...base,
      nickname: contact.nickname ?? '',
      name: contact.name ?? '',
      roleTitle: contact.roleTitle ?? '',
      phone: contact.phone || null,
      email: contact.email || null,
    }
  }
  if (!person?.active) return null
  return {
    ...base,
    nickname: person.nickname ?? '',
    name: person.name ?? '',
    roleTitle: contact.roleTitle || person.roleTitle || '',
    phone: person.phone || null,
    email: person.email || null,
  }
}

// Problems of a manual contact: { name?, reach? } — a name (or nickname) and
// at least a phone or an e-mail.
export function manualContactErrors({ nickname = '', name = '', phone = '', email = '' }) {
  const errors = {}
  if (!nickname.trim() && !name.trim()) errors.name = 'Vyplň přezdívku nebo jméno.'
  if (!phone.trim() && !email.trim()) errors.reach = 'Vyplň telefon nebo e-mail.'
  else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.reach = 'E-mail nevypadá správně.'
  return errors
}
