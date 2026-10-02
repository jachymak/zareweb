<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

// Dashed hand-drawn trail behind the page content (desktop layout).
// It is routed through every `[data-stop]` (the sketches) inside the parent
// element, walking in the gutter between a sketch and its text. When other
// `[data-section]` blocks sit between two stops, it detours around their left edge.
// It sets off from a `[data-trail-start]` element, if any, at the point given by
// its `data-trail-x` / `data-trail-y` (fractions of its box), and ends in a
// `[data-trail-end]` image, at a point given the same way (fractions of the
// picture as `object-fit` lays it out), marked with a small cross.
// Hand tweaks on top (`tweaks`, see src/content/trailTweaks.json, edited with
// the dev TrailEditor). Each waypoint has a stable key, offsets are
// [fraction of the width, px]:
//   move:   { key: offset }  shifts a waypoint
//   handle: { key: offset }  its Bézier handle (the curve's direction there;
//                            mirrored on the other side), instead of the automatic one
//   add:    [{ id, after, d }]  an extra point, `d` from the point `after`
//   remove: [key]            waypoints left out

const props = defineProps({
  tweaks: { type: Object, default: () => ({}) },
})
// For the editor: the final waypoints ({ key, x, y, h, added?, custom? }),
// the removed ones and the width.
const emit = defineEmits(['route'])

const svg = useTemplateRef('svg')
const d = ref('')
const goal = ref(null) // { x, y } of the trail's end, if it has one

const GUTTER = 24 // distance of the trail from a sketch
const CLEARANCE = 30 // distance from blocks it goes around
const MIN_STEP = 24 // the trail never goes back up

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

function smoothPath(pts) {
  if (pts.length < 2) return ''
  const f = (n) => n.toFixed(1)
  let path = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [p1, p2] = [pts[i], pts[i + 1]]
    let c1 = p1.x + p1.h.x
    let c2 = p2.x - p2.h.x
    // Points marked `straight` are reached in a straight line (unless reshaped by hand).
    if (p2.straight) {
      if (!p1.ownHandle) c1 = p1.x
      if (!p2.ownHandle) c2 = p1.x
    }
    path += ` C${f(c1)} ${f(p1.y + p1.h.y)} ${f(c2)} ${f(p2.y - p2.h.y)} ${f(p2.x)} ${f(p2.y)}`
  }
  return path
}

function route() {
  const el = svg.value
  // Hidden on narrow screens — nothing to draw.
  if (!el || !el.getClientRects().length) return
  const wrap = el.parentElement
  const width = wrap.getBoundingClientRect().width
  const { points, removed } = applyTweaks(waypoints(wrap), props.tweaks, width)
  const pts = withHandles(points, props.tweaks?.handle, width)
  d.value = smoothPath(pts)
  goal.value = wrap.querySelector('[data-trail-end]') ? pts.at(-1) : null
  emit('route', { points: pts, removed, width })
}

let observer
let frame = 0
function scheduleRoute() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(route)
}

watch(() => props.tweaks, scheduleRoute, { deep: true })

onMounted(() => {
  observer = new ResizeObserver(scheduleRoute)
  observer.observe(svg.value.parentElement)
  document.fonts?.ready.then(scheduleRoute)
  scheduleRoute()
})

onBeforeUnmount(() => {
  observer?.disconnect()
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
    <!-- Hand-drawn cross where the trail ends, like on a treasure map. -->
    <path
      v-if="goal"
      :transform="`translate(${goal.x} ${goal.y})`"
      d="M-9 -8 C-4 -3 3 3 9 9 M8 -9 C3 -3 -3 3 -8 8"
      stroke="var(--color-red)"
      stroke-width="3.6"
    />
  </svg>
</template>
