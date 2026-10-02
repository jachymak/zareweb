<script setup>
// Home page ending, the counterpart of HomeHero: the second half of the scout
// cry beside the Dejvice drawing, where the trail (TrailPath) ends —
// at `trailEnd` (fractions of the drawing).
defineProps({
  sketch: { type: String, required: true },
  srcset: { type: String, default: undefined },
  trailEnd: { type: Object, required: true }, // { x, y }
})
</script>

<template>
  <section id="cil" data-section class="pt-14 md:pt-[136px] md:pb-4">
    <div
      class="mx-auto flex max-w-[960px] flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12"
    >
      <!-- In the same hand as the cry's first half in HomeHero; below the
           drawing on mobile. -->
      <h2
        class="order-last m-0 text-center font-hand text-[30px] leading-[1.1] font-semibold text-ink sm:text-[44px] md:text-left lg:text-[56px]"
      >
        <span class="block">hory, města, vesnice,</span>
        <span class="block">pozná Záře Dejvice!</span>
      </h2>
      <div data-stop class="w-[260px] flex-none sm:w-[300px] lg:w-[360px]">
        <img
          data-trail-end
          :data-trail-x="trailEnd.x"
          :data-trail-y="trailEnd.y"
          :src="sketch"
          :srcset="srcset"
          sizes="(min-width: 1024px) 360px, 300px"
          alt="Kresba Dejvic s Pražským hradem v dálce"
          width="800"
          height="924"
          class="drawing block h-auto w-full"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Fade the drawing's edges into the paper, like the hero rocks. */
.drawing {
  mask-image:
    linear-gradient(to right, transparent, #000 6%, #000 94%, transparent),
    linear-gradient(transparent, #000 6%, #000 94%, transparent);
  mask-composite: intersect;
}
</style>
