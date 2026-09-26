<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ZareLogo from '@/components/ZareLogo.vue'

// Header of the leader area (no menu — pages are reached from the leader home):
// home link, parent preview, e-mail, sign out.

const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="top-0 z-30 bg-cream/95 backdrop-blur-sm sm:sticky">
    <div class="h-[5px] bg-green" />
    <div
      class="mx-auto flex max-w-[1000px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-5 sm:px-6"
    >
      <RouterLink to="/vedouci" class="flex items-center gap-2.5 text-ink no-underline">
        <ZareLogo class="w-9" />
        <span class="font-hand text-[23px] leading-tight font-bold sm:text-[24px]">
          Skautský oddíl Záře
        </span>
      </RouterLink>
      <span
        class="rounded-full bg-green px-3 pt-[5px] pb-1.5 font-hand text-[19px] leading-none font-bold text-cream"
      >
        pro vedoucí
      </span>
      <div class="flex flex-wrap items-center gap-x-3.5 gap-y-1 sm:ml-auto">
        <RouterLink
          to="/vedouci/nahled"
          class="border-b-2 border-gold py-1 font-hand text-[20px] leading-tight font-bold text-ink no-underline"
        >
          náhled pro rodiče
        </RouterLink>
        <span
          class="hidden min-w-0 border-l border-line-soft pl-3.5 text-[14.5px] break-all text-[#8a7b5e] sm:inline"
        >
          {{ auth.user?.email }}
        </span>
        <button
          type="button"
          class="cursor-pointer border-0 bg-transparent px-0 py-1 font-hand text-[19px] font-bold text-red"
          @click="signOut"
        >
          odhlásit
        </button>
      </div>
    </div>
    <svg
      viewBox="0 0 1000 8"
      preserveAspectRatio="none"
      class="block h-2 w-full"
      fill="none"
      stroke="var(--color-line-soft)"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M0 5 C180 1 320 8 520 4 C700 1 860 7 1000 3" vector-effect="non-scaling-stroke" />
    </svg>
  </header>
</template>
