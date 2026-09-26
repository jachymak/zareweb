// Poster lines composed from the poster content — SPEC §3.2.

const join = (parts) => parts.filter(Boolean).join(', ')

// Times are stored as `HH:mm`; shown as „8:00“.
const time = (hhmm) => hhmm.replace(/^0(\d)/, '$1')

// „8:00 u Památníku, 8:30 na Hlavním nádraží“ (+ the „jinde“ text)
export function meetingText(p) {
  return join([
    p.meetAtPamatnik && `${time(p.meetAtPamatnik)} u Památníku`,
    p.meetAtMainStation && `${time(p.meetAtMainStation)} na Hlavním nádraží`,
    p.meetElsewhere,
  ])
}

// „16:40 na Hlavní nádraží, 17:00 k Památníku“ (+ the „jinde“ text)
export function returnText(p) {
  return join([
    p.returnAtMainStation && `${time(p.returnAtMainStation)} na Hlavní nádraží`,
    p.returnAtPamatnik && `${time(p.returnAtPamatnik)} k Památníku`,
    p.returnElsewhere,
  ])
}

// „Spacák, karimatka, lahev s pitím“
export function packingSentence(items = []) {
  const text = items.join(', ')
  return text && text[0].toUpperCase() + text.slice(1)
}

// „800 Kč“, or '' when the price isn't set.
export function priceText(price) {
  return typeof price === 'number' ? `${price.toLocaleString('cs-CZ')} Kč` : ''
}

export const isHttpUrl = (url) => /^https?:\/\//i.test(url ?? '')
