<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { SHRINK_ABOVE_BYTES, SHRUNK_EDGE } from '@shared/photos'
import { plural } from '@/components/parent/parentText'

// Asks what to do with photos over 7 MB before uploading (SPEC §4.9):
// shrink them in the browser, upload them in full, or cancel the batch.
const props = defineProps({
  count: { type: Number, required: true },
  bytes: { type: Number, required: true },
})
const emit = defineEmits(['decide']) // 'shrink' | 'full' | 'cancel'

const mb = (bytes) => Math.round(bytes / 1024 / 1024)
const title = computed(() => {
  const n = props.count
  if (n === 1) return 'Jedna fotka je zbytečně velká'
  return `${n} ${plural(n, 'fotka je zbytečně velká', 'fotky jsou zbytečně velké', 'fotek je zbytečně velkých')}`
})

// Modal: focus inside, Escape cancels, the page behind doesn't scroll.
const dialog = ref(null)
const onKey = (e) => e.key === 'Escape' && emit('decide', 'cancel')
onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  dialog.value?.focus()
})
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/42 px-4 py-[8vh]"
  >
    <div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="big-photos-title"
      tabindex="-1"
      class="w-full max-w-[560px] rounded-[20px] bg-cream px-[clamp(18px,4vw,30px)] pt-6 pb-[26px] shadow-[0_24px_60px_rgba(34,48,31,.3)] outline-none"
      data-testid="big-photos"
    >
      <p class="m-0 -mb-0.5 font-hand text-[23px] text-red">velké fotky</p>
      <h2
        id="big-photos-title"
        class="m-0 text-[26px] leading-tight font-medium tracking-[-0.6px] text-ink"
      >
        {{ title }}
      </h2>
      <p class="m-0 mt-3 text-[16px] leading-[1.6] text-ink">
        {{ count === 1 ? 'Má' : 'Mají' }} přes {{ mb(SHRINK_ABOVE_BYTES) }} MB{{
          count === 1 ? '' : ` (dohromady ${mb(bytes)} MB)`
        }}. Když {{ count === 1 ? 'ji' : 'je' }} zmenším na {{ SHRUNK_EDGE }} px, nahraje se to
        několikrát rychleji a pořád to stačí i na tisk fotky velikosti A4. Datum pořízení zůstane.
      </p>

      <div class="mt-[22px] flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" class="btn-primary px-6 py-3" @click="emit('decide', 'shrink')">
          zmenšit a nahrát
        </button>
        <button type="button" class="btn-outline py-2.5" @click="emit('decide', 'full')">
          nahrát v plné velikosti
        </button>
      </div>
      <div class="mt-4 border-t-[1.5px] border-dashed border-line-soft pt-3">
        <button type="button" class="btn-link" @click="emit('decide', 'cancel')">
          zrušit, zmenším si {{ count === 1 ? 'ji' : 'je' }} sám
        </button>
        <p class="m-0 mt-0.5 text-[14px] leading-[1.55] text-muted-2">
          Třeba exportem z aplikace Fotky, stačí delší strana kolem {{ SHRUNK_EDGE }} px.
        </p>
      </div>
    </div>
  </div>
</template>
