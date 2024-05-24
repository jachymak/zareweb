<script setup>
  import PhotoAlbum from "@/components/Member/PhotoAlbum.vue";
  import {ref} from "vue";

  const albumsData = ref([])

  const extractTitle = (titleString) => {
    const regex = /\| (.*)$/
    const match = regex.exec(titleString)
    return match[1]
  }

  const extractThumbnailUrl = (content) => {
    const regex = /<img.*?src="(.*?)"/
    const match = regex.exec(content)
    return match[1]
  }

  fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fzare-sipka.rajce.idnes.cz%2F%3Frss%3Dnews")
      .then((res) => res.json())
      .then((data) => {
        for (const item of data.items) {
          const album = {
            title: extractTitle(item.title),
            link: item.link,
            thumbnailUrl: extractThumbnailUrl(item.content)
          }
          albumsData.value.push(album)
          if (albumsData.value.length >= 3) break
        }
      })


</script>

<template>
  <div class="container bg-sand mt-4 px-md-4 py-2">

    <div class="row">
      <h4>Fotky</h4>
    </div>

    <div class="row p-md-0 pt-4 px-5 gy-md-0 gy-4">
      <div v-for="(album, i) in albumsData" :key="i" class="col-12 col-md-4">
        <photo-album :data="album" />
      </div>
    </div>
    <div class="row mt-3 mb-md-1 mb-3">
      <div class="col-12 text-end">
        <a href="https://zare-sipka.rajce.idnes.cz" target="_blank" class="custom-link">zobrazit další alba...</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .custom-link {
    text-decoration: none;
    color: #11284F;
  }

  .custom-link:hover {
    text-decoration: none;
    color: #050d19;
  }
</style>
