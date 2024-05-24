<script setup>
  const props = defineProps({
    name: String,
    role: String,
    phone: String,
    email: String
  })

</script>

<template>

  <div class="card bg-sand-light">
    <div class="card-body">
      <div class="row">
        <div class="col">
          <img src="https://mdbcdn.b-cdn.net/img/new/avatars/9.webp">
        </div>

        <div class="col">
          <h4>{{ name }}</h4>
          <span>{{ role }}</span>
          <p>{{ phone }}</p>
          <p><a :href="'mailto:' + email">{{ email }}</a></p>
        </div>

      </div>
    </div>
  </div>

</template>

<style scoped>

</style>