<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { justifiedRows, targetRowHeight } from './justifiedLayout'

// Rows of equal height filling the full width, photos keep their aspect ratio
// (like Google Photos, justifiedLayout.js). Sizes come from the stored
// width/height, so the layout is final before any image loads; the dominant
// colour fills the tile until then.
const props = defineProps({
  photos: { type: Array, required: true },
  selectable: { type: Boolean, default: false }, // leaders: selection circles
  selecting: { type: Boolean, default: false }, // a click selects instead of opening
  selected: { type: Set, default: () => new Set() },
  coverId: { type: String, default: null }, // marked „titulní“ (leaders)
})
const emit = defineEmits(['open', 'toggle']) // open(photo), toggle(photo, { range })

const loaded = reactive(new Set())

const root = ref(null)
const width = ref(0)
let observer
onMounted(() => {
  width.value = root.value.clientWidth
  observer = new ResizeObserver(([entry]) => (width.value = entry.contentRect.width))
  observer.observe(root.value)
})
onUnmounted(() => observer?.disconnect())

const gap = computed(() => (width.value < 600 ? 3 : 4))
const rows = computed(() =>
  width.value
    ? justifiedRows(props.photos, width.value, targetRowHeight(width.value), gap.value)
    : [],
)

function click(photo, event) {
  if (event.metaKey || event.ctrlKey) return // open in a new tab as a normal link
  event.preventDefault()
  if (props.selecting) emit('toggle', photo, { range: event.shiftKey })
  else emit('open', photo)
}
</script>

<template>
  <div ref="root" class="flex flex-col" :style="{ gap: `${gap}px` }">
    <div
      v-for="(row, r) in rows"
      :key="r"
      class="flex"
      :style="{ gap: `${gap}px`, height: `${row.height}px` }"
    >
      <div
        v-for="({ photo, width: w }, i) in row.items"
        :key="photo.id"
        class="group relative overflow-hidden"
        :class="row.justified && i === row.items.length - 1 ? 'min-w-0 flex-1' : 'shrink-0'"
        :style="{
          width: `${w}px`,
          backgroundColor: selected.has(photo.id)
            ? 'var(--color-green-light)'
            : photo.dominantColor,
        }"
        :data-photo-id="photo.id"
        data-testid="photo-tile"
      >
        <a
          :href="`?photo=${photo.id}`"
          class="block size-full"
          :aria-label="photo.originalFilename"
          @click="click(photo, $event)"
        >
          <img
            alt=""
            loading="lazy"
            decoding="async"
            class="absolute inset-0 size-full object-cover transition-[opacity,scale] duration-300"
            :class="[
              loaded.has(photo.id) ? 'opacity-100' : 'opacity-0',
              selected.has(photo.id) && 'scale-[.9] rounded-md',
            ]"
            :src="photo.thumbUrl"
            @load="loaded.add(photo.id)"
          />
          <span
            v-if="selectable"
            class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 to-transparent to-40% transition-opacity"
            :class="
              selecting || selected.has(photo.id)
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            "
          />
        </a>
        <button
          v-if="selectable"
          type="button"
          class="absolute top-1 left-1 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-opacity"
          :class="
            selecting || selected.has(photo.id)
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          "
          :aria-pressed="selected.has(photo.id)"
          :aria-label="`vybrat ${photo.originalFilename}`"
          @click="emit('toggle', photo, { range: $event.shiftKey })"
        >
          <span
            class="grid size-6 place-items-center rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,.4)]"
            :class="selected.has(photo.id) ? 'border-green bg-green' : 'bg-black/15'"
          >
            <svg
              v-if="selected.has(photo.id)"
              viewBox="0 0 16 16"
              class="size-3.5 text-white"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3.5 8.5 L6.5 11.5 L12.5 5" />
            </svg>
          </span>
        </button>
        <span
          v-if="photo.id === coverId"
          class="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-paper/90 px-2 pt-[3px] pb-1 font-hand text-[16px] leading-none font-bold text-ink"
        >
          titulní
        </span>
      </div>
    </div>
  </div>
</template>
