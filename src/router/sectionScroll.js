// Scrolling to a section of a page (`#id`): its kicker — the small handwritten
// line above the title, where the section visibly starts (else its first
// child) — lands the same distance under the sticky header for every section,
// whatever its padding.

const GAP = 40

// Page offset to scroll to for `hash`, or null when there is no such element.
export function sectionScrollTop(hash) {
  if (!/^#[\w-]+$/.test(hash)) return null
  const section = document.querySelector(hash)
  if (!section) return null
  const target = section.querySelector('.kicker') ?? section.firstElementChild ?? section
  const header = document.querySelector('header')
  const headerHeight =
    header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - GAP
  return Math.max(0, Math.round(top))
}

// For in-page menu links: scrolls there and shows the hash in the URL without
// a router navigation (which would scroll a second time).
export function scrollToSection(event, hash) {
  const top = sectionScrollTop(hash)
  if (top === null) return
  event.preventDefault()
  window.scrollTo({ top, behavior: 'smooth' })
  history.replaceState(history.state, '', hash)
}
