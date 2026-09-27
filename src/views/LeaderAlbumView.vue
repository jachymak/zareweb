<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { pragueToday, schoolYearStart } from '@shared/schoolYear'
import { usePhotoLightbox } from '@/composables/usePhotoLightbox'
import { usePhotoUpload } from '@/composables/usePhotoUpload'
import { listEvents } from '@/services/events'
import {
  deleteAlbum,
  deletePhotos,
  setAlbumCover,
  subscribeAlbum,
  subscribePhotos,
  updateAlbum,
} from '@/services/photos'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import AlbumForm from '@/components/photos/AlbumForm.vue'
import PhotoGallery from '@/components/photos/PhotoGallery.vue'
import PhotoUploader from '@/components/photos/PhotoUploader.vue'
import SelectionBar from '@/components/photos/SelectionBar.vue'
import { albumDates, DELETE_ERROR, photoCount, photoGroups } from '@/components/photos/photosText'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// A leader's album — SPEC §4.9: upload photos, see them being processed,
// select to delete or set the cover, publish / hide, edit, delete the album.
const props = defineProps({
  albumId: { type: String, required: true },
})
const router = useRouter()
const today = pragueToday()

const loading = ref(true)
const loadError = ref(false)
const album = ref(null)
const photos = ref([])
const events = ref([])

const unsubscribe = []
onMounted(async () => {
  const failed = (e) => {
    console.error('Loading the album failed', e)
    loadError.value = true
    loading.value = false
  }
  unsubscribe.push(
    subscribeAlbum(
      props.albumId,
      (a) => {
        album.value = a
        loading.value = false
      },
      failed,
    ),
    subscribePhotos(props.albumId, (list) => (photos.value = list), failed),
  )
  try {
    const list = await listEvents({ fromDate: `${schoolYearStart(today) - 1}-09-01` })
    events.value = list.filter((e) => !e.cancelled && e.startDate <= today).reverse()
  } catch (e) {
    console.error('Loading the events failed', e)
  }
})
onUnmounted(() => unsubscribe.forEach((u) => u()))

const ready = computed(() => photos.value.filter((p) => p.status === 'ready'))
const failedPhotos = computed(() => photos.value.filter((p) => p.status === 'error'))
const groups = computed(() => (album.value ? photoGroups(ready.value, album.value) : []))
const ordered = computed(() => groups.value.flatMap((g) => g.photos))
const lightbox = usePhotoLightbox(ordered)

// ---- upload ----

const upload = usePhotoUpload(props.albumId)
const uploader = ref(null)
// Uploaded in this session but not processed yet by the Cloud Function.
const processing = computed(() => {
  const known = new Set(photos.value.map((p) => p.id))
  return [...upload.uploadedIds].filter((id) => !known.has(id)).length
})

const leaveWarning = 'Fotky se ještě nahrávají. Opravdu odejít? Nenahrané fotky se ztratí.'
function beforeUnload(e) {
  if (upload.busy) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => {
  if (!upload.busy) return true
  if (!window.confirm(leaveWarning)) return false
  upload.cancel()
})

// ---- selection ----

const selectMode = ref(false)
const selected = ref(new Set())
const selecting = computed(() => selectMode.value || selected.value.size > 0)
let lastToggled = null

function toggle(photo, { range } = {}) {
  const next = new Set(selected.value)
  const list = ordered.value
  const from = list.findIndex((p) => p.id === lastToggled)
  if (range && from >= 0) {
    const to = list.findIndex((p) => p.id === photo.id)
    const select = !next.has(photo.id)
    for (const p of list.slice(Math.min(from, to), Math.max(from, to) + 1)) {
      if (select) next.add(p.id)
      else next.delete(p.id)
    }
  } else if (next.has(photo.id)) next.delete(photo.id)
  else next.add(photo.id)
  lastToggled = photo.id
  selected.value = next
}
function toggleDay(dayPhotos, select) {
  const next = new Set(selected.value)
  dayPhotos.forEach((p) => (select ? next.add(p.id) : next.delete(p.id)))
  selected.value = next
}
function clearSelection() {
  selected.value = new Set()
  selectMode.value = false
}
// Photos deleted meanwhile drop out of the selection.
watch(photos, (list) => {
  const ids = new Set(list.map((p) => p.id))
  if ([...selected.value].some((id) => !ids.has(id))) {
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
  }
})

const deleting = ref(false)
const actionError = ref('')
async function removeSelected() {
  deleting.value = true
  actionError.value = ''
  try {
    await deletePhotos(props.albumId, [...selected.value])
    clearSelection()
  } catch (e) {
    console.error('Deleting photos failed', e)
    actionError.value = DELETE_ERROR
  } finally {
    deleting.value = false
  }
}
async function removeFailed(photo) {
  try {
    await deletePhotos(props.albumId, [photo.id])
  } catch (e) {
    console.error('Deleting the photo failed', e)
    albumError.value = DELETE_ERROR
  }
}
async function makeCover() {
  const photo = ready.value.find((p) => selected.value.has(p.id))
  actionError.value = ''
  try {
    await setAlbumCover(props.albumId, photo)
    clearSelection()
  } catch (e) {
    console.error('Setting the cover failed', e)
    actionError.value = SAVE_ERROR
  }
}

// ---- album ----

const editing = ref(false)
const publishing = ref(false)
const albumError = ref('')
async function togglePublished() {
  publishing.value = true
  albumError.value = ''
  try {
    await updateAlbum(props.albumId, { published: !album.value.published })
  } catch (e) {
    console.error('Publishing the album failed', e)
    albumError.value = SAVE_ERROR
  } finally {
    publishing.value = false
  }
}

const confirmDelete = ref(false)
const deletingAlbum = ref(false)
async function removeAlbum() {
  deletingAlbum.value = true
  albumError.value = ''
  try {
    upload.cancel()
    await deleteAlbum(props.albumId)
    router.replace({ name: 'leader-albums' })
  } catch (e) {
    console.error('Deleting the album failed', e)
    albumError.value = DELETE_ERROR
    deletingAlbum.value = false
  }
}

const section = 'mx-auto max-w-[1400px] px-4 sm:px-6'
const action =
  'cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[15px] font-medium whitespace-nowrap disabled:cursor-wait disabled:opacity-60'
</script>

<template>
  <LeaderHeader />
  <main :class="selected.size && 'pb-24'">
    <p :class="section" class="m-0 pt-6 text-[15px]">
      <RouterLink :to="{ name: 'leader-albums' }" class="inline-block py-1">
        ← všechna alba
      </RouterLink>
    </p>

    <p v-if="loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else-if="!album" :class="section" class="pt-8">
      <h1 class="m-0 text-[28px] font-medium tracking-[-0.03em] text-ink">
        Tohle album už neexistuje
      </h1>
    </div>

    <template v-else>
      <div :class="section" class="pt-2">
        <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div class="mr-auto min-w-0">
            <p class="kicker m-0 -mb-0.5">{{ albumDates(album) }}</p>
            <h1
              class="m-0 text-[28px] font-medium tracking-[-0.04em] break-words text-ink sm:text-[38px]"
            >
              {{ album.title }}
            </h1>
            <p
              class="m-0 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted"
            >
              <AudienceTag :audience="album.audience" />
              <span data-testid="album-count">{{ photoCount(album.photoCount) }}</span>
              <span
                class="rounded-full px-2.5 pt-0.5 pb-[3px] text-[13.5px] font-medium"
                :class="
                  album.published
                    ? 'bg-[#e9f1ea] text-[#1f5138]'
                    : 'border border-dashed border-line-strong text-brown'
                "
                data-testid="album-status"
              >
                {{ album.published ? 'zveřejněné — vidí ho rodiče' : 'skryté před rodiči' }}
              </span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-full border-0 bg-green px-5 py-2 font-hand text-[22px] leading-tight font-bold text-cream hover:bg-green-hover"
              @click="uploader.pick()"
            >
              + nahrát fotky
            </button>
            <button
              type="button"
              :class="action"
              class="border-ink bg-transparent text-ink"
              :disabled="publishing"
              @click="togglePublished"
            >
              {{ album.published ? 'skrýt před rodiči' : 'zveřejnit album' }}
            </button>
            <button
              type="button"
              :class="action"
              class="border-line-strong bg-paper text-ink"
              :aria-expanded="editing"
              @click="editing = !editing"
            >
              upravit
            </button>
          </div>
        </div>
        <p v-if="albumError" role="alert" class="m-0 mt-2 text-[14.5px] text-red">
          {{ albumError }}
        </p>
        <p v-if="!album.published && ready.length" class="note-warm mt-3 mb-0 max-w-[640px]">
          Rodiče album zatím nevidí. Až bude kompletní, zveřejni ho.
        </p>

        <div v-if="editing" class="mt-5 max-w-[860px]">
          <AlbumForm
            :album="album"
            :events="events"
            :today="today"
            @saved="editing = false"
            @cancel="editing = false"
          />
        </div>

        <PhotoUploader ref="uploader" :upload="upload" :big="!photos.length" class="mt-5" />

        <p
          v-if="processing"
          class="m-0 mt-3 flex items-center gap-2.5 text-[15px] text-muted"
          role="status"
          data-testid="processing"
        >
          <span
            class="size-4 animate-spin rounded-full border-2 border-line border-t-green"
            aria-hidden="true"
          />
          Zpracovávám {{ photoCount(processing) }} — objeví se tu samy.
        </p>

        <div
          v-if="failedPhotos.length"
          class="mt-4 rounded-[12px] border-[1.5px] border-[#e3b3a3] bg-red-light px-4 py-3"
          data-testid="failed-photos"
        >
          <p class="m-0 text-[15px] font-medium text-[#8a2f16]">
            {{ failedPhotos.length === 1 ? 'Tuhle fotku' : 'Tyhle fotky' }} se nepodařilo zpracovat
            — smaž je a zkus je nahrát znovu, případně je nejdřív ulož jako JPEG:
          </p>
          <ul class="m-0 mt-1.5 list-none p-0">
            <li
              v-for="p in failedPhotos"
              :key="p.id"
              class="flex flex-wrap items-center gap-x-3 border-t border-[#efc9bc] py-1.5 text-[14.5px]"
            >
              <span class="min-w-0 break-all text-ink">{{ p.originalFilename }}</span>
              <button
                type="button"
                class="btn-link ml-auto py-0 text-[14px]"
                @click="removeFailed(p)"
              >
                smazat
              </button>
            </li>
          </ul>
        </div>

        <div
          v-if="ready.length"
          class="mt-6 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14.5px] text-muted-2"
        >
          <span> Kliknutím fotku zvětšíš. Titulní fotku a mazání najdeš po výběru fotek. </span>
          <button
            type="button"
            class="btn-link py-0 sm:ml-auto"
            :aria-pressed="selecting"
            @click="selecting ? clearSelection() : (selectMode = true)"
          >
            {{ selecting ? 'hotovo' : 'vybrat fotky' }}
          </button>
        </div>
      </div>

      <div v-if="ready.length" class="mx-auto max-w-[1400px] px-1 sm:px-6">
        <PhotoGallery
          :groups="groups"
          selectable
          :selecting="selecting"
          :selected="selected"
          :cover-id="album.coverPhotoId"
          @open="lightbox.open"
          @toggle="toggle"
          @toggle-day="toggleDay"
        />
      </div>

      <div :class="section" class="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
        <RouterLink
          :to="{ name: 'album', params: { albumId } }"
          class="inline-block py-1 text-[15px]"
        >
          jak album vidí rodiče →
        </RouterLink>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 sm:ml-auto">
          <template v-if="!confirmDelete">
            <button type="button" class="btn-link text-red" @click="confirmDelete = true">
              smazat celé album
            </button>
          </template>
          <template v-else>
            <span class="text-[15px] text-ink">
              Smazat album včetně všech fotek? Nejde to vrátit.
            </span>
            <button
              type="button"
              :class="action"
              class="border-red bg-red text-cream"
              :disabled="deletingAlbum"
              @click="removeAlbum"
            >
              {{ deletingAlbum ? 'mažu…' : 'ano, smazat album' }}
            </button>
            <button type="button" class="btn-link" @click="confirmDelete = false">ne</button>
          </template>
        </div>
      </div>
    </template>

    <SelectionBar
      v-if="selected.size"
      :count="selected.size"
      :deleting="deleting"
      :error="actionError"
      @cover="makeCover"
      @delete="removeSelected"
      @clear="clearSelection"
    />
  </main>
  <AreaFooter>
    <p class="m-0 text-[14.5px] text-muted-2">vedoucovská část — vidí ji jen tým</p>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink :to="{ name: 'leader-albums' }" class="inline-block py-1">
        zpět na všechna alba →
      </RouterLink>
    </p>
  </AreaFooter>
</template>
