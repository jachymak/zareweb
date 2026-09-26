<script setup>
import { formatWhen } from './clubhouseText'

// A list of timed lines — upcoming schedule („Podle rozvrhu“) or history („Log“).
// The slot is the note under the list.
defineProps({
  id: { type: String, required: true },
  kicker: { type: String, required: true },
  title: { type: String, required: true },
  items: { type: Array, required: true }, // [{ at, until?, text }]
  now: { type: Number, required: true },
  history: { type: Boolean, default: false }, // red, narrower times
})
</script>

<template>
  <section :aria-labelledby="id" class="min-w-0">
    <p class="kicker m-0 -mb-0.5">{{ kicker }}</p>
    <h2 :id="id" class="m-0 mb-3.5 text-[26px] font-medium tracking-[-0.03em] text-ink">
      {{ title }}
    </h2>
    <ul class="m-0 list-none border-b border-[#e4d9be] p-0">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="flex items-baseline gap-3 border-t border-[#e4d9be]"
        :class="history ? 'py-[9px]' : 'py-2.5'"
      >
        <span
          class="flex-none font-hand leading-tight font-bold"
          :class="
            history ? 'min-w-[86px] text-[19px] text-red' : 'min-w-[92px] text-[20px] text-ink'
          "
        >
          {{ formatWhen(item, now) }}
        </span>
        <span
          class="flex-1 leading-[1.45] text-[#4b5749]"
          :class="history ? 'text-[15px]' : 'text-[15.5px]'"
        >
          {{ item.text }}
        </span>
      </li>
    </ul>
    <p class="m-0 mt-3 text-[14.5px] text-brown">
      <slot />
    </p>
  </section>
</template>
