<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

// Dashed hand-drawn trail behind the page content (desktop layout).
// It is routed through every `[data-stop]` (the sketches) inside the parent
// element, walking in the gutter between a sketch and its text. When other
// `[data-section]` blocks sit between two stops, it detours around their left edge.

const svg = useTemplateRef('svg')
const d = ref('')

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
    return { lane: onLeft ? b.r + GUTTER : b.l - GUTTER, cy: b.cy, section }
  })

  const pts = []
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
        pts.push({ x: prev.lane, y: inY }, { x: outer, y: inY + 40 })
        pts.push({ x: outer, y: outY - 40 }, { x: stop.lane, y: outY })
      } else {
        pts.push({ x: (prev.lane + stop.lane) / 2, y: (top + bottom) / 2 })
      }
    }
    pts.push({ x: stop.lane, y: stop.cy })
  })

  // Monotonic in y, so the curve never doubles back.
  const out = []
  for (const p of pts) {
    const last = out.at(-1)
    out.push({
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
    path += ` C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)}`
    path += ` ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`
  }
  return path
}

function route() {
  const el = svg.value
  // Hidden on narrow screens — nothing to draw.
  if (!el || !el.getClientRects().length) return
  d.value = smoothPath(waypoints(el.parentElement))
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
  </svg>
</template>
