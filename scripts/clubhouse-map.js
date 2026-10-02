// Builds the clubhouse map on the public home (src/assets/public/mapa-klubovna.svg)
// from OpenStreetMap data: streets, buildings and greenery, the clubhouse marked
// with a handwritten note and arrow. Run: npm run map:clubhouse
// The SVG uses the site's CSS variables and fonts, so it is inlined, not <img>.
// Map data © OpenStreetMap contributors (ODbL), credited in the SVG.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const OUT = new URL('../src/assets/public/mapa-klubovna.svg', import.meta.url)
// Downloaded data, reused until `-- --refresh` (gitignored).
const CACHE = new URL('../.clubhouse-map-osm.json', import.meta.url)

const CLUBHOUSE = { lat: 50.0988, lon: 14.39489 } // Kafkova 544/23
const KULATAK = { lat: 50.10085, lon: 14.39553 } // centre of Vítězné náměstí
// Visible area (about 3:2) and its width in SVG units (1 unit ≈ 1.3 m); shown
// ~300–380 px wide.
const VIEW = { s: 50.0976, w: 14.3905, n: 50.10135, e: 14.3991 }
const WIDTH = 460
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Fetched area, a bit larger so streets run off the edges.
const BBOX = [50.0962, 14.3885, 50.1032, 14.4008]

const lat0 = ((VIEW.s + VIEW.n) / 2) * (Math.PI / 180)
const MX = 111320 * Math.cos(lat0) // metres per degree of longitude
const MY = 110540
const scale = WIDTH / ((VIEW.e - VIEW.w) * MX)
const HEIGHT = Math.round((VIEW.n - VIEW.s) * MY * scale)
const r1 = (v) => Math.round(v * 10) / 10
const proj = (p) => [r1((p.lon - VIEW.w) * MX * scale), r1((VIEW.n - p.lat) * MY * scale)]

async function load() {
  if (existsSync(CACHE) && !process.argv.includes('--refresh'))
    return JSON.parse(readFileSync(CACHE, 'utf8'))
  const b = BBOX.join(',')
  const query = `[out:json][timeout:60];(
    way["highway"](${b}); way["building"](${b}); way["leisure"](${b});
    way["landuse"~"grass|recreation_ground|park"](${b}); way["railway"="tram"](${b});
  );out geom;`
  // The main Overpass server is often busy; try a mirror next.
  for (const server of OVERPASS) {
    const res = await fetch(server, {
      method: 'POST',
      headers: { 'User-Agent': 'zareweb-clubhouse-map' },
      body: new URLSearchParams({ data: query }),
    })
    if (res.ok) {
      const ways = (await res.json()).elements.filter((e) => e.type === 'way' && e.geometry)
      writeFileSync(CACHE, JSON.stringify(ways))
      return ways
    }
    console.warn(`${server}: ${res.status}`)
  }
  throw new Error('No Overpass server answered')
}

const line = (g) => 'M' + g.map((p) => proj(p).join(' ')).join('L')
const area = (g) => line(g) + 'Z'

function inside(pt, g) {
  let hit = false
  for (let i = 0, j = g.length - 1; i < g.length; j = i++) {
    const [a, b] = [g[i], g[j]]
    if (a.lat > pt.lat !== b.lat > pt.lat) {
      const x = ((b.lon - a.lon) * (pt.lat - a.lat)) / (b.lat - a.lat) + a.lon
      if (pt.lon < x) hit = !hit
    }
  }
  return hit
}

const dist = (a, b) => Math.hypot((a.lat - b.lat) * MY, (a.lon - b.lon) * MX)

// Street widths in SVG units.
const WIDTHS = {
  primary: 13,
  secondary: 12,
  tertiary: 10,
  busway: 8,
  residential: 8,
  living_street: 7,
  unclassified: 7,
  service: 4,
  pedestrian: 5,
}
// Names shown along the street (the longest piece in view).
const LABELS = [
  'Kafkova',
  'Svatovítská',
  'Jugoslávských partyzánů',
  'Dejvická',
  'Československé armády',
  'Generála Píky',
  'Wuchterlova',
  'Verdunská',
  'Evropská',
]

// Only what reaches into the view (keeps the SVG small).
const visible = (p) => p.lat > VIEW.s && p.lat < VIEW.n && p.lon > VIEW.w && p.lon < VIEW.e
function inView(g) {
  const lats = g.map((p) => p.lat)
  const lons = g.map((p) => p.lon)
  return (
    Math.max(...lats) > VIEW.s &&
    Math.min(...lats) < VIEW.n &&
    Math.max(...lons) > VIEW.w &&
    Math.min(...lons) < VIEW.e
  )
}

const all = await load()
const ways = all.filter((w) => inView(w.geometry))
const paths = { green: [], pitch: [], building: [], street: {}, tram: [] }
let clubhouse = ''
for (const w of ways) {
  const t = w.tags
  const g = w.geometry
  const closed = w.nodes[0] === w.nodes.at(-1)
  if (t.building && closed) {
    if (inside(CLUBHOUSE, g)) clubhouse = area(g)
    else paths.building.push(area(g))
  } else if ((t.leisure === 'pitch' || t.leisure === 'playground') && closed)
    paths.pitch.push(area(g))
  else if ((t.leisure || t.landuse) && closed) paths.green.push(area(g))
  else if (t.railway === 'tram') paths.tram.push(line(g))
  else if (t.highway === 'pedestrian' && t.area === 'yes' && closed) paths.green.push(area(g))
  else if (WIDTHS[t.highway]) {
    ;(paths.street[t.highway] ??= []).push(line(g))
  }
}

// The longest stretch of each labelled street within the view, left to right.
const labels = LABELS.map((name, i) => {
  const parts = ways.filter((w) => w.tags.name === name && WIDTHS[w.tags.highway])
  let best = null
  let bestLen = 0
  for (const w of parts) {
    const g = w.geometry.filter(visible)
    const len = g.slice(1).reduce((s, p, k) => s + dist(p, g[k]), 0)
    if (len > bestLen) [best, bestLen] = [g, len]
  }
  if (!best || bestLen * scale < name.length * 6.5) return ''
  if (best[0].lon > best.at(-1).lon) best = [...best].reverse()
  return { id: `ulice-${i}`, d: line(best), name }
}).filter(Boolean)

const [cx, cy] = proj(CLUBHOUSE)
const [kx, ky] = proj(KULATAK)

// Handwritten note „klubovna“ above, with a big bent arrow down to the building
// (stopping short of it).
const NOTE = { x: cx - 44, y: cy - 66, tilt: -5 } // end of the text, rotated about it
const ARROW = [
  [cx - 34, cy - 82],
  [cx + 6, cy - 96],
  [cx + 24, cy - 56],
  [cx + 4, cy - 17],
] // cubic Bézier: start, two controls, tip
const tip = ARROW[3]
const dir = Math.atan2(tip[1] - ARROW[2][1], tip[0] - ARROW[2][0])
const head = [-0.5, 0.5]
  .map((turn) => {
    const a = dir + Math.PI + turn
    return `M${r1(tip[0] + 14 * Math.cos(a))} ${r1(tip[1] + 14 * Math.sin(a))}L${tip.join(' ')}`
  })
  .join('')
const arrow = `M${ARROW[0].join(' ')}C${ARROW.slice(1).flat().join(' ')}${head}`

const streetLayer = (extra, colour) =>
  Object.entries(paths.street)
    .map(
      ([kind, ds]) =>
        `<path d="${ds.join('')}" stroke="${colour}" stroke-width="${WIDTHS[kind] + extra}"/>`,
    )
    .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="mapa-klubovna-title">
<title id="mapa-klubovna-title">Mapa okolí klubovny: Kafkova 544/23, kousek od Vítězného náměstí a metra Dejvická</title>
<rect width="${WIDTH}" height="${HEIGHT}" fill="var(--color-sand)"/>
<path d="${paths.green.join('')}" fill="#e3e6cc"/>
<path d="${paths.pitch.join('')}" fill="#d5dcb6"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
${streetLayer(2, 'var(--color-line-soft)')}
${streetLayer(0, 'var(--color-paper)')}
<path d="${paths.tram.join('')}" stroke="var(--color-line)" stroke-width="1"/>
</g>
<path d="${paths.building.join('')}" fill="#e2d9c3"/>
<path d="${clubhouse}" fill="var(--color-red)"/>
<g font-family="var(--font-sans)" font-size="12" fill="var(--color-muted-2)" letter-spacing=".02em">
${labels.map((l) => `<path id="${l.id}" d="${l.d}" fill="none"/><text dy="4.1"><textPath href="#${l.id}" startOffset="50%" text-anchor="middle">${l.name}</textPath></text>`).join('\n')}
</g>
<path d="${arrow}" fill="none" stroke="var(--color-red)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
<text x="${NOTE.x}" y="${NOTE.y}" transform="rotate(${NOTE.tilt} ${NOTE.x} ${NOTE.y})" font-family="var(--font-hand)" font-weight="700" font-size="34" text-anchor="end" fill="var(--color-red)" stroke="var(--color-paper)" stroke-width="5" stroke-linejoin="round" paint-order="stroke">klubovna</text>
<text x="${kx}" y="${ky + 4}" font-family="var(--font-sans)" font-size="10" text-anchor="middle" fill="var(--color-muted-2)">Vítězné</text>
<text x="${kx}" y="${ky + 15}" font-family="var(--font-sans)" font-size="10" text-anchor="middle" fill="var(--color-muted-2)">náměstí</text>
<text x="${WIDTH - 4}" y="${HEIGHT - 4}" font-family="var(--font-sans)" font-size="7" text-anchor="end" fill="var(--color-faint)">© OpenStreetMap</text>
</svg>
`

writeFileSync(OUT, svg)
console.log(`${OUT.pathname}: ${WIDTH}×${HEIGHT}, ${Math.round(svg.length / 1024)} kB`)
