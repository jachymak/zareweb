<script setup>
import { nextTick, ref, useId } from 'vue'

// Accordion with exactly one item open at a time. From md up the open answer is
// as tall as the longest one, so switching questions does not make the page
// jump; on mobile answers keep their own height.
defineProps({
  items: { type: Array, required: true }, // [{ q, a }]
})

const openIndex = ref(0)
const baseId = useId()

// Keeps the clicked question where it was on screen when a longer answer above
// it closes (mobile). From md up the page stays still and the answer simply
// moves under the question; scrolling there would jump the whole page.
async function open(i, event) {
  const button = event.currentTarget
  const top = button.getBoundingClientRect().top
  openIndex.value = i
  if (!window.matchMedia('(width < 48rem)').matches) return
  await nextTick()
  window.scrollBy({ top: button.getBoundingClientRect().top - top, behavior: 'instant' })
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
          @click="open(i, $event)"
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
        <!-- All answers share one grid cell; the others only reserve height
             (not on mobile). -->
        <div class="grid">
          <p
            v-for="(other, j) in items"
            :key="other.q"
            :aria-hidden="j !== i || undefined"
            :class="{ 'invisible max-md:hidden': j !== i }"
            class="col-start-1 row-start-1 m-0 max-w-[62ch] px-0.5 pb-5 text-base leading-[1.75] text-pretty text-muted sm:text-[17px]"
          >
            {{ other.a }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
