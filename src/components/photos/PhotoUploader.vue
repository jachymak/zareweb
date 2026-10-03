<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import BigPhotosDialog from './BigPhotosDialog.vue'
import { FILE_PROBLEMS, photoCount } from './photosText'

// Picking / dropping photos and the progress of the batch (usePhotoUpload).
// Files can be dropped anywhere on the page; `big` shows a large drop area
// (empty album).
const props = defineProps({
  upload: { type: Object, required: true }, // usePhotoUpload(…)
  big: { type: Boolean, default: false },
})

const input = ref(null)
const dragging = ref(false)
const ACCEPT = 'image/jpeg,image/png,image/webp' // iPhones then convert HEIC to JPEG themselves

function picked(event) {
  props.upload.add([...event.target.files])
  event.target.value = ''
}

// Page-wide drop target; `depth` counts nested dragenter / dragleave.
let depth = 0
const hasFiles = (e) => e.dataTransfer?.types?.includes('Files')
function onEnter(e) {
  if (!hasFiles(e)) return
  depth++
  dragging.value = true
}
function onLeave(e) {
  if (!hasFiles(e)) return
  depth = Math.max(0, depth - 1)
  if (!depth) dragging.value = false
}
function onOver(e) {
  if (hasFiles(e)) e.preventDefault()
}
function onDrop(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
  depth = 0
  dragging.value = false
  props.upload.add([...e.dataTransfer.files])
}
onMounted(() => {
  window.addEventListener('dragenter', onEnter)
  window.addEventListener('dragleave', onLeave)
  window.addEventListener('dragover', onOver)
  window.addEventListener('drop', onDrop)
})
onUnmounted(() => {
  window.removeEventListener('dragenter', onEnter)
  window.removeEventListener('dragleave', onLeave)
  window.removeEventListener('dragover', onOver)
  window.removeEventListener('drop', onDrop)
})

defineExpose({ pick: () => input.value.click() })
</script>

<template>
  <div>
    <input
      ref="input"
      type="file"
      multiple
      :accept="ACCEPT"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      data-testid="photo-input"
      @change="picked"
    />

    <button
      v-if="big && !upload.items.length"
      type="button"
      class="flex w-full cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 border-dashed border-line-strong bg-paper px-4 py-10 text-center transition-colors hover:border-green hover:bg-green-light"
      @click="input.click()"
    >
      <svg
        viewBox="0 0 48 40"
        class="w-12 text-brown"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12 H14 L18 6 H30 L34 12 H44 V36 H4 Z" />
        <circle cx="24" cy="23" r="8" />
      </svg>
      <span class="font-hand text-[26px] leading-tight font-bold text-ink">
        vyber fotky, nebo je sem přetáhni
      </span>
      <span class="text-[14px] text-muted-2">
        klidně celé album najednou · JPEG, PNG nebo WebP do 30 MB · fotky nad 7 MB ti nabídnu
        zmenšit
      </span>
    </button>

    <div
      v-if="upload.items.length"
      class="rounded-[12px] border-[1.5px] border-line bg-paper px-4 py-3.5"
      role="status"
      data-testid="upload-progress"
    >
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p class="m-0 text-[15.5px] font-medium text-ink">
          <template v-if="upload.busy">
            Nahrávám {{ upload.progress.done }} / {{ upload.progress.total }}
          </template>
          <template v-else-if="upload.progress.failed">
            Nahráno {{ upload.progress.done }} z {{ upload.progress.total }}
          </template>
          <template v-else>Hotovo — nahráno {{ photoCount(upload.progress.done) }}</template>
        </p>
        <span v-if="upload.busy" class="text-[14px] text-muted-2">
          {{ Math.round(upload.progress.fraction * 100) }} % · nezavírej stránku
        </span>
        <span class="ml-auto flex gap-3">
          <button v-if="upload.busy" type="button" class="btn-link py-0" @click="upload.cancel()">
            zastavit
          </button>
          <button v-else type="button" class="btn-link py-0" @click="upload.clear()">zavřít</button>
        </span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-sand">
        <div
          class="h-full rounded-full bg-green transition-[width] duration-300"
          :style="{ width: `${upload.progress.fraction * 100}%` }"
        />
      </div>
      <div v-if="upload.failedItems.length" class="mt-3">
        <p class="m-0 text-[14.5px] text-red">
          {{ upload.failedItems.length === 1 ? 'Tuhle fotku' : 'Tyhle fotky' }} se nepodařilo
          nahrát:
          {{ upload.failedItems.map((i) => i.name).join(', ') }}
        </p>
        <button
          type="button"
          class="mt-1.5 cursor-pointer rounded-full border-[1.5px] border-ink bg-transparent px-4 py-1.5 text-[14.5px] font-medium text-ink"
          @click="upload.retryFailed()"
        >
          zkusit znovu
        </button>
      </div>
    </div>

    <div v-if="upload.rejected.length" class="note-warm mt-3" role="alert">
      <p class="m-0 font-medium">
        {{ upload.rejected.length === 1 ? 'Tenhle soubor' : 'Tyhle soubory' }} jsem nenahrál:
      </p>
      <ul class="m-0 mt-1 list-none p-0">
        <li v-for="r in upload.rejected" :key="r.name" class="break-words">
          <strong class="font-medium">{{ r.name }}</strong> — {{ FILE_PROBLEMS[r.problem] }}
        </li>
      </ul>
    </div>

    <details class="group mt-3 text-[14.5px] text-muted" data-testid="order-help">
      <summary
        class="w-fit cursor-pointer list-none py-1 text-green underline decoration-[#9ec0a8] underline-offset-4 hover:text-red [&::-webkit-details-marker]:hidden"
      >
        Jak se fotky v albu řadí?
      </summary>
      <ul class="m-0 mt-1.5 max-w-[720px] list-disc space-y-1 pl-5 leading-[1.55]">
        <li>
          Podle <strong class="font-medium text-ink">data a času pořízení</strong>, které si fotka
          nese z telefonu nebo foťáku — takže fotky od více lidí se samy promíchají správně, i když
          je nahraješ najednou nebo postupně.
        </li>
        <li>
          Fotky <strong class="font-medium text-ink">bez data pořízení</strong> (často upravené
          fotky nebo stažené z WhatsAppu či Messengeru) jsou na konci, seřazené podle
          <strong class="font-medium text-ink">názvu souboru</strong>. Chceš-li vlastní pořadí,
          pojmenuj je před nahráním třeba 01.jpg, 02.jpg, 03.jpg…
        </li>
        <li>
          Pozor na foťák se špatně nastaveným časem — jeho fotky se zařadí jinam. Pomůže jen opravit
          datum v souborech před nahráním (např. v aplikaci Fotky).
        </li>
        <li>Přesouvat fotky v už nahraném albu zatím nejde.</li>
      </ul>
    </details>

    <Teleport to="body">
      <BigPhotosDialog
        v-if="upload.pending"
        :count="upload.big.count"
        :bytes="upload.big.bytes"
        @decide="upload.decideBig"
      />
      <div
        v-if="dragging"
        class="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-green/25 p-6 backdrop-blur-[2px]"
      >
        <p
          class="m-0 rounded-[14px] border-2 border-dashed border-green bg-paper px-8 py-6 font-hand text-[30px] font-bold text-ink shadow-lg"
        >
          pusť fotky sem
        </p>
      </div>
    </Teleport>
  </div>
</template>
