<script setup>
  const props = defineProps({
    name: String,
    role: String,
    phone: String,
    email: String,
    imgUrl: String
  })

</script>

<template>

  <div class="card bg-sand-light">
    <div class="card-body py-2">
      <div class="row align-items-center">
        <div class="col-4 p-1 ps-2">
          <img class="img-fluid rounded" :src="imgUrl">
        </div>

        <div class="col-8">
          <div class="row">
            <h6 class="text-truncate">{{ name }}</h6>
          </div>
          <div class="row">
            <i>{{ role }}</i>
          </div>
          <div class="row">
            <span>{{ phone }}</span>
          </div>
          <div class="row">
            <a :href="'mailto:' + email">{{ email }}</a>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>

<style scoped>

</style>