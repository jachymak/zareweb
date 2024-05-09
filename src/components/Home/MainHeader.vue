<script setup>
  import { useRouter } from "vue-router";
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/login");
  };

</script>

<template>
  <div class="container-fluid text-white pb-1 bg-navy">
    <div class="row justify-content-end">
      <div class="col mt-2 text-end">
        <button type="button" class="btn btn-sm btn-outline-light" @click="handleLoginClick">Přihlášení pro členy</button>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-2 col-md-4 col-sm-5 col-4 text-center">
        <img class="img-fluid w-auto pt-4 pb-3" src="@/assets/img/zare-logo-transparent.png" alt="">
      </div>
    </div>

    <div class="row justify-content-center mb-5">
      <div class="col-12 text-center">
        <h1 class="text-white">Skautský oddíl Záře</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>