<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// A box with a wobbly, hand-drawn outline. The outline is drawn for the box's real size:
// points along an edge stretch with it, but the wobble (how far the line strays inward)
// only shrinks for small boxes and never grows past its size at the shape's viewBox, so
// a big box keeps the same margin between its outline and its content. Pick the shape
// closest to the box's proportions.
const props = defineProps({
  stroke: { type: String, default: 'var(--color-green)' },
  fill: { type: String, default: 'var(--color-paper)' },
  shape: { type: String, default: 'card' }, // 'card' (wide) | 'tall' (long forms)
})

const SHAPES = {
  card: {
    width: 720,
    height: 300,
    d: 'M10 16 C180 8 420 22 706 10 C714 90 700 190 710 288 C480 296 240 282 14 292 C6 200 18 104 10 16 Z',
  },
  tall: {
    width: 720,
    height: 1000,
    d: 'M10 8 C200 4 460 11 708 5 C714 300 702 640 712 995 C470 998 230 992 12 997 C4 660 16 320 10 8 Z',
  },
}
// Coordinates this close to an edge are the wobble; the rest are positions along an edge.
const WOBBLE = 30

const shapeDef = computed(() => SHAPES[props.shape] ?? SHAPES.card)

const box = ref(null)
const size = ref(null)
let observer

onMounted(() => {
  // The border box: callers often pad the box itself.
  observer = new ResizeObserver(() => {
    const { offsetWidth: width, offsetHeight: height } = box.value
    size.value = width && height ? { width, height } : null
  })
  observer.observe(box.value)
})
onBeforeUnmount(() => observer?.disconnect())

// One coordinate of the shape mapped onto the real box length; `wobble` scales the strays.
function place(value, from, to, wobble) {
  if (value <= WOBBLE) return value * wobble
  if (value >= from - WOBBLE) return to - (from - value) * wobble
  return (value / from) * to
}

// Until the box is measured, the shape is stretched over it as a whole.
const view = computed(() => {
  const { width, height, d } = shapeDef.value
  if (!size.value) return { viewBox: `0 0 ${width} ${height}`, d }
  const w = size.value.width
  const h = size.value.height
  // A narrow (phone) box wobbles less in both directions, however tall it is.
  const wobbleX = Math.min(1, w / width)
  const wobbleY = Math.min(wobbleX, h / height)
  let axis = 0
  const scaled = d.replace(/-?\d+(\.\d+)?/g, (n) => {
    const v = Number(n)
    const placed = axis++ % 2 === 0 ? place(v, width, w, wobbleX) : place(v, height, h, wobbleY)
    return placed.toFixed(1)
  })
  return { viewBox: `0 0 ${w} ${h}`, d: scaled }
})
</script>

<template>
  <div ref="box" class="relative">
    <svg
      :viewBox="view.viewBox"
      preserveAspectRatio="none"
      aria-hidden="true"
      class="absolute inset-0 block size-full"
    >
      <path
        :d="view.d"
        :fill="fill"
        :stroke="stroke"
        stroke-width="2.4"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div class="relative">
      <slot />
    </div>
  </div>
</template>
