<script setup>
  const props = defineProps({
    data: { type: Object, required: true }
  });
</script>

<template>
  <div class="rounded align-content-center text-center" :style="{ 'height': '10rem', 'background': 'url(' + data.url + ') no-repeat center center / cover'}">
    <!--              <h6 class="text-white sb m-0">{{ photosData.photos1.title }}</h6>-->
  </div>
</template>

<style scoped>

</style>