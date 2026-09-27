<script setup>
import AlbumCard from '@/components/photos/AlbumCard.vue'
import SectionHeading from './SectionHeading.vue'

// „Fotky“ — the four latest albums of the children's troops (SPEC §3.1).
defineProps({
  albums: { type: Array, required: true },
  today: { type: String, required: true },
  query: { type: Object, default: () => ({}) }, // kept on links (leaders' preview)
})
const TILTS = [-1.8, 1.3, -1, 1.7]
</script>

<template>
  <section aria-labelledby="photos-title">
    <SectionHeading id="photos-title" kicker="z posledních akcí" title="Fotky">
      <RouterLink :to="{ name: 'albums', query }" class="py-1 text-[15.5px]">
        všechna alba →
      </RouterLink>
    </SectionHeading>
    <p v-if="!albums.length" class="m-0 border-t border-[#ede5d3] py-3 text-[16px] text-muted">
      Zatím tu nejsou žádná alba — fotky z akcí sem vedoucí přidají.
    </p>
    <ul
      v-else
      class="m-0 grid list-none grid-cols-2 gap-x-3.5 gap-y-5 p-0 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-x-[18px]"
    >
      <li v-for="(album, i) in albums" :key="album.id">
        <AlbumCard
          :album="album"
          :to="{ name: 'album', params: { albumId: album.id }, query }"
          :tilt="TILTS[i % TILTS.length]"
          :this-year="Number(today.slice(0, 4))"
        />
      </li>
    </ul>
  </section>
</template>
