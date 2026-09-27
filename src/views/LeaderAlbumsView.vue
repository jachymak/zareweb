<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pragueToday, schoolYearStart } from '@shared/schoolYear'
import { listEvents } from '@/services/events'
import { subscribeAlbums } from '@/services/photos'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import AlbumCard from '@/components/photos/AlbumCard.vue'
import AlbumForm from '@/components/photos/AlbumForm.vue'
import { bySchoolYear } from '@/components/photos/photosText'
import { LOAD_ERROR } from '@/components/parent/parentText'

// Leaders' photos — SPEC §4.9: all albums incl. hidden ones, a new album
// (`?nove`). Uploading and editing happen on the album's page.
const route = useRoute()
const router = useRouter()
const today = pragueToday()
const thisYear = Number(today.slice(0, 4))

const loading = ref(true)
const loadError = ref(false)
const albums = ref([])
const events = ref([])

let unsubscribe = () => {}
onMounted(async () => {
  unsubscribe = subscribeAlbums(
    (list) => {
      albums.value = list
      loading.value = false
    },
    (e) => {
      console.error('Loading the albums failed', e)
      loadError.value = true
      loading.value = false
    },
  )
  try {
    // Events of this and the last school year that have started, newest first.
    const list = await listEvents({ fromDate: `${schoolYearStart(today) - 1}-09-01` })
    events.value = list.filter((e) => !e.cancelled && e.startDate <= today).reverse()
  } catch (e) {
    console.error('Loading the events failed', e)
  }
})
onUnmounted(() => unsubscribe())

const creating = computed(() => 'nove' in route.query)
const years = computed(() => bySchoolYear(albums.value))
const created = (albumId) => router.push({ name: 'leader-album', params: { albumId } })

const TILTS = [-1.6, 1.2, -0.8, 1.5, -1.2, 0.9]
const section = 'mx-auto max-w-[1120px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1">
          ← zpět na vedoucovskou stránku
        </RouterLink>
      </p>
      <div class="mb-5 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div class="mr-auto">
          <p class="kicker m-0 -mb-0.5">z akcí a výprav</p>
          <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
            Fotky
          </h1>
        </div>
        <RouterLink
          v-if="!creating"
          :to="{ query: { nove: null } }"
          class="rounded-full bg-green px-5 py-2 font-hand text-[22px] leading-tight font-bold text-cream no-underline hover:bg-green-hover hover:text-cream"
        >
          + nové album
        </RouterLink>
      </div>
    </div>

    <div v-if="creating" :class="section" class="mb-8">
      <AlbumForm :events="events" :today="today" @saved="created" @cancel="router.replace({})" />
    </div>

    <p v-if="loading" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="text-red">{{ LOAD_ERROR }}</p>
    <p v-else-if="!years.length" :class="section" class="m-0 text-[16px] text-muted">
      Zatím tu nejsou žádná alba. Založ první a nahraj do něj fotky z akce.
    </p>
    <div v-else :class="section" class="flex flex-col gap-9">
      <section v-for="year in years" :key="year.year" :aria-label="`Školní rok ${year.label}`">
        <h2
          class="m-0 mb-4 border-b border-[#ede5d3] pb-1.5 font-hand text-[26px] leading-none font-bold text-red"
        >
          školní rok {{ year.label }}
        </h2>
        <ul
          class="m-0 grid list-none grid-cols-2 gap-x-3.5 gap-y-6 p-0 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-x-[22px]"
        >
          <li v-for="(album, i) in year.albums" :key="album.id">
            <AlbumCard
              :album="album"
              :to="{ name: 'leader-album', params: { albumId: album.id } }"
              :tilt="TILTS[i % TILTS.length]"
              :this-year="thisYear"
            >
              <span
                class="mx-0.5 mt-1 mb-0.5 inline-block rounded-full px-2 pt-0.5 pb-[3px] text-[12.5px] font-medium"
                :class="
                  album.published
                    ? 'bg-[#e9f1ea] text-[#1f5138]'
                    : 'border border-dashed border-line-strong text-brown'
                "
              >
                {{ album.published ? 'zveřejněné' : 'skryté před rodiči' }}
              </span>
            </AlbumCard>
          </li>
        </ul>
      </section>
    </div>
  </main>
  <AreaFooter>
    <p class="m-0 text-[14.5px] text-muted-2">vedoucovská část — vidí ji jen tým</p>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >zpět na vedoucovskou stránku →</RouterLink
      >
    </p>
  </AreaFooter>
</template>
