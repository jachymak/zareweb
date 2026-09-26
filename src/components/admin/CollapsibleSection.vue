<script setup>
import { useId } from 'vue'

// One settings block in Administration: a narrow full-width bar (title +
// short summary) that opens into the block. The content stays mounted while
// closed, so unsaved edits survive collapsing.
defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: '' }, // shown in the bar
  tag: { type: String, default: 'section' }, // e.g. 'form' for a block that is one form
})
const open = defineModel('open', { type: Boolean, default: false })
const id = useId()
</script>

<template>
  <component
    :is="tag"
    class="m-0 rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper"
    :aria-labelledby="`${id}-title`"
  >
    <h3 class="m-0">
      <button
        :id="`${id}-title`"
        type="button"
        :aria-expanded="open"
        :aria-controls="`${id}-body`"
        class="flex w-full cursor-pointer items-center gap-x-3 border-0 bg-transparent px-4 py-3 text-left sm:px-[18px]"
        @click="open = !open"
      >
        <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span class="text-[17px] font-semibold text-ink">{{ title }}</span>
          <span
            v-if="summary"
            class="min-w-0 basis-full truncate text-[14.5px] font-normal text-muted-2 sm:basis-auto"
            data-testid="summary"
            >{{ summary }}</span
          >
        </span>
        <svg
          viewBox="0 0 24 24"
          class="size-5 flex-none text-brown transition-transform"
          :class="open ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </h3>
    <div
      v-show="open"
      :id="`${id}-body`"
      class="border-t border-[#ece4d0] px-4 pt-3 pb-4 sm:px-[18px]"
    >
      <slot />
    </div>
  </component>
</template>
