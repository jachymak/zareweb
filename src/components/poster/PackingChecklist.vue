<script setup>
import { ref, watch } from 'vue'

// „sbaleno?“ — ticking is only for the parent: kept in this browser, never sent.
const props = defineProps({
  eventId: { type: String, required: true },
  items: { type: Array, required: true },
})

const storageKey = `zare:sbaleno:${props.eventId}`

function load() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? []
  } catch {
    return []
  }
}

const packed = ref(new Set(load()))

watch(packed, (set) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...set]))
  } catch {
    // Storage unavailable (private mode) — ticking still works on the page.
  }
})

function toggle(item) {
  const next = new Set(packed.value)
  next.has(item) ? next.delete(item) : next.add(item)
  packed.value = next
}
</script>

<template>
  <section aria-labelledby="packing-title">
    <h2 id="packing-title" class="m-0 mb-3 font-hand text-[24px] font-bold text-ink">sbaleno?</h2>
    <ul class="m-0 flex list-none flex-col gap-1 p-0">
      <li v-for="item in items" :key="item">
        <button
          type="button"
          role="checkbox"
          :aria-checked="packed.has(item)"
          class="flex min-h-10 w-full cursor-pointer items-center gap-3.5 border-0 bg-transparent p-0 text-left font-sans"
          @click="toggle(item)"
        >
          <span
            class="grid size-[26px] flex-none place-items-center rounded-[5px] border-2 bg-white font-hand text-[22px] leading-none font-bold text-[#1f5138]"
            :class="packed.has(item) ? 'border-green' : 'border-[#c9bfa6]'"
            aria-hidden="true"
          >
            {{ packed.has(item) ? '✓' : '' }}
          </span>
          <span class="text-[20px] text-ink" :class="packed.has(item) && 'text-muted line-through'">
            {{ item }}
          </span>
        </button>
      </li>
    </ul>
    <p class="m-0 mt-[18px] font-hand text-[19px] text-brown">
      odškrtávátko je jen pro vás, nikam se neposílá
    </p>
  </section>
</template>
