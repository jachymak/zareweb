<script setup>
import TrailConnector from './TrailConnector.vue'

// One stop on the illustrated trail: text on one side, a sketch on the other.
// On mobile the sketch goes below the text, aligned to the same side, and a
// short trail connector links them (design study variant M2).
const props = defineProps({
  id: { type: String, default: undefined },
  kicker: { type: String, default: '' },
  title: { type: String, default: '' },
  sketch: { type: String, required: true },
  sketchSide: { type: String, default: 'right' }, // 'left' | 'right' (desktop)
})

const textSide = props.sketchSide === 'left' ? 'right' : 'left'
</script>

<template>
  <section
    :id="id"
    data-section
    class="flex flex-col md:flex-row md:items-stretch md:gap-x-[46px] md:py-11"
    :class="{ 'md:flex-row-reverse': sketchSide === 'left' }"
  >
    <div
      class="min-w-0 md:flex-[1_1_400px] md:py-2.5"
      :class="textSide === 'right' ? 'text-right' : 'text-left'"
    >
      <p v-if="kicker" class="kicker mb-2">{{ kicker }}</p>
      <h3 v-if="title" class="section-title mb-4">{{ title }}</h3>
      <slot />
    </div>

    <TrailConnector :from="textSide" :to="textSide" class="md:hidden" />

    <div
      data-stop
      class="relative flex min-w-0 md:min-h-80 md:flex-[1_1_260px] md:py-2.5"
      :class="textSide === 'right' ? 'justify-end' : 'justify-start'"
    >
      <img
        :src="sketch"
        alt=""
        width="260"
        height="300"
        class="block h-auto w-[200px] sm:w-[240px] md:absolute md:inset-0 md:size-full md:object-contain"
      />
    </div>
  </section>
</template>
