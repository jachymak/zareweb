<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Dev-only editor for the home page trail (TrailPath): drag its waypoints and
// their Bézier handles, add or remove points, and save the tweaks into
// src/content/trailTweaks.json (written by the dev server, see vite.config.js).
// Shown over the page from md up.
const props = defineProps({
  // Last route from TrailPath: { points, removed, width, obstacles }; a point
  // is { key, x, y, h: {x, y}, rx, ry, added?, custom?, ownHandle? }, an
  // obstacle a box { l, r, t, b } the trail keeps out of.
  route: { type: Object, default: null },
  // Tweaks as the page loaded them from the file.
  saved: { type: Object, required: true },
})
const tweaks = defineModel('tweaks', { type: Object, required: true })
const emit = defineEmits(['close'])

const clone = (t) => ({
  move: { ...(t?.move ?? {}) },
  handle: { ...(t?.handle ?? {}) },
  add: (t?.add ?? []).map((a) => ({ ...a })),
  remove: [...(t?.remove ?? [])],
})

// What the file holds now (saving doesn't reload the page).
const saved = ref(clone(props.saved))
const status = ref('')
const dirty = computed(() => JSON.stringify(clone(tweaks.value)) !== JSON.stringify(saved.value))

const points = computed(() => props.route?.points ?? [])
const removed = computed(() => props.route?.removed ?? [])
const selectedKey = ref(null)
const selected = computed(
  () =>
    points.value.find((p) => p.key === selectedKey.value) ??
    removed.value.find((p) => p.key === selectedKey.value),
)
const isRemoved = computed(() => removed.value.some((p) => p.key === selectedKey.value))

const width = () => props.route?.width || 1
const round = (n) => Number(n.toFixed(4))
const offset = (dx, dy) => [round(dx / width()), Math.round(dy)]

function update(change) {
  const t = clone(tweaks.value)
  change(t)
  tweaks.value = t
}

// Dragging a point (what: 'point') or one end of its handle ('out' | 'in').
let drag = null
function onDown(point, what, event) {
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  selectedKey.value = point.key
  drag = { point, what, x: event.clientX, y: event.clientY }
}
function onMove(event) {
  if (!drag) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  const p = drag.point
  update((t) => {
    if (drag.what === 'point') {
      // New spot, as an offset from the untweaked one.
      const d = offset(p.x + dx - p.rx, p.y + dy - p.ry)
      if (p.added) t.add.find((a) => a.id === p.key).d = d
      else t.move[p.key] = d
    } else {
      const sign = drag.what === 'out' ? 1 : -1
      t.handle[p.key] = offset(p.h.x + sign * dx, p.h.y + sign * dy)
    }
  })
}
function onUp() {
  drag = null
}

function addAfter() {
  const i = points.value.findIndex((p) => p.key === selectedKey.value)
  if (i < 0) return
  const p = points.value[i]
  const next = points.value[i + 1] ?? { x: p.x, y: p.y + 80 }
  const id = `p${Date.now().toString(36)}`
  // Halfway to the next point.
  const d = offset((p.x + next.x) / 2 - p.rx, (p.y + next.y) / 2 - p.ry)
  update((t) => t.add.push({ id, after: p.key, d }))
  selectedKey.value = id
}

function removeSelected() {
  const p = selected.value
  if (!p || isRemoved.value) return
  update((t) => {
    delete t.handle[p.key]
    if (p.added) {
      const gone = t.add.find((a) => a.id === p.key)
      t.add = t.add.filter((a) => a !== gone)
      // Points added after it now follow its own anchor (their offsets stay valid).
      for (const a of t.add) if (a.after === gone.id) a.after = gone.after
    } else {
      t.remove.push(p.key)
    }
  })
  selectedKey.value = null
}

function restoreSelected() {
  update((t) => (t.remove = t.remove.filter((k) => k !== selectedKey.value)))
}

// Back to the computed spot and the automatic handle.
function resetSelected() {
  const p = selected.value
  if (!p) return
  update((t) => {
    delete t.handle[p.key]
    if (p.added) t.add.find((a) => a.id === p.key).d = [0, 0]
    else delete t.move[p.key]
  })
}

function resetHandle() {
  update((t) => delete t.handle[selectedKey.value])
}

function onKey(event) {
  if (event.target.closest?.('input, textarea, select')) return
  if (event.key === 'Escape') selectedKey.value = null
  if ((event.key === 'Delete' || event.key === 'Backspace') && selected.value) {
    event.preventDefault()
    removeSelected()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

async function save() {
  status.value = 'ukládám…'
  try {
    const res = await fetch('/__dev/trail-tweaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clone(tweaks.value)),
    })
    if (res.ok) saved.value = clone(tweaks.value)
    status.value = res.ok ? 'uloženo do src/content/trailTweaks.json' : `chyba ${res.status}`
  } catch (e) {
    status.value = `chyba: ${e.message}`
  }
}

function color(point) {
  if (point.added) return 'var(--color-green)'
  return point.custom ? 'var(--color-red)' : 'var(--color-trail)'
}
</script>

<template>
  <div data-trail-over class="pointer-events-none absolute inset-0 z-30">
    <!-- Where the trail shouldn't go: the page bends it out of these boxes
         (not while editing), so routing round them keeps it where drawn. -->
    <svg class="absolute inset-0 size-full overflow-visible">
      <rect
        v-for="(o, i) in route?.obstacles ?? []"
        :key="i"
        :x="o.l"
        :y="o.t"
        :width="o.r - o.l"
        :height="o.b - o.t"
        rx="6"
        fill="var(--color-red)"
        fill-opacity="0.07"
        stroke="var(--color-red)"
        stroke-opacity="0.35"
        stroke-dasharray="4 4"
      />
    </svg>
    <!-- Handle arms of the selected point. -->
    <svg v-if="selected && !isRemoved" class="absolute inset-0 size-full overflow-visible">
      <line
        :x1="selected.x - selected.h.x"
        :y1="selected.y - selected.h.y"
        :x2="selected.x + selected.h.x"
        :y2="selected.y + selected.h.y"
        stroke="var(--color-ink)"
        stroke-width="1.2"
        stroke-dasharray="4 3"
      />
    </svg>

    <button
      v-for="point in removed"
      :key="`gone-${point.key}`"
      type="button"
      :title="`${point.key} (odebraný)`"
      class="pointer-events-auto absolute size-3.5 -translate-1/2 rounded-full border-2 border-dashed border-muted bg-paper/70"
      :class="{ 'ring-2 ring-ink': point.key === selectedKey }"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @click="selectedKey = point.key"
    />

    <button
      v-for="point in points"
      :key="point.key"
      type="button"
      :title="`${point.key}${point.added ? ' (přidaný)' : ''}`"
      class="pointer-events-auto absolute size-4 -translate-1/2 cursor-grab touch-none rounded-full border-2 border-paper shadow active:cursor-grabbing"
      :class="{ 'ring-2 ring-ink': point.key === selectedKey }"
      :style="{ left: `${point.x}px`, top: `${point.y}px`, background: color(point) }"
      @pointerdown="onDown(point, 'point', $event)"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @dblclick="addAfter"
    />

    <template v-if="selected && !isRemoved">
      <button
        v-for="end in ['in', 'out']"
        :key="end"
        type="button"
        :title="end === 'out' ? 'úchyt — kam křivka pokračuje' : 'úchyt — odkud křivka přichází'"
        class="pointer-events-auto absolute size-3 -translate-1/2 rotate-45 cursor-grab touch-none border-2 border-ink bg-paper active:cursor-grabbing"
        :style="{
          left: `${selected.x + (end === 'out' ? 1 : -1) * selected.h.x}px`,
          top: `${selected.y + (end === 'out' ? 1 : -1) * selected.h.y}px`,
        }"
        @pointerdown="onDown(selected, end, $event)"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />
    </template>
  </div>

  <div
    data-trail-over
    class="fixed bottom-3 left-3 z-50 w-[320px] rounded-xl border border-line bg-paper p-3 text-[14px] shadow-xl"
  >
    <div class="mb-1 flex items-center justify-between">
      <strong class="text-ink">Úprava cesty</strong>
      <span v-if="dirty" class="text-red">neuloženo</span>
    </div>
    <p class="m-0 mb-2 leading-snug text-muted">
      Klikni na bod a táhni ho; kosočtverečky jsou úchyty křivky. Dvojklik přidá bod za vybraný,
      Delete ho smaže, Esc zruší výběr.
    </p>

    <div v-if="selected" class="mb-2 rounded-lg bg-cream p-2">
      <div class="mb-1.5 font-mono text-[13px] text-ink">
        {{ selected.key }}
        <span class="text-muted">
          {{ isRemoved ? '· odebraný' : selected.added ? '· přidaný' : '' }}
        </span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-if="isRemoved"
          type="button"
          class="rounded border border-line px-2 py-0.5"
          @click="restoreSelected"
        >
          Obnovit bod
        </button>
        <template v-else>
          <button type="button" class="rounded border border-line px-2 py-0.5" @click="addAfter">
            Přidat bod za
          </button>
          <button
            type="button"
            class="rounded border border-line px-2 py-0.5"
            @click="removeSelected"
          >
            Smazat bod
          </button>
          <button
            type="button"
            class="rounded border border-line px-2 py-0.5"
            @click="resetSelected"
          >
            Vrátit na výchozí
          </button>
          <button
            v-if="selected.ownHandle"
            type="button"
            class="rounded border border-line px-2 py-0.5"
            @click="resetHandle"
          >
            Automatický úchyt
          </button>
        </template>
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button type="button" class="rounded bg-green px-2.5 py-1 text-paper" @click="save">
        Uložit do kódu
      </button>
      <button
        type="button"
        class="rounded border border-line px-2.5 py-1"
        :disabled="!dirty"
        @click="tweaks = clone(saved)"
      >
        Zpět na uložené
      </button>
      <button
        type="button"
        class="rounded border border-line px-2.5 py-1"
        @click="tweaks = clone({})"
      >
        Vynulovat
      </button>
      <button type="button" class="rounded border border-line px-2.5 py-1" @click="emit('close')">
        Hotovo
      </button>
    </div>
    <p v-if="status" class="m-0 mt-2 text-muted">{{ status }}</p>
  </div>
</template>
