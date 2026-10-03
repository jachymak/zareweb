<script setup>
// Handwritten kicker + section title; the slot holds controls on the right.
// A foldable section (leader home) is a row between lines with „zobrazit ↓ /
// skrýt ↑“; folded, the whole row opens it. The controls show once it is open.
defineProps({
  id: { type: String, required: true }, // for aria-labelledby of the section
  kicker: { type: String, required: true },
  title: { type: String, required: true },
  foldable: { type: Boolean, default: false },
})
const open = defineModel('open', { type: Boolean, default: true })
</script>

<template>
  <div
    class="flex flex-wrap items-end gap-x-[18px] gap-y-2.5"
    :class="[
      foldable ? 'border-t-[1.5px] border-line-soft py-3.5' : '',
      foldable && !open ? 'cursor-pointer' : 'mb-4',
    ]"
    @click="foldable && !open && (open = true)"
  >
    <div class="mr-auto">
      <p class="kicker m-0 -mb-0.5">{{ kicker }}</p>
      <h2 :id="id" class="m-0 text-[27px] font-medium tracking-[-0.03em] text-ink">
        {{ title }}
      </h2>
    </div>
    <slot v-if="open" />
    <button
      v-if="foldable"
      type="button"
      :aria-expanded="open"
      class="cursor-pointer border-0 bg-transparent px-0 py-1 font-hand text-[20px] font-bold text-green hover:text-red"
      @click.stop="open = !open"
    >
      {{ open ? 'skrýt ↑' : 'zobrazit ↓' }}
    </button>
  </div>
</template>
