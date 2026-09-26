// Poster lines composed from the poster content — SPEC §3.2.

const join = (parts) => parts.filter(Boolean).join(', ')

// „8:00 u Památníku, 8:30 na Hlavním nádraží“ (+ the „jinde“ text)
export function meetingText(p) {
  return join([
    p.meetAtPamatnik && `${p.meetAtPamatnik} u Památníku`,
    p.meetAtMainStation && `${p.meetAtMainStation} na Hlavním nádraží`,
    p.meetElsewhere,
  ])
}

// „16:40 na Hlavní nádraží, 17:00 k Památníku“ (+ the „jinde“ text)
export function returnText(p) {
  return join([
    p.returnAtMainStation && `${p.returnAtMainStation} na Hlavní nádraží`,
    p.returnAtPamatnik && `${p.returnAtPamatnik} k Památníku`,
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
