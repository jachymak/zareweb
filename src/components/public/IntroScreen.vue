<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ZareLogo from '@/components/ZareLogo.vue'
import leto1280 from '@/assets/public/intro-leto-1280.webp'
import leto1920 from '@/assets/public/intro-leto-1920.webp'
import leto2560 from '@/assets/public/intro-leto-2560.webp'
import podzim1280 from '@/assets/public/intro-podzim-1280.webp'
import podzim1920 from '@/assets/public/intro-podzim-1920.webp'
import podzim2280 from '@/assets/public/intro-podzim-2280.webp'

// Full-screen painting over the public home (SPEC §2.1). The page is already
// rendered underneath; „hurá na web“ zooms the painting away to reveal it.
const open = ref(true) // painting and text shown
const gone = ref(false) // the layer is removed once the painting has left
const loaded = ref(false)

// One painting per season, picked by the month; a season without its own
// painting shows the summer one.
const paintings = {
  leto: {
    srcset: `${leto1280} 1280w, ${leto1920} 1920w, ${leto2560} 2560w`,
    src: leto1920,
    look: 'contrast-[1.22]',
    shade: 'bg-[radial-gradient(ellipse_at_0%_100%,rgba(18,26,20,.72),rgba(18,26,20,0)_70%)]',
  },
  podzim: {
    srcset: `${podzim1280} 1280w, ${podzim1920} 1920w, ${podzim2280} 2280w`,
    src: podzim1920,
    // keep the church in view on a narrow screen
    look: 'contrast-[1.1] object-[70%_50%]',
    // the light meadow needs a darker corner behind the text
    shade: 'bg-[radial-gradient(ellipse_at_0%_100%,rgba(18,26,20,.84),rgba(18,26,20,0)_72%)]',
  },
}
// Months 0–11 → season: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn.
const SEASONS = ['zima', 'jaro', 'leto', 'podzim']
function season() {
  // In development `?obdobi=podzim` previews another season's painting.
  const forced = import.meta.env.DEV && new URLSearchParams(location.search).get('obdobi')
  if (forced) return forced
  return SEASONS[Math.floor(((new Date().getMonth() + 1) % 12) / 3)]
}
const painting = paintings[season()] ?? paintings.leto
// The image covers the screen, so on a tall screen it is wider than the viewport.
const sizes = 'max(100vw, 177vh)'

// The page underneath must not scroll while the intro covers it.
const lockScroll = (locked) => (document.documentElement.style.overflow = locked ? 'hidden' : '')
onMounted(() => {
  lockScroll(true)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  lockScroll(false)
  window.removeEventListener('keydown', onKey)
})

// Space or Enter does the same as the button.
function onKey(e) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
  e.preventDefault()
  enter()
}

function enter() {
  open.value = false
  lockScroll(false)
  window.removeEventListener('keydown', onKey)
}
</script>

<template>
  <div v-if="!gone" class="fixed inset-0 z-50 overflow-hidden">
    <Transition
      leave-active-class="transition-all duration-700 ease-in"
      leave-to-class="scale-110 -translate-y-10 opacity-0 motion-reduce:scale-100 motion-reduce:translate-y-0"
      @after-leave="gone = true"
    >
      <div v-if="open" class="absolute inset-0 bg-[#2b3a33]">
        <img
          :srcset="painting.srcset"
          :sizes="sizes"
          :src="painting.src"
          alt=""
          fetchpriority="high"
          class="absolute inset-0 size-full object-cover transition-opacity duration-500"
          :class="[painting.look, loaded ? 'opacity-100' : 'opacity-0']"
          @load="loaded = true"
        />
        <!-- darkening behind the text -->
        <div
          class="absolute bottom-0 left-0 h-[360px] w-[780px] max-w-[170vw]"
          :class="painting.shade"
        />
      </div>
    </Transition>

    <Transition
      leave-active-class="transition-all duration-500 ease-in"
      leave-to-class="scale-105 opacity-0 motion-reduce:scale-100"
    >
      <div
        v-if="open"
        class="absolute bottom-10 left-5 flex flex-col items-start gap-5 sm:bottom-[72px] sm:left-20 sm:gap-[22px]"
      >
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3 sm:gap-[15px]">
            <ZareLogo class="w-11 drop-shadow-[0_2px_8px_rgba(0,0,0,.45)] sm:w-[60px]" />
            <p
              class="m-0 font-hand text-[36px] leading-none font-bold text-paper [text-shadow:0_2px_14px_rgba(0,0,0,.45)] sm:text-[52px]"
            >
              Skautský oddíl Záře
            </p>
          </div>
          <svg
            viewBox="0 0 600 14"
            preserveAspectRatio="none"
            class="block h-3 w-0 min-w-full"
            aria-hidden="true"
          >
            <path
              d="M3 9 C 90 4, 180 11, 290 7 S 480 3, 597 8"
              fill="none"
              stroke="var(--color-gold)"
              stroke-width="3.5"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>

        <button
          type="button"
          class="relative flex cursor-pointer items-center gap-3 pt-3 pr-[26px] pb-3.5 pl-6 font-hand text-[26px] leading-none font-bold text-gray-900 transition-colors hover:text-red sm:text-[30px]"
          @click="enter"
        >
          <!-- marker highlight under the text -->
          <svg
            viewBox="0 0 200 42"
            preserveAspectRatio="none"
            class="absolute inset-0 block size-full overflow-visible"
            aria-hidden="true"
          >
            <path
              d="M4 10 C 60 4, 140 6, 196 8 L 194 34 C 130 38, 60 35, 6 36 Z"
              fill="var(--color-cream)"
              opacity=".95"
            />
          </svg>
          <span class="relative">hurá na web</span>
          <svg
            width="22"
            height="14"
            viewBox="0 0 26 16"
            class="relative"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 8 H22 M16 2 L23 8 L16 14" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>
