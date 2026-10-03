// Leaders' longer texts (news, poster intro, e-mail texts) — SPEC §4.4: plain text
// in which <b>…</b>, <i>…</i> and <a href="…">…</a> work as in HTML. Everything else
// stays text, so nothing written there can inject markup. Parsed into nodes:
// strings, { tag: 'b' | 'i', children } and { tag: 'a', href, children }.

const TAG = /<\/(b|i|a)\s*>|<(b|i)\s*>|<a\s+href\s*=\s*(?:"([^"]*)"|'([^']*)')\s*>/gi

// A bare address outside a link becomes one; trailing punctuation stays text.
const URL = /https?:\/\/[^\s<>"]*[^\s<>".,;:!?)\]»“”']/gi

// http(s) and mailto links; „example.cz/x“ gets https://.
export function safeHref(href) {
  const url = href.trim()
  if (/^(https?:\/\/|mailto:)\S+$/i.test(url)) return url
  if (/^[\p{L}\d-]+(\.[\p{L}\d-]+)+(\/\S*)?$/u.test(url)) return `https://${url}`
  return null
}

// Text → nodes. `mapText` is applied to the text between tags (e.g. filling e-mail
// placeholders) before bare addresses are linked, so filled values stay plain text.
// Unclosed tags run to the end; a stray closing tag, an <a> inside a link and a link
// with an unsupported address stay as text.
export function parseRichText(text, mapText = (t) => t) {
  const root = { children: [] }
  const stack = [root]
  const inLink = () => stack.some((n) => n.tag === 'a')
  const pushText = (raw) => {
    const t = mapText(raw)
    if (!t) return
    const into = stack.at(-1).children
    if (inLink()) return void into.push(t)
    let last = 0
    for (const m of t.matchAll(URL)) {
      if (m.index > last) into.push(t.slice(last, m.index))
      into.push({ tag: 'a', href: m[0], children: [m[0]] })
      last = m.index + m[0].length
    }
    if (last < t.length) into.push(t.slice(last))
  }

  let last = 0
  for (const m of text.matchAll(TAG)) {
    const [whole, close, open, href1, href2] = m
    pushText(text.slice(last, m.index))
    last = m.index + whole.length
    if (close) {
      const at = stack.findLastIndex((n) => n.tag === close.toLowerCase())
      if (at > 0) stack.length = at
      else pushText(whole)
      continue
    }
    const tag = open ? open.toLowerCase() : 'a'
    const href = tag === 'a' ? safeHref(href1 ?? href2) : null
    if (tag === 'a' && (!href || inLink())) {
      pushText(whole)
      continue
    }
    const node = { tag, ...(href && { href }), children: [] }
    stack.at(-1).children.push(node)
    stack.push(node)
  }
  pushText(text.slice(last))
  return root.children
}

// Nodes → plain text; a link shows its address after the text unless the text is it.
export function richTextToPlain(nodes) {
  return nodes
    .map((n) => {
      if (typeof n === 'string') return n
      const inner = richTextToPlain(n.children)
      if (n.tag !== 'a') return inner
      const address = n.href.replace(/^mailto:/i, '')
      return inner.trim() === address || !inner.trim() ? address : `${inner} (${address})`
    })
    .join('')
}

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Nodes → HTML; line breaks become <br>.
export function richTextToHtml(nodes) {
  return nodes
    .map((n) => {
      if (typeof n === 'string') return escape(n).replace(/\n/g, '<br>')
      const inner = richTextToHtml(n.children)
      return n.tag === 'a'
        ? `<a href="${escape(n.href)}">${inner}</a>`
        : `<${n.tag}>${inner}</${n.tag}>`
    })
    .join('')
}
