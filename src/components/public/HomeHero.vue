<script setup>
import { computed } from 'vue'
import rocks1000 from '@/assets/public/skaly-1000.webp'
import rocks1600 from '@/assets/public/skaly-1600.webp'

// Home page opening: the scout cry and the drawing of the rocks the trail sets
// off from. `size` and `layout` are design variants under trial (DrawingPicker);
// the drawing is never cropped on desktop (5:1).
const props = defineProps({
  // 'narrow' (960 px) | 'text' (the text column) | 'bleed' (edge to edge, ≤ 1600 px)
  size: { type: String, default: 'narrow' },
  // 'above' | 'overlap' (dips into the sky) | 'sky' (in the sky right of the rocks,
  // desktop; like 'overlap' on mobile) | 'split' (one line above, one below)
  layout: { type: String, default: 'above' },
})

const frame = computed(
  () =>
    ({
      narrow: 'mx-auto max-w-[960px]',
      text: '',
      bleed: 'relative left-1/2 w-screen max-w-[1600px] -translate-x-1/2',
    })[props.size],
)
const sizes = computed(
  () =>
    ({
      narrow: '(min-width: 1024px) 960px, 100vw',
      text: '(min-width: 1120px) 1072px, 100vw',
      bleed: '(min-width: 1600px) 1600px, 100vw',
    })[props.size],
)
</script>

<template>
  <section
    id="uvod"
    data-section
    class="relative pt-8 md:pt-12 md:pb-8"
    :class="layout === 'split' ? '' : 'text-center'"
  >
    <h2
      class="relative z-[1] m-0 font-hand text-[36px] leading-[1.1] font-semibold text-ink sm:text-[48px] lg:text-[60px]"
      :class="{
        'mx-auto max-w-[24ch] text-balance': layout === 'above',
        'mx-auto -mb-7 max-w-[24ch] text-balance sm:-mb-10 md:-mb-12': layout === 'overlap',
        'mx-auto -mb-7 max-w-[24ch] text-balance sm:-mb-10 md:absolute md:right-[3%] md:mx-0 md:mb-0 md:max-w-none md:text-right':
          layout === 'sky',
      }"
    >
      <span v-if="layout === 'split'" class="block text-balance"
        >Přes louky, lesy, skály šedé,</span
      >
      <template v-else-if="layout === 'sky'">
        <span class="md:block">Přes louky, lesy, skály šedé,</span>
        {{ ' ' }}
        <span class="md:block">společná nás cesta vede</span>
      </template>
      <template v-else>Přes louky, lesy, skály šedé, společná nás cesta vede</template>
    </h2>

    <!-- The trail sets off from the foot of the rocks (data-trail-x/y). -->
    <div
      data-trail-start
      data-trail-x="0.4"
      data-trail-y="0.93"
      :class="[frame, layout === 'sky' ? 'mt-4 md:mt-[70px] lg:mt-[80px]' : 'mt-4']"
    >
      <img
        :src="rocks1000"
        :srcset="`${rocks1000} 1000w, ${rocks1600} 1600w`"
        :sizes="sizes"
        alt="Kresba pískovcových skal nad krajinou"
        width="2500"
        height="500"
        class="block [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent),linear-gradient(transparent,#000_12%,#000_85%,transparent)] aspect-[5/2] h-auto w-full object-cover object-[30%_50%] md:aspect-[5/1]"
      />
    </div>

    <p
      v-if="layout === 'split'"
      class="relative z-[1] m-0 -mt-4 text-right font-hand text-[36px] leading-[1.1] font-semibold text-balance text-ink sm:text-[48px] md:-mt-8 lg:text-[60px]"
    >
      společná nás cesta vede
    </p>
  </section>
</template>
