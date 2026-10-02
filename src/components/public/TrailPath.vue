<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

// Dashed hand-drawn trail behind the page content (desktop layout).
// It is routed through every `[data-stop]` (the sketches) inside the parent
// element, walking in the gutter between a sketch and its text. When other
// `[data-section]` blocks sit between two stops, it detours around their left edge.
// It sets off from a `[data-trail-start]` element, if any, at the point given by
// its `data-trail-x` / `data-trail-y` (fractions of its box), and ends in a
// `[data-trail-end]` image, at a point given the same way (fractions of the
// picture as `object-fit` lays it out), marked with a small cross.

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
  const stops = [...wrap.querySelectorAll('[data-stop]')].map((el) => {
    const b = box(el, origin)
    const section = sections.find((s) => s.el.contains(el)) ?? b
    const onLeft = b.cx < width / 2
    // The trail passes a sketch on the text side — except the one it ends in,
    // which it goes round on the outer side, to come in from below.
    const inner = !el.querySelector('[data-trail-end]')
    return { lane: onLeft === inner ? b.r + GUTTER : b.l - GUTTER, cy: b.cy, section }
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
    pts.push({ x, y })
    // Into the first stop's lane before its section starts, clear of the text.
    if (stops[0]) pts.push({ x: stops[0].lane, y: Math.max(y + 60, stops[0].section.t + 40) })
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
        pts.push({ x: prev.lane, y: inY, straight: true }, { x: outer, y: inY + 40 })
        pts.push({ x: outer, y: outY - 40 }, { x: stop.lane, y: outY })
      } else {
        pts.push({ x: (prev.lane + stop.lane) / 2, y: (top + bottom) / 2 })
      }
    }
    pts.push({ x: stop.lane, y: stop.cy })
  })

  const end = wrap.querySelector('[data-trail-end]')
  if (end) {
    const fx = Number(end.dataset.trailX ?? 0.5)
    const fy = Number(end.dataset.trailY ?? 1)
    pts.push(pointIn(end, box(end, origin), fx, fy))
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

// Catmull-Rom spline through the points, as cubic Béziers.
function smoothPath(pts) {
  if (pts.length < 2) return ''
  const f = (n) => n.toFixed(1)
  let path = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const k = 1 / 6
    // Points marked `straight` are reached in a straight line.
    const cx = (x) => f(p2.straight ? p1.x : x)
    path += ` C${cx(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)}`
    path += ` ${cx(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`
  }
  return path
}

function route() {
  const el = svg.value
  // Hidden on narrow screens — nothing to draw.
  if (!el || !el.getClientRects().length) return
  const pts = waypoints(el.parentElement)
  d.value = smoothPath(pts)
  goal.value = el.parentElement.querySelector('[data-trail-end]') ? pts.at(-1) : null
}

let observer
let frame = 0
function scheduleRoute() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(route)
}

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
