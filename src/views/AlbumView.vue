<script setup>
import { computed, ref, watch } from 'vue'
import { useMemberPage } from '@/composables/useMemberPage'
import { usePhotoLightbox } from '@/composables/usePhotoLightbox'
import { getAlbum, listPhotos } from '@/services/photos'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import PreviewBar from '@/components/parent/PreviewBar.vue'
import PhotoGallery from '@/components/photos/PhotoGallery.vue'
import { albumDates, photoCount, photoGroups } from '@/components/photos/photosText'
import { LOAD_ERROR } from '@/components/parent/parentText'

// An album — SPEC §3.3: photos by day in a justified grid, the lightbox with
// the original download. Parents see published albums and processed photos.
const props = defineProps({
  albumId: { type: String, required: true },
})
const { previewOf, isLeader, keep } = useMemberPage()

// loading | ready | notFound | error
const status = ref('loading')
const album = ref(null)
const photos = ref([])

async function load(albumId) {
  status.value = 'loading'
  try {
    // Parents may not read unpublished albums at all.
    album.value = await getAlbum(albumId).catch((e) => {
      if (e.code === 'permission-denied') return null
      throw e
    })
    if (!album.value || (!album.value.published && !isLeader.value)) {
      return (status.value = 'notFound')
    }
    photos.value = await listPhotos(albumId, { readyOnly: true })
    status.value = 'ready'
  } catch (e) {
    console.error('Loading the album failed', e)
    status.value = 'error'
  }
}
watch(() => props.albumId, load, { immediate: true })

const groups = computed(() => (album.value ? photoGroups(photos.value, album.value) : []))
const ordered = computed(() => groups.value.flatMap((g) => g.photos))
const lightbox = usePhotoLightbox(ordered)

const section = 'mx-auto max-w-[1400px] px-4 sm:px-6'
</script>

<template>
  <PreviewBar v-if="previewOf" :model-value="previewOf" />
  <LeaderHeader v-if="isLeader" />
  <AreaHeader v-else area="pro členy" />
  <main>
    <p :class="section" class="m-0 pt-6 text-[15px]">
      <RouterLink :to="{ name: 'albums', query: keep }" class="inline-block py-1">
        ← všechna alba
      </RouterLink>
    </p>

    <p v-if="status === 'loading'" :class="section" class="pt-8 font-hand text-2xl text-muted">
      načítám…
    </p>
    <p v-else-if="status === 'error'" role="alert" :class="section" class="pt-8 text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else-if="status === 'notFound'" :class="section" class="pt-8">
      <h1 class="m-0 mb-2 text-[28px] font-medium tracking-[-0.03em] text-ink">
        Tohle album jsme nenašli
      </h1>
      <p class="m-0 font-hand text-[24px] text-muted">
        možná ho vedoucí mezitím smazali nebo ještě není zveřejněné
      </p>
    </div>

    <template v-else>
      <div :class="section" class="pt-2 pb-5">
        <p class="kicker m-0 -mb-0.5">{{ albumDates(album) }}</p>
        <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
          {{ album.title }}
        </h1>
        <p class="m-0 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
          <AudienceTag :audience="album.audience" />
          <span>{{ photoCount(photos.length) }}</span>
          <span class="text-[14px] text-muted-2">
            kliknutím fotku zvětšíte, originál stáhnete tlačítkem nahoře
          </span>
          <RouterLink
            v-if="isLeader"
            :to="{ name: 'leader-album', params: { albumId } }"
            class="py-1 sm:ml-auto"
          >
            spravovat album →
          </RouterLink>
        </p>
      </div>
      <div class="mx-auto max-w-[1400px] px-1 sm:px-6">
        <p v-if="!photos.length" class="m-0 px-3 text-[16px] text-muted sm:px-0">
          V albu zatím nejsou žádné fotky.
        </p>
        <PhotoGallery v-else :groups="groups" @open="lightbox.open" />
      </div>
    </template>
  </main>
  <AreaFooter />
</template>
