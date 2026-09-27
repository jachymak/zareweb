// Texts of the skautIS sync (SPEC §4.8 skautIS).
import { formatDate as formatIsoDate, plural } from '@/components/waitlist/waitlistText'
import { troopTag } from './accounts'

export const FIELD_LABELS = {
  active: 'v oddíle',
  firstName: 'jméno',
  lastName: 'příjmení',
  name: 'jméno',
  nickname: 'přezdívka',
  troop: 'oddíl',
  birthDate: 'datum narození',
  parents: 'kontakty rodičů',
  phone: 'telefon',
  email: 'e-mail',
}

const parentText = (p) => [p.name, p.email, p.phone].filter(Boolean).join(', ')

// One changed field → „přezdívka: Vydra → Vydrák“.
export function changeText({ field, from, to }) {
  if (field === 'active') return 'znovu v oddíle'
  const value = (v) => {
    if (v === null || v === '' || (Array.isArray(v) && !v.length)) return '–'
    if (field === 'troop') return troopTag(v)
    if (field === 'birthDate') return formatIsoDate(v)
    if (field === 'parents') return v.map(parentText).join('; ')
    return v
  }
  return `${FIELD_LABELS[field] ?? field}: ${value(from)} → ${value(to)}`
}

const counts = (c) => {
  const parts = [
    c.added && `${c.added} ${plural(c.added, 'nový', 'noví', 'nových')}`,
    c.changed && `${c.changed} ${plural(c.changed, 'změněný', 'změnění', 'změněných')}`,
    c.removed && `${c.removed} ${plural(c.removed, 'odešlý', 'odešlí', 'odešlých')}`,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'beze změny'
}

// After applying: „Děti: 1 nový, 3 změnění. Vedoucí: beze změny.“
export const appliedText = (result) =>
  `Hotovo. Děti: ${counts(result.members)}. Vedoucí: ${counts(result.people)}.`

// Timestamp → „27. 9. 2026 v 16:05“
export function formatDateTime(ts) {
  const date = ts?.toDate?.()
  if (!date) return ''
  const time = date.toLocaleTimeString('cs-CZ', { hour: 'numeric', minute: '2-digit' })
  return `${date.toLocaleDateString('cs-CZ')} v ${time}`
}

// „Benjamínek 12, Člen kmene dospělých 5“
export const skippedText = (skipped) =>
  Object.entries(skipped ?? {})
    .map(([category, n]) => `${category} ${n}`)
    .join(', ')

// A failed call → a sentence for the admin (details.reason from the functions).
export function syncErrorText(e) {
  const { reason, regNumber, message } = e?.details ?? {}
  switch (reason) {
    case 'no-role':
      return `Ve skautISu nemáš roli, která vidí na oddíl ${regNumber}. Požádej o roli vedoucí/admin toho oddílu (nebo střediska) a zkus to znovu.`
    case 'unit-not-found':
      return `Oddíl ${regNumber} se ve skautISu nenašel.`
    case 'login-expired':
      return 'Přihlášení do skautISu vypršelo. Přihlas se znovu.'
    case 'skautis':
      return `skautIS odpověděl chybou: ${message}`
    case 'no-pending':
    case 'expired':
      return 'Načtená data jsou stará nebo už byla použita. Spusť synchronizaci znovu.'
    default:
      return 'Synchronizace se nepovedla. Zkus to znovu.'
  }
}
