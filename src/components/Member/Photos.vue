<script setup>
  import PhotoAlbum from "@/components/Member/PhotoAlbum.vue";

  const photosData = {
    photos1: {
      title: "Velikonočka 2024",
      url: "https://img30.rajce.idnes.cz/d3001/18/18994/18994846_c49a1a3c7a9b585ed0dbecfd5b9ad08f/thumb/IMG_3267.jpg"
    },
    photos2: {
      title: "Výprava do středohoří",
      url: "https://img31.rajce.idnes.cz/d3103/18/18968/18968863_7958795c265972900867f25109ece579/thumb/IMG_0763.jpg"
    },
    photos3: {
      title: "Pololetní výprava",
      url: "https://img42.rajce.idnes.cz/d4202/18/18904/18904322_8b8506b3a87a9620f3b622fe19b49c68/thumb/DSC_8535.jpg"
    }
  }

</script>

<template>
  <section>
    <div class="container-fluid">
      <div class="row px-3 pb-3">
        <div class="col">
          <photo-album :data="photosData.photos1" ></photo-album>
          <!--<img class="img-fluid" :src="photosData.photos1.url" alt="">-->
        </div>

        <div class="col">
          <photo-album :data="photosData.photos2" ></photo-album>
        </div>

        <div class="col">
          <photo-album :data="photosData.photos3" ></photo-album>
        </div>


      </div>
    </div>
  </section>
</template>

<style scoped>

</style>