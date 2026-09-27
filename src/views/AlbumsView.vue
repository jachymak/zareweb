<script setup>
import { computed, onMounted, ref } from 'vue'
import { isRelevant } from '@shared/events'
import { pragueToday } from '@shared/schoolYear'
import { useMemberPage } from '@/composables/useMemberPage'
import { listAlbums } from '@/services/photos'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import PreviewBar from '@/components/parent/PreviewBar.vue'
import AlbumCard from '@/components/photos/AlbumCard.vue'
import { bySchoolYear } from '@/components/photos/photosText'
import { LOAD_ERROR } from '@/components/parent/parentText'

// All albums — SPEC §3.3. Published albums by school year; by default only
// those of the children's troops (+ everyone's), like the Výpravník.
const { previewOf, isLeader, keep, home, loadTroops } = useMemberPage()
const thisYear = Number(pragueToday().slice(0, 4))

const loading = ref(true)
const loadError = ref(false)
const albums = ref([])
const troops = ref([])
onMounted(async () => {
  try {
    const [list, t] = await Promise.all([listAlbums({ publishedOnly: true }), loadTroops()])
    albums.value = list
    troops.value = t
  } catch (e) {
    console.error('Loading the albums failed', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
})

// With children in one troop only the switch shows the other troop's albums too.
const oneTroop = computed(() => troops.value.length === 1)
const allTroops = ref(false)
const shown = computed(() =>
  oneTroop.value && !allTroops.value
    ? albums.value.filter((a) => isRelevant(a.audience, troops.value))
    : albums.value,
)
const years = computed(() => bySchoolYear(shown.value))
const filterText = computed(() => {
  if (!oneTroop.value || allTroops.value) return 'Vidíte alba obou oddílů.'
  const troop = troops.value[0] === 'vlc' ? 'vlčušek' : 'skautů a skautek'
  return `Vidíte alba ${troop} a z akcí pro všechny.`
})

const TILTS = [-1.6, 1.2, -0.8, 1.5, -1.2, 0.9]
const section = 'mx-auto max-w-[1120px] px-4 sm:px-6'
</script>

<template>
  <PreviewBar v-if="previewOf" :model-value="previewOf" />
  <LeaderHeader v-if="isLeader" />
  <AreaHeader v-else area="pro členy" />
  <main>
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink :to="home" class="inline-block py-1">
          ← {{ isLeader ? 'zpět do správy fotek' : 'zpět na stránku pro členy' }}
        </RouterLink>
      </p>
      <div class="mb-5 flex flex-wrap items-end gap-x-5 gap-y-2.5">
        <div class="mr-auto">
          <p class="kicker m-0 -mb-0.5">z akcí a výprav</p>
          <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
            Fotky
          </h1>
        </div>
        <button
          v-if="oneTroop"
          type="button"
          class="cursor-pointer border-0 border-b-[1.5px] border-[#9ec0a8] bg-transparent px-0 pt-1 pb-px font-hand text-[20px] font-bold text-green hover:text-red"
          :aria-pressed="allTroops"
          @click="allTroops = !allTroops"
        >
          {{ allTroops ? 'jen naše alba' : 'i alba druhého oddílu' }}
        </button>
      </div>
      <p v-if="oneTroop" class="m-0 -mt-2 mb-4 text-[14.5px] text-[#8a7b5e]">{{ filterText }}</p>
    </div>

    <p v-if="loading" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="text-red">{{ LOAD_ERROR }}</p>
    <p v-else-if="!years.length" :class="section" class="m-0 text-[16px] text-muted">
      Zatím tu nejsou žádná alba — fotky z akcí sem vedoucí přidají.
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
              :to="{ name: 'album', params: { albumId: album.id }, query: keep }"
              :tilt="TILTS[i % TILTS.length]"
              :this-year="thisYear"
            />
          </li>
        </ul>
      </section>
    </div>
  </main>
  <AreaFooter />
</template>
