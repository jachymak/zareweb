<script setup>
import { ref, watch } from 'vue'

// Dev-only panel on the public home page for trying out drawing variants:
// pick any drawing from design-reference/drawings (or a line sketch) for each
// section and flip its side. The choice lives in localStorage; the page
// itself stays untouched until the picked drawings are wired in for real.
const props = defineProps({
  // [{ id, label, defaultFile, sketchSide }] — the page's current setup.
  slots: { type: Array, required: true },
})
// { [slot id]: { file?, url?, raster?, side? } }
const overrides = defineModel({ type: Object, default: () => ({}) })
// HomeHero props: { size?, layout? }
const hero = defineModel('hero', { type: Object, default: () => ({}) })
const emit = defineEmits(['edit-trail'])

const HERO_SIZES = {
  narrow: 'jako teď (960 px)',
  text: 'na šířku textu',
  bleed: 'přes celou šířku',
}
const HERO_PALETTES = { colour: 'skály barevné', grey: 'skály šedé' }
const HERO_LAYOUTS = {
  'sky-right': 'pokřik v obloze vpravo',
  sky: 'pokřik v obloze uprostřed',
  split: 'pokřik rozdělený (obloha + pod obrázkem)',
  above: 'pokřik nad obrázkem',
}

const drawings = import.meta.glob('/design-reference/drawings/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const sketches = import.meta.glob('/src/assets/sketches/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const name = (path) => path.split('/').pop()
const options = [
  ...Object.entries(drawings).map(([path, url]) => ({ name: name(path), url, raster: true })),
  ...Object.entries(sketches).map(([path, url]) => ({ name: name(path), url, raster: false })),
].filter((o) => !o.name.startsWith('skaly'))

const KEY = 'zare:drawing-picker'
const HERO_KEY = 'zare:hero-picker'
const SATURATION_KEY = 'zare:photo-saturation'
const open = ref(false)

// Colour intensity of the photos (CSS saturate(), 1 = as taken), applied
// through --photo-saturation on the page root.
const saturation = ref(1)
try {
  saturation.value = Number(localStorage.getItem(SATURATION_KEY)) || 1
} catch {
  // Private window.
}
watch(
  saturation,
  (value) => {
    document.documentElement.style.setProperty('--photo-saturation', value)
    try {
      localStorage.setItem(SATURATION_KEY, value)
    } catch {
      // Private window.
    }
  },
  { immediate: true },
)

const byName = Object.fromEntries(options.map((o) => [o.name, o]))
// Picking a slot's own default drawing is the same as no override.
const resolve = (choice) => {
  const option = byName[choice.file]
  return option ? { ...choice, url: option.url, raster: option.raster } : { side: choice.side }
}

try {
  const saved = JSON.parse(localStorage.getItem(KEY)) ?? {}
  overrides.value = Object.fromEntries(Object.entries(saved).map(([id, c]) => [id, resolve(c)]))
} catch {
  overrides.value = {}
}
try {
  hero.value = JSON.parse(localStorage.getItem(HERO_KEY)) ?? {}
} catch {
  hero.value = {}
}
watch(hero, (value) => {
  try {
    localStorage.setItem(HERO_KEY, JSON.stringify(value))
  } catch {
    // Private window.
  }
})
watch(
  overrides,
  (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // Private window — the choice just won't survive a reload.
    }
  },
  { deep: true },
)

// patches: { [slot id]: { file?, side? } }, applied in one model update.
function set(patches) {
  const next = { ...overrides.value }
  for (const [id, patch] of Object.entries(patches)) next[id] = resolve({ ...next[id], ...patch })
  overrides.value = next
}

function swap(i, j) {
  const a = props.slots[i]
  const b = props.slots[j]
  const [fileA, fileB] = [current(a), current(b)]
  set({ [a.id]: { file: fileB }, [b.id]: { file: fileA } })
}

// File name currently shown in a slot (override, else the page's default).
function current(slot) {
  return overrides.value[slot.id]?.file ?? slot.defaultFile
}

function side(slot) {
  return overrides.value[slot.id]?.side ?? slot.sketchSide
}

function reset() {
  overrides.value = {}
  hero.value = {}
  saturation.value = 1
}
</script>

<template>
  <div class="fixed right-3 bottom-3 z-50 max-w-[calc(100vw-24px)] text-[14px]">
    <button
      v-if="!open"
      type="button"
      class="rounded-full bg-ink px-4 py-2.5 font-medium text-paper shadow-lg"
      @click="open = true"
    >
      Kresby
    </button>
    <div
      v-else
      class="max-h-[55vh] w-[340px] md:max-h-[80vh] max-w-full overflow-y-auto rounded-xl border border-line bg-paper p-3 shadow-xl"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <strong class="text-ink">Kresby (jen vývoj)</strong>
        <div class="flex gap-2">
          <button type="button" class="text-muted underline" @click="reset">výchozí</button>
          <button type="button" class="px-1 text-[18px] leading-none" @click="open = false">
            ×
          </button>
        </div>
      </div>
      <button
        type="button"
        class="mb-2 w-full rounded-lg bg-green px-3 py-1.5 font-medium text-paper"
        @click="((open = false), emit('edit-trail'))"
      >
        Upravit cestu
      </button>
      <div class="mb-2 flex flex-col gap-1.5 rounded-lg bg-cream p-2">
        <label class="flex items-center gap-2">
          <span class="flex-none font-medium text-ink">Barvy fotek</span>
          <input
            v-model.number="saturation"
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            class="min-w-0 flex-1 accent-green"
          />
          <span class="w-11 flex-none text-right tabular-nums">
            {{ Math.round(saturation * 100) }} %
          </span>
        </label>
        <a href="#uvod" class="font-medium text-ink">Úvod (skály a pokřik)</a>
        <select
          class="w-full rounded border border-line bg-paper px-1.5 py-1"
          :value="hero.palette ?? 'colour'"
          @change="hero = { ...hero, palette: $event.target.value }"
        >
          <option v-for="(label, key) in HERO_PALETTES" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
        <select
          class="w-full rounded border border-line bg-paper px-1.5 py-1"
          :value="hero.size ?? 'narrow'"
          @change="hero = { ...hero, size: $event.target.value }"
        >
          <option v-for="(label, key) in HERO_SIZES" :key="key" :value="key">{{ label }}</option>
        </select>
        <select
          class="w-full rounded border border-line bg-paper px-1.5 py-1"
          :value="hero.layout ?? 'sky-right'"
          @change="hero = { ...hero, layout: $event.target.value }"
        >
          <option v-for="(label, key) in HERO_LAYOUTS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <ol class="m-0 flex list-none flex-col gap-2 p-0">
        <li v-for="(slot, i) in slots" :key="slot.id" class="rounded-lg bg-cream p-2">
          <div class="mb-1 flex items-center justify-between gap-2">
            <a :href="`#${slot.id}`" class="font-medium text-ink">{{ slot.label }}</a>
            <div class="flex gap-1">
              <button
                type="button"
                class="rounded border border-line px-1.5"
                title="Prohodit s předchozím"
                :disabled="i === 0"
                @click="swap(i, i - 1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="rounded border border-line px-1.5"
                title="Prohodit s dalším"
                :disabled="i === slots.length - 1"
                @click="swap(i, i + 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="rounded border border-line px-1.5"
                title="Přesunout na druhou stranu"
                @click="set({ [slot.id]: { side: side(slot) === 'left' ? 'right' : 'left' } })"
              >
                {{ side(slot) === 'left' ? '◧' : '◨' }}
              </button>
            </div>
          </div>
          <select
            class="w-full rounded border border-line bg-paper px-1.5 py-1"
            :value="current(slot)"
            @change="set({ [slot.id]: { file: $event.target.value } })"
          >
            <option v-for="o in options" :key="o.name" :value="o.name">
              {{ o.name }}{{ o.name === slot.defaultFile ? ' (výchozí)' : '' }}
            </option>
          </select>
        </li>
      </ol>
    </div>
  </div>
</template>
