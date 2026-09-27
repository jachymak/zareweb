<script setup>
import { ref } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { albumDetail } from './photosText'

// Album as a slightly tilted polaroid (design `_Zare - pro cleny`, „Fotky“):
// cover, handwritten title, „březen · 31 fotek“. The slot adds status chips.
defineProps({
  album: { type: Object, required: true },
  to: { type: [String, Object], required: true },
  tilt: { type: Number, default: 0 },
  thisYear: { type: Number, required: true },
  showAudience: { type: Boolean, default: true },
})
const loaded = ref(false)
</script>

<template>
  <RouterLink
    :to="to"
    class="block bg-paper px-2 pt-2 pb-1.5 text-inherit no-underline shadow-[0_8px_18px_rgba(34,48,31,.11)] transition-transform hover:-translate-y-0.5 hover:text-inherit"
    :style="{ rotate: `${tilt}deg` }"
    data-testid="album-card"
  >
    <span
      class="relative block aspect-[4/3] w-full overflow-hidden bg-sand"
      :style="album.coverColor && { backgroundColor: album.coverColor }"
    >
      <img
        v-if="album.coverUrl"
        alt=""
        loading="lazy"
        class="absolute inset-0 size-full object-cover transition-opacity duration-300"
        :class="loaded ? 'opacity-100' : 'opacity-0'"
        :src="album.coverUrl"
        @load="loaded = true"
      />
      <span v-else class="absolute inset-0 grid place-items-center" aria-hidden="true">
        <svg
          viewBox="0 0 48 40"
          class="w-10 text-line-strong"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        >
          <path d="M4 12 H14 L18 6 H30 L34 12 H44 V36 H4 Z" />
          <circle cx="24" cy="23" r="8" />
        </svg>
      </span>
      <AudienceTag
        v-if="showAudience"
        :audience="album.audience"
        class="absolute top-1.5 right-1.5 shadow-[0_1px_3px_rgba(0,0,0,.2)]"
      />
    </span>
    <span class="mx-0.5 mt-2 block font-hand text-[20px] leading-[1.15] font-bold text-ink">
      {{ album.title }}
    </span>
    <span class="mx-0.5 block text-[13.5px] text-muted-2">{{ albumDetail(album, thisYear) }}</span>
    <slot />
  </RouterLink>
</template>
