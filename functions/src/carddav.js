import { createHash, timingSafeEqual } from 'node:crypto'
import { onRequest } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import { db } from './admin.js'
import { BASE_OPTIONS, REGION } from './options.js'
import { directoryEntries, entryCard } from './shared/directory.js'

// Read-only CardDAV address book for the leaders' phones (iPhone natively,
// Android with DAVx⁵) — SPEC §4.10. Signed in with the account e-mail and the
// phone password (createPhonePassword); serves the cards of the groups the
// leader chose on the web.
//
// URLs (below the function's base path):
//   /                      → points to the principal
//   /principal/            → the user, points to the address book home
//   /addressbooks/         → the home with one address book
//   /addressbooks/zare/    → the address book, its cards /addressbooks/zare/{id}.vcf

const DAV = 'DAV:'
const CARD = 'urn:ietf:params:xml:ns:carddav'
const CS = 'http://calendarserver.org/ns/'
const PREFIXES = { [DAV]: 'd', [CARD]: 'card', [CS]: 'cs' }

export const hashPassword = (password) => createHash('sha256').update(password).digest('hex')
const sha1 = (text) => createHash('sha1').update(text).digest('hex')

// --- data ------------------------------------------------------------------------

// Phones sync often and ask several times per sync, so the directory is kept
// in the instance for a while (SPEC §4.10).
// Not in the emulator, where scripts and tests change the data.
const DIRECTORY_TTL = process.env.FUNCTIONS_EMULATOR === 'true' ? 0 : 5 * 60 * 1000
let directory = null

async function loadDirectory() {
  if (directory && Date.now() - directory.at < DIRECTORY_TTL) return directory.entries
  const [members, leaders] = await Promise.all([
    db.collection('members').where('active', '==', true).get(),
    db.collection('skautisPeople').where('active', '==', true).get(),
  ])
  const privateOf = async (docs, id) =>
    docs.length ? db.getAll(...docs.map((d) => d.ref.collection('private').doc(id))) : []
  const [contactDocs, detailDocs] = await Promise.all([
    privateOf(members.docs, 'contacts'),
    privateOf(leaders.docs, 'details'),
  ])
  const byParent = (snaps) =>
    Object.fromEntries(snaps.filter((s) => s.exists).map((s) => [s.ref.parent.parent.id, s.data()]))
  const entries = directoryEntries({
    members: members.docs.map((d) => ({ id: d.id, ...d.data() })),
    leaders: leaders.docs.map((d) => ({ id: d.id, ...d.data() })),
    contacts: byParent(contactDocs),
    details: byParent(detailDocs),
  })
  directory = { at: Date.now(), entries }
  return entries
}

async function cardsFor(uid) {
  const [entries, settings] = await Promise.all([
    loadDirectory(),
    db.doc(`phoneContacts/${uid}`).get(),
  ])
  const groups = settings.get('groups') ?? []
  return entries
    .map((entry) => ({ id: `${entry.kind}-${entry.id}`, vcard: entryCard(entry, groups) }))
    .filter((c) => c.vcard)
    .map((c) => ({ ...c, etag: `"${sha1(c.vcard)}"` }))
}

// --- sign-in ---------------------------------------------------------------------

// Successful sign-ins for a minute, by the Authorization header (its hash).
const SIGN_IN_TTL = 60 * 1000
const signIns = new Map()

// The uid of a leader / admin with this e-mail and phone password, or null.
async function signIn(header) {
  if (!header?.startsWith('Basic ')) return null
  const key = sha1(header)
  const cached = signIns.get(key)
  if (cached && Date.now() - cached.at < SIGN_IN_TTL) return cached.uid

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  const colon = decoded.indexOf(':')
  if (colon < 0) return null
  const email = decoded.slice(0, colon).trim().toLowerCase()
  const password = decoded.slice(colon + 1).trim()
  if (!email || !password) return null

  const found = await db.collection('phonePasswords').where('email', '==', email).limit(1).get()
  const stored = found.docs[0]
  if (!stored) return null
  const expected = Buffer.from(stored.get('hash'), 'hex')
  const given = Buffer.from(hashPassword(password), 'hex')
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  const user = await db.doc(`users/${stored.id}`).get()
  if (!['leader', 'admin'].includes(user.get('role'))) return null

  signIns.set(key, { uid: stored.id, at: Date.now() })
  return stored.id
}

// --- minimal XML ---------------------------------------------------------------

// Parses the small request bodies of CardDAV clients into { ns, name, children, text }.
function parseXml(text) {
  const root = { children: [] }
  const stack = [{ node: root, ns: {} }]
  const re =
    /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([\w.-]+(?::[\w.-]+)?)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  let m
  while ((m = re.exec(text))) {
    const top = stack.at(-1)
    if (m[5] !== undefined) {
      top.node.text = (top.node.text ?? '') + m[5]
      continue
    }
    if (!m[2]) continue
    if (m[1]) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const ns = { ...top.ns }
    for (const [, key, , v1, v2] of m[3].matchAll(/([\w.:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      if (key === 'xmlns') ns[''] = v1 ?? v2
      else if (key.startsWith('xmlns:')) ns[key.slice(6)] = v1 ?? v2
    }
    const [prefix, local] = m[2].includes(':') ? m[2].split(':') : ['', m[2]]
    const node = { ns: ns[prefix] ?? '', name: local, children: [] }
    top.node.children.push(node)
    if (!m[4]) stack.push({ node, ns })
  }
  return root.children[0] ?? null
}

const findAll = (node, ns, name) =>
  node
    ? [
        ...(node.ns === ns && node.name === name ? [node] : []),
        ...node.children.flatMap((c) => findAll(c, ns, name)),
      ]
    : []

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tag = (ns, name, inner = '') => {
  const p = PREFIXES[ns]
  return inner === '' ? `<${p}:${name}/>` : `<${p}:${name}>${inner}</${p}:${name}>`
}
const href = (path) => tag(DAV, 'href', xmlEscape(encodeURI(path)))

// --- resources -----------------------------------------------------------------

function propsOf(resource, base, cards) {
  const principal = `${base}/principal/`
  const common = {
    [`${DAV}|current-user-principal`]: href(principal),
    [`${DAV}|owner`]: href(principal),
  }
  switch (resource.kind) {
    case 'root':
      return {
        ...common,
        [`${DAV}|resourcetype`]: tag(DAV, 'collection'),
        [`${DAV}|displayname`]: 'Záře',
      }
    case 'principal':
      return {
        ...common,
        [`${DAV}|resourcetype`]: tag(DAV, 'principal'),
        [`${DAV}|displayname`]: 'Záře',
        [`${DAV}|principal-URL`]: href(principal),
        [`${CARD}|addressbook-home-set`]: href(`${base}/addressbooks/`),
      }
    case 'home':
      return {
        ...common,
        [`${DAV}|resourcetype`]: tag(DAV, 'collection'),
        [`${DAV}|displayname`]: 'Adresáře',
      }
    case 'book': {
      const ctag = createHash('sha1')
        .update(cards.map((c) => c.etag).join())
        .digest('hex')
      return {
        ...common,
        [`${DAV}|resourcetype`]: tag(DAV, 'collection') + tag(CARD, 'addressbook'),
        [`${DAV}|displayname`]: 'Záře',
        [`${CARD}|addressbook-description`]: 'Kontakty oddílu Záře (jen pro čtení)',
        [`${CS}|getctag`]: ctag,
        [`${DAV}|getetag`]: `"${ctag}"`,
        // Only read: DAVx⁵ then makes the address book read-only in the phone.
        [`${DAV}|current-user-privilege-set`]: tag(DAV, 'privilege', tag(DAV, 'read')),
        [`${DAV}|supported-report-set`]: ['addressbook-multiget', 'addressbook-query']
          .map((r) => tag(DAV, 'supported-report', tag(DAV, 'report', tag(CARD, r))))
          .join(''),
        [`${CARD}|supported-address-data`]:
          '<card:address-data-type content-type="text/vcard" version="3.0"/>',
      }
    }
    case 'card':
      return {
        [`${DAV}|resourcetype`]: '',
        [`${DAV}|getetag`]: xmlEscape(resource.card.etag),
        [`${DAV}|getcontenttype`]: 'text/vcard; charset=utf-8',
        [`${CARD}|address-data`]: xmlEscape(resource.card.vcard),
      }
  }
}

const DEFAULT_PROPS = [
  `${DAV}|resourcetype`,
  `${DAV}|displayname`,
  `${DAV}|getetag`,
  `${DAV}|getcontenttype`,
]

// One <d:response>: found properties with 200, unknown ones with 404.
function response(path, props, wanted) {
  const found = []
  const missing = []
  for (const key of wanted) {
    const [ns, name] = [key.slice(0, key.lastIndexOf('|')), key.slice(key.lastIndexOf('|') + 1)]
    if (key in props) {
      found.push(tag(ns, name, props[key]))
    } else {
      missing.push(PREFIXES[ns] ? tag(ns, name) : `<x:${name} xmlns:x="${xmlEscape(ns)}"/>`)
    }
  }
  const propstat = (items, status) =>
    items.length
      ? tag(
          DAV,
          'propstat',
          tag(DAV, 'prop', items.join('')) + tag(DAV, 'status', `HTTP/1.1 ${status}`),
        )
      : ''
  return tag(
    DAV,
    'response',
    href(path) + propstat(found, '200 OK') + propstat(missing, '404 Not Found'),
  )
}

const multistatus = (responses) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<d:multistatus xmlns:d="DAV:" xmlns:card="${CARD}" xmlns:cs="${CS}">${responses.join('')}</d:multistatus>`

function requestedProps(body) {
  const prop = body && findAll(body, DAV, 'prop')[0]
  return prop ? prop.children.map((c) => `${c.ns}|${c.name}`) : DEFAULT_PROPS
}

// The function's path as the client sees it: the emulator and cloudfunctions.net
// put the function name (and project, region) before it, a run.app URL doesn't.
function basePath(req) {
  if (process.env.FUNCTIONS_EMULATOR === 'true')
    return `/${process.env.GCLOUD_PROJECT}/${REGION}/carddav`
  return req.hostname.endsWith('cloudfunctions.net') ? '/carddav' : ''
}

export const carddav = onRequest({ ...BASE_OPTIONS, invoker: 'public' }, async (req, res) => {
  const base = basePath(req)
  let path = decodeURIComponent(req.path)
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path.startsWith('/')) path = `/${path}`

  res.set('DAV', '1, 3, addressbook')
  if (req.method === 'OPTIONS') {
    res.set('Allow', 'OPTIONS, GET, HEAD, PROPFIND, REPORT')
    return res.status(200).end()
  }
  const uid = await signIn(req.get('authorization'))
  if (!uid) {
    res.set('WWW-Authenticate', 'Basic realm="Zare kontakty", charset="UTF-8"')
    return res.status(401).send('Přihlas se.')
  }

  // PUT, DELETE, PROPPATCH, MKCOL, … — the address book is read-only.
  if (!['GET', 'HEAD', 'PROPFIND', 'REPORT'].includes(req.method)) {
    return res.status(403).send('Kontakty jsou jen pro čtení.')
  }

  const cards = await cardsFor(uid)
  logger.info('carddav', { uid, method: req.method, path, cards: cards.length })
  const segments = path.split('/').filter(Boolean)
  let resource = null
  if (segments.length === 0) resource = { kind: 'root', path: `${base}/` }
  else if (segments[0] === '.well-known') return res.redirect(301, `${base}/principal/`)
  else if (segments[0] === 'principal' && segments.length === 1)
    resource = { kind: 'principal', path: `${base}/principal/` }
  else if (segments[0] === 'addressbooks' && segments.length === 1)
    resource = { kind: 'home', path: `${base}/addressbooks/` }
  else if (segments[0] === 'addressbooks' && segments[1] === 'zare' && segments.length === 2)
    resource = { kind: 'book', path: `${base}/addressbooks/zare/` }
  else if (segments[0] === 'addressbooks' && segments[1] === 'zare' && segments.length === 3) {
    const card = cards.find((c) => `${c.id}.vcf` === segments[2])
    if (card) resource = { kind: 'card', path: `${base}/addressbooks/zare/${card.id}.vcf`, card }
  }
  if (!resource) return res.status(404).send('Nenalezeno.')

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (resource.kind !== 'card')
      return res.status(200).type('text/plain').send('Adresář kontaktů Záře.')
    res.set('ETag', resource.card.etag)
    return res.status(200).type('text/vcard; charset=utf-8').send(resource.card.vcard)
  }

  const body = req.rawBody?.length ? parseXml(req.rawBody.toString('utf8')) : null
  const send = (responses) =>
    res.status(207).type('application/xml; charset=utf-8').send(multistatus(responses))
  const cardResource = (card) => ({
    kind: 'card',
    path: `${base}/addressbooks/zare/${card.id}.vcf`,
    card,
  })

  if (req.method === 'PROPFIND') {
    const wanted = requestedProps(body)
    const depth = req.get('depth') ?? 'infinity'
    const list = [resource]
    if (depth !== '0') {
      if (resource.kind === 'home') list.push({ kind: 'book', path: `${base}/addressbooks/zare/` })
      if (resource.kind === 'book') list.push(...cards.map(cardResource))
    }
    // address-data is only sent in REPORTs.
    const propfindWanted = wanted.filter((k) => k !== `${CARD}|address-data`)
    return send(list.map((r) => response(r.path, propsOf(r, base, cards), propfindWanted)))
  }

  if (req.method === 'REPORT' && resource.kind === 'book' && body) {
    const wanted = requestedProps(body)
    if (body.ns === CARD && body.name === 'addressbook-multiget') {
      const hrefs = findAll(body, DAV, 'href').map((h) => decodeURIComponent((h.text ?? '').trim()))
      return send(
        hrefs.map((h) => {
          const card = cards.find((c) => h.endsWith(`/${c.id}.vcf`))
          return card
            ? response(h, propsOf(cardResource(card), base, cards), wanted)
            : tag(DAV, 'response', href(h) + tag(DAV, 'status', 'HTTP/1.1 404 Not Found'))
        }),
      )
    }
    if (body.ns === CARD && body.name === 'addressbook-query') {
      return send(
        cards.map((card) =>
          response(cardResource(card).path, propsOf(cardResource(card), base, cards), wanted),
        ),
      )
    }
    return res
      .status(403)
      .type('application/xml; charset=utf-8')
      .send(
        `<?xml version="1.0" encoding="utf-8"?>\n<d:error xmlns:d="DAV:"><d:supported-report/></d:error>`,
      )
  }

  res.status(400).send('Neznámý požadavek.')
})
