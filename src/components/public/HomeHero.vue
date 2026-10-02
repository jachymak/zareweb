<script setup>
import { computed } from 'vue'
import colour1000 from '@/assets/public/skaly-barevne-1000.webp'
import colour1600 from '@/assets/public/skaly-barevne-1600.webp'
import colour2200 from '@/assets/public/skaly-barevne-2200.webp'
import grey1000 from '@/assets/public/skaly-sede-1000.webp'
import grey1600 from '@/assets/public/skaly-sede-1600.webp'
import grey2200 from '@/assets/public/skaly-sede-2200.webp'

// Home page opening: the scout cry and the drawing of the rocks the trail sets
// off from. `size`, `layout` and `palette` are design variants under trial
// (DrawingPicker); the drawing (open space above the rocks) is never cropped.
const props = defineProps({
  // 'narrow' (960 px) | 'text' (the text column) | 'bleed' (edge to edge, ≤ 1600 px)
  size: { type: String, default: 'narrow' },
  // 'above' | 'sky' (in the sky, centred) | 'sky-right' (in the sky right of the
  // rocks) | 'split' (first line in the sky, second below the drawing)
  layout: { type: String, default: 'sky-right' },
  // 'colour' | 'grey' — the same drawing in colour or in pencil grey
  palette: { type: String, default: 'colour' },
})

const DRAWINGS = {
  colour: [colour1000, colour1600, colour2200],
  grey: [grey1000, grey1600, grey2200],
}
const rocks = computed(() => DRAWINGS[props.palette] ?? DRAWINGS.colour)

const sizes = computed(
  () =>
    ({
      narrow: '(min-width: 1024px) 960px, 100vw',
      text: '(min-width: 1120px) 1072px, 100vw',
      bleed: '(min-width: 1600px) 1600px, 100vw',
    })[props.size],
)

const HAND = 'm-0 font-hand leading-[1.1] font-semibold text-ink'
// Above the drawing on mobile, over its empty top from md up.
const IN_SKY =
  'order-first mb-2 text-[30px] sm:text-[44px] md:absolute md:top-[3%] md:mb-0 lg:text-[60px]'
const headline = computed(
  () =>
    ({
      above:
        'mx-auto mb-4 max-w-[24ch] text-center text-balance text-[36px] sm:text-[48px] lg:text-[60px]',
      sky: `${IN_SKY} inset-x-0 text-center`,
      'sky-right': `${IN_SKY} inset-x-0 text-center md:right-[6%] md:left-auto md:text-right`,
      split: `${IN_SKY} left-[4%] md:left-[3%]`,
    })[props.layout],
)
</script>

<template>
  <section id="uvod" data-section class="pt-6 md:pt-10 md:pb-8">
    <div
      class="relative flex flex-col md:block"
      :class="{ 'mx-auto max-w-[960px]': size === 'narrow' }"
    >
      <h2 v-if="layout === 'above'" :class="[HAND, headline]">
        Přes louky, lesy, skály šedé, společná nás cesta vede
      </h2>

      <!-- The trail sets off from the foot of the rocks (data-trail-x/y). -->
      <div
        data-trail-start
        data-trail-x="0.4"
        data-trail-y="0.93"
        :class="{ 'relative left-1/2 w-screen max-w-[1600px] -translate-x-1/2': size === 'bleed' }"
      >
        <img
          :src="rocks[0]"
          :srcset="`${rocks[0]} 1000w, ${rocks[1]} 1600w, ${rocks[2]} 2200w`"
          :sizes="sizes"
          alt="Kresba pískovcových skal nad krajinou"
          width="2500"
          height="850"
          class="block [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent),linear-gradient(transparent,#000_8%,#000_88%,transparent)] h-auto w-full"
        />
      </div>

      <h2 v-if="layout !== 'above'" :class="[HAND, headline]">
        <span :class="layout === 'split' ? 'block' : 'sm:block'"
          >Přes louky, lesy, skály šedé,</span
        >
        <template v-if="layout !== 'split'">
          {{ ' ' }}
          <span class="sm:block">společná nás cesta vede</span>
        </template>
      </h2>
    </div>

    <p
      v-if="layout === 'split'"
      class="mt-1 text-right text-[28px] sm:text-[44px] md:-mt-4 lg:text-[60px]"
      :class="[HAND, { 'mx-auto max-w-[960px]': size === 'narrow' }]"
    >
      společná nás cesta vede
    </p>
  </section>
</template>
