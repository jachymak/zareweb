<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

// Dashed hand-drawn trail behind the page content (desktop layout).
// It is routed through every `[data-stop]` (the sketches) inside the parent
// element, walking in the gutter between a sketch and its text. When other
// `[data-section]` blocks sit between two stops, it detours around their left edge.
// It sets off from a `[data-trail-start]` element, if any, at the point given by
// its `data-trail-x` / `data-trail-y` (fractions of its box), and ends in a
// `[data-trail-end]` image, at a point given the same way (fractions of the
// picture as `object-fit` lays it out).
// Hand tweaks on top (`tweaks`, see src/content/trailTweaks.json, edited with
// the dev TrailEditor). Each waypoint has a stable key, offsets are
// [fraction of the width, px]:
//   move:   { key: offset }  shifts a waypoint
//   handle: { key: offset }  its Bézier handle (the curve's direction there;
//                            mirrored on the other side), instead of the automatic one
//   add:    [{ id, after, d }]  an extra point, `d` from the point `after`
//   remove: [key]            waypoints left out
// Last, the drawn curve is bent away from text and pictures (except inside
// `[data-trail-over]` blocks, which may cover it), keeping at least `GAP`
// from them however the page reflows.

const props = defineProps({
  tweaks: { type: Object, default: () => ({}) },
  // Off while the trail is being edited: the bends would make it jump about
  // under the dragged point.
  bend: { type: Boolean, default: true },
})
// For the editor: the final waypoints ({ key, x, y, h, added?, custom? }),
// the removed ones, the width and the obstacles (boxes, GAP included).
const emit = defineEmits(['route'])

const svg = useTemplateRef('svg')
const d = ref('')

const GUTTER = 24 // distance of the trail from a sketch
const CLEARANCE = 30 // distance from blocks it goes around
const MIN_STEP = 24 // the trail never goes back up
const GAP = 18 // least distance of the trail from text and pictures

function box(el, origin) {
  const r = el.getBoundingClientRect()
  return {
    l: r.left - origin.left,
    r: r.right - origin.left,
    t: r.top - origin.top,
    b: r.bottom - origin.top,
    cx: (r.left + r.right) / 2 - origin.left,
    cy: (r.top + r.bottom) / 2 - origin.top,
  }
}

// Point of an element at fractions of its box — or, for an <img> with
// `object-fit: contain`, of the picture inside the box (its aspect ratio from
// the width/height attributes, so it works before the image loads).
function pointIn(el, b, fx, fy) {
  let { l, t } = b
  let w = b.r - b.l
  let h = b.b - b.t
  if (el.tagName === 'IMG' && getComputedStyle(el).objectFit === 'contain') {
    const ratio = el.getAttribute('width') / el.getAttribute('height')
    const pw = Math.min(w, h * ratio)
    const ph = pw / ratio
    l += (w - pw) / 2
    t += (h - ph) / 2
    w = pw
    h = ph
  }
  return { x: l + w * fx, y: t + h * fy }
}

function waypoints(wrap) {
  const origin = wrap.getBoundingClientRect()
  const width = origin.width
  const sections = [...wrap.querySelectorAll('[data-section]')].map((el) => ({
    el,
    ...box(el, origin),
  }))
  const stops = [...wrap.querySelectorAll('[data-stop]')].map((el, i) => {
    const b = box(el, origin)
    const section = sections.find((s) => s.el.contains(el)) ?? b
    const onLeft = b.cx < width / 2
    // The trail passes a sketch on the text side — except the one it ends in,
    // which it goes round on the outer side, to come in from below.
    const inner = !el.querySelector('[data-trail-end]')
    const id = section.el?.id || `stop${i}`
    return { id, lane: onLeft === inner ? b.r + GUTTER : b.l - GUTTER, cy: b.cy, section }
  })

  const pts = []
  const start = wrap.querySelector('[data-trail-start]')
  if (start) {
    const b = box(start, origin)
    const { x, y } = pointIn(
      start,
      b,
      Number(start.dataset.trailX ?? 0.5),
      Number(start.dataset.trailY ?? 1),
    )
    pts.push({ key: 'trailhead', x, y })
    // Into the first stop's lane before its section starts, clear of the text.
    if (stops[0]) {
      pts.push({
        key: 'trailhead:out',
        x: stops[0].lane,
        y: Math.max(y + 60, stops[0].section.t + 40),
      })
    }
  }
  stops.forEach((stop, i) => {
    const prev = stops[i - 1]
    if (prev) {
      const top = prev.section.b
      const bottom = stop.section.t
      const between = sections.filter((s) => s.t >= top - 2 && s.b <= bottom + 2)
      if (between.length) {
        const outer = Math.max(16, Math.min(...between.map((s) => s.l)) - CLEARANCE)
        const inY = Math.min(...between.map((s) => s.t)) - CLEARANCE / 2
        const outY = Math.max(...between.map((s) => s.b)) + CLEARANCE / 2
        // Straight down the lane to the turn, not bulging into the text beside it.
        pts.push({ key: `${stop.id}:in`, x: prev.lane, y: inY, straight: true })
        pts.push({ key: `${stop.id}:a`, x: outer, y: inY + 40 })
        pts.push({ key: `${stop.id}:b`, x: outer, y: outY - 40 })
        pts.push({ key: `${stop.id}:out`, x: stop.lane, y: outY })
      } else {
        pts.push({ key: `${stop.id}:mid`, x: (prev.lane + stop.lane) / 2, y: (top + bottom) / 2 })
      }
    }
    pts.push({ key: stop.id, x: stop.lane, y: stop.cy })
  })

  const end = wrap.querySelector('[data-trail-end]')
  if (end) {
    const fx = Number(end.dataset.trailX ?? 0.5)
    const fy = Number(end.dataset.trailY ?? 1)
    pts.push({ key: 'end', ...pointIn(end, box(end, origin), fx, fy) })
  }

  // Monotonic in y, so the curve never doubles back.
  const out = []
  for (const p of pts) {
    const last = out.at(-1)
    out.push({
      ...p,
      x: Math.min(width - 16, Math.max(16, p.x)),
      y: last ? Math.max(p.y, last.y + MIN_STEP) : p.y,
    })
  }
  return out
}

// Moved, added and removed points; returns { points, removed }. Added points
// sit at an offset (`d`) from the untweaked spot (rx, ry) of the nearest
// computed point before them, so moving any other point never drags them along.
function applyTweaks(pts, tweaks, width) {
  const move = tweaks?.move ?? {}
  const all = pts.map((p) => {
    const m = move[p.key]
    const at = m ? { x: p.x + m[0] * width, y: p.y + m[1], custom: true } : {}
    return { ...p, rx: p.x, ry: p.y, ...at }
  })
  for (const a of tweaks?.add ?? []) {
    const i = all.findIndex((p) => p.key === a.after)
    if (i < 0) continue
    const { rx, ry } = all[i]
    all.splice(i + 1, 0, {
      key: a.id,
      added: true,
      x: rx + a.d[0] * width,
      y: ry + a.d[1],
      rx,
      ry,
    })
  }
  const gone = new Set(tweaks?.remove ?? [])
  return {
    points: all.filter((p) => !gone.has(p.key)),
    removed: all.filter((p) => gone.has(p.key)),
  }
}

// Bézier handle of each point (`h`, the vector to its outgoing control point):
// from the tweaks, or automatic — a Catmull-Rom spline through the points.
function withHandles(pts, handles, width) {
  const k = 1 / 6
  return pts.map((p, i) => {
    const h = handles?.[p.key]
    if (h) return { ...p, h: { x: h[0] * width, y: h[1] }, custom: true, ownHandle: true }
    const prev = pts[i - 1] ?? p
    const next = pts[i + 1] ?? p
    return { ...p, h: { x: (next.x - prev.x) * k, y: (next.y - prev.y) * k } }
  })
}

// Cubic Bézier segments [p0, c1, c2, p1] through the points.
function segments(pts) {
  const segs = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [p1, p2] = [pts[i], pts[i + 1]]
    let c1 = p1.x + p1.h.x
    let c2 = p2.x - p2.h.x
    // Points marked `straight` are reached in a straight line (unless reshaped by hand).
    if (p2.straight) {
      if (!p1.ownHandle) c1 = p1.x
      if (!p2.ownHandle) c2 = p1.x
    }
    segs.push([p1, { x: c1, y: p1.y + p1.h.y }, { x: c2, y: p2.y - p2.h.y }, p2])
  }
  return segs
}

const f = (n) => n.toFixed(1)

function smoothPath(segs) {
  if (!segs.length) return ''
  let path = `M${f(segs[0][0].x)} ${f(segs[0][0].y)}`
  for (const [, c1, c2, p] of segs) {
    path += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p.x)} ${f(p.y)}`
  }
  return path
}

// ---- keeping clear of text and pictures ----

const STEP = 6 // sampling distance along the curve (px)

// Points every STEP px along the curve.
function sample(segs) {
  const dense = []
  for (const [p0, c1, c2, p1] of segs) {
    for (let i = dense.length ? 1 : 0; i <= 40; i++) {
      const t = i / 40
      const u = 1 - t
      const a = u * u * u
      const b = 3 * u * u * t
      const c = 3 * u * t * t
      const d = t * t * t
      dense.push({
        x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
        y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
      })
    }
  }
  const out = [dense[0]]
  let left = STEP
  for (let i = 1; i < dense.length; i++) {
    let [a, b] = [dense[i - 1], dense[i]]
    let len = Math.hypot(b.x - a.x, b.y - a.y)
    while (len >= left) {
      const t = left / len
      a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      out.push(a)
      len -= left
      left = STEP
    }
    left -= len
  }
  out.push(dense.at(-1))
  return out
}

// Part of an image (fractions) that isn't transparent, by its pixels; cached per file.
const opaqueCache = new Map()
function opaquePart(img) {
  const src = img.currentSrc || img.src
  if (opaqueCache.has(src)) return opaqueCache.get(src)
  if (!img.complete || !img.naturalWidth) return null
  let part = { l: 0, t: 0, r: 1, b: 1 }
  try {
    const w = 80
    const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
    const ctx = Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext(
      '2d',
      { willReadFrequently: true },
    )
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    let [l, t, r, b] = [w, h, -1, -1]
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] < 24) continue
        l = Math.min(l, x)
        r = Math.max(r, x)
        t = Math.min(t, y)
        b = Math.max(b, y)
      }
    }
    if (r >= 0) part = { l: l / w, t: t / h, r: (r + 1) / w, b: (b + 1) / h }
  } catch {
    // Unreadable pixels — the whole picture counts.
  }
  opaqueCache.set(src, part)
  return part
}

// Boxes the trail keeps GAP away from: the lines of each text block and the
// pictures (a photo with its frame), relative to `origin`.
function obstacles(wrap, origin) {
  const skip = (el) => el.closest('[data-trail-over], svg, [data-trail-start], [data-trail-end]')
  const rel = (r) => ({
    l: r.left - origin.left,
    r: r.right - origin.left,
    t: r.top - origin.top,
    b: r.bottom - origin.top,
  })
  const blocks = new Map()
  const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    if (!node.textContent.trim() || skip(parent) || parent.closest('figure')) continue
    const block = parent.closest('p, h1, h2, h3, h4, h5, h6, li, dt, dd, button, div') ?? parent
    range.selectNodeContents(node)
    for (const r of range.getClientRects()) {
      if (!r.width || !r.height) continue
      const o = blocks.get(block)
      const b = rel(r)
      blocks.set(
        block,
        o
          ? {
              l: Math.min(o.l, b.l),
              r: Math.max(o.r, b.r),
              t: Math.min(o.t, b.t),
              b: Math.max(o.b, b.b),
            }
          : b,
      )
    }
  }
  const boxes = [...blocks.values()]
  for (const figure of wrap.querySelectorAll('figure')) {
    if (!skip(figure)) boxes.push(rel(figure.getBoundingClientRect()))
  }
  for (const img of wrap.querySelectorAll('img')) {
    if (skip(img) || img.closest('figure')) continue
    const r = img.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const b = box(img, origin)
    // The picture as object-fit lays it out, trimmed to its opaque part.
    const tl = pointIn(img, b, 0, 0)
    const br = pointIn(img, b, 1, 1)
    const part = opaquePart(img) ?? { l: 0, t: 0, r: 1, b: 1 }
    const [w, h] = [br.x - tl.x, br.y - tl.y]
    boxes.push({
      l: tl.x + w * part.l,
      r: tl.x + w * part.r,
      t: tl.y + h * part.t,
      b: tl.y + h * part.b,
    })
  }
  return merge(boxes.map((o) => ({ l: o.l - GAP, r: o.r + GAP, t: o.t - GAP, b: o.b + GAP })))
}

const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b

// Joins boxes too close for the trail to pass between (their margins overlap).
function merge(boxes) {
  const out = [...boxes]
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      if (!overlap(out[i], out[j])) continue
      const [a, b] = [out[i], out[j]]
      out[i] = {
        l: Math.min(a.l, b.l),
        r: Math.max(a.r, b.r),
        t: Math.min(a.t, b.t),
        b: Math.max(a.b, b.b),
      }
      out.splice(j, 1)
      j = i // the grown box may now touch earlier ones
    }
  }
  return out
}

const inside = (p, o) => p.x > o.l && p.x < o.r && p.y > o.t && p.y < o.b

// Bends the sampled curve out of the obstacles. Each stretch inside one is
// pushed to its nearest free edge — sideways, or up/down for a stretch running
// across it — and the push fades out smoothly along the curve on both sides,
// so the trail swerves rather than kinks — even out past the page edge, which
// is better than a cramped bend. With no free edge the trail passes under.
function avoid(pts, boxes) {
  let changed = false
  for (let round = 0; round < 8; round++) {
    const need = pts.map(() => ({ x: 0, y: 0 }))
    let hit = false
    for (const o of boxes) {
      for (let i = 0; i < pts.length; i++) {
        if (!inside(pts[i], o)) continue
        let j = i
        while (j + 1 < pts.length && inside(pts[j + 1], o)) j++
        const run = pts.slice(i, j + 1)
        const xs = run.map((p) => p.x)
        const ys = run.map((p) => p.y)
        const across = Math.max(...xs) - Math.min(...xs) > 2 * (Math.max(...ys) - Math.min(...ys))
        const options = [
          { axis: 'x', to: o.l, ok: true },
          { axis: 'x', to: o.r, ok: true },
          { axis: 'y', to: o.t, ok: across },
          { axis: 'y', to: o.b, ok: across },
        ]
          .filter(
            (opt) =>
              opt.ok &&
              !boxes.some(
                (other) =>
                  other !== o && run.some((p) => inside({ ...p, [opt.axis]: opt.to }, other)),
              ),
          )
          .map((opt) => ({
            ...opt,
            cost: Math.max(...run.map((p) => Math.abs(opt.to - p[opt.axis]))),
          }))
        i = j
        if (!options.length) continue
        const best = options.reduce((a, b) => (b.cost < a.cost ? b : a))
        for (let k = i - run.length + 1; k <= j; k++) {
          const gap = best.to - pts[k][best.axis]
          const d = gap + Math.sign(gap)
          if (Math.abs(d) > Math.abs(need[k][best.axis])) need[k][best.axis] = d
        }
        hit = true
      }
    }
    if (!hit) break
    changed = true
    // Spread each push along the curve with a cosine falloff.
    const shift = pts.map(() => ({ x: { pos: 0, neg: 0 }, y: { pos: 0, neg: 0 } }))
    need.forEach((n, i) => {
      for (const axis of ['x', 'y']) {
        const d = n[axis]
        if (!d) continue
        const reach = Math.ceil(Math.max(60, 3 * Math.abs(d)) / STEP)
        for (let k = Math.max(0, i - reach); k <= Math.min(pts.length - 1, i + reach); k++) {
          const v = (d * (1 + Math.cos((Math.PI * (k - i)) / reach))) / 2
          const s = shift[k][axis]
          if (v > 0) s.pos = Math.max(s.pos, v)
          else s.neg = Math.min(s.neg, v)
        }
      }
    })
    pts = pts.map((p, i) => ({
      x: p.x + shift[i].x.pos + shift[i].x.neg,
      y: p.y + shift[i].y.pos + shift[i].y.neg,
    }))
  }
  return changed ? pts : null
}

// Smooth curve through densely sampled points (every other one, Catmull-Rom).
function sampledPath(pts) {
  const p = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1)
  let path = `M${f(p[0].x)} ${f(p[0].y)}`
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c, d] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]]
    path += ` C${f(b.x + (c.x - a.x) / 6)} ${f(b.y + (c.y - a.y) / 6)} ${f(c.x - (d.x - b.x) / 6)} ${f(c.y - (d.y - b.y) / 6)} ${f(c.x)} ${f(c.y)}`
  }
  return path
}

function route() {
  const el = svg.value
  // Hidden on narrow screens — nothing to draw.
  if (!el || !el.getClientRects().length) return
  const wrap = el.parentElement
  const origin = wrap.getBoundingClientRect()
  const width = origin.width
  const { points, removed } = applyTweaks(waypoints(wrap), props.tweaks, width)
  const pts = withHandles(points, props.tweaks?.handle, width)
  const segs = segments(pts)
  const boxes = obstacles(wrap, origin)
  const bent = props.bend && segs.length ? avoid(sample(segs), boxes) : null
  d.value = bent ? sampledPath(bent) : smoothPath(segs)
  emit('route', { points: pts, removed, width, obstacles: boxes })
}

let observer
let wrap
let frame = 0
function scheduleRoute() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(route)
}

watch(() => [props.tweaks, props.bend], scheduleRoute, { deep: true })

onMounted(() => {
  wrap = svg.value.parentElement
  observer = new ResizeObserver(scheduleRoute)
  observer.observe(wrap)
  // Pictures change size, and reveal their opaque part, once they load.
  wrap.addEventListener('load', scheduleRoute, true)
  document.fonts?.ready.then(scheduleRoute)
  scheduleRoute()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  wrap?.removeEventListener('load', scheduleRoute, true)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <svg
    ref="svg"
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 block size-full overflow-visible"
    fill="none"
    stroke="var(--color-trail)"
    stroke-width="3.4"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="d" stroke-dasharray="3 11 1.5 14 5 12 2 16 3.5 11 1.5 13" />
  </svg>
</template>
