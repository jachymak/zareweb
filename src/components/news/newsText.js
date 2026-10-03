// Czech texts of the leaders' news page (SPEC §4.4).

export const NEWS_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'všem rodičům' },
  { value: 'vlc', label: 'jen vlčuškám' },
  { value: 'ss', label: 'jen skautům a skautkám' },
]

export const PUBLISHED = 'zveřejněno ✓ rodiče to uvidí na svojí stránce'
export const SAVED = 'uloženo ✓ rodiče uvidí upravenou verzi'

// The body with the separate link of older news (linkLabel / linkUrl, before links
// went into the text) appended as <a>.
export function newsBody({ body, linkLabel, linkUrl }) {
  if (!/^https?:\/\//i.test(linkUrl ?? '')) return body
  return `${body}\n\n<a href="${linkUrl.replace(/"/g, '%22')}">${linkLabel || linkUrl}</a>`
}
