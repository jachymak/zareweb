<script setup>
import { ref, useId } from 'vue'

// Accordion with at most one item open at a time.
defineProps({
  items: { type: Array, required: true }, // [{ q, a }]
})

const openIndex = ref(0)
const baseId = useId()

function toggle(i) {
  openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<template>
  <div class="border-t border-line-soft">
    <div v-for="(item, i) in items" :key="item.q" class="border-b border-line-soft">
      <h4 class="m-0">
        <button
          type="button"
          :id="`${baseId}-q${i}`"
          :aria-expanded="openIndex === i"
          :aria-controls="`${baseId}-a${i}`"
          class="flex w-full cursor-pointer items-baseline gap-4 bg-transparent px-0.5 py-[18px] text-left text-[17px] leading-snug font-medium text-ink sm:text-lg"
          @click="toggle(i)"
        >
          <span class="flex-1">{{ item.q }}</span>
          <span class="flex-none font-hand text-[26px] leading-none text-red" aria-hidden="true">
            {{ openIndex === i ? '–' : '+' }}
          </span>
        </button>
      </h4>
      <div
        v-show="openIndex === i"
        :id="`${baseId}-a${i}`"
        role="region"
        :aria-labelledby="`${baseId}-q${i}`"
      >
        <p
          class="m-0 max-w-[62ch] px-0.5 pb-5 text-base leading-[1.75] text-pretty text-muted sm:text-[17px]"
        >
          {{ item.a }}
        </p>
      </div>
    </div>
  </div>
</template>
