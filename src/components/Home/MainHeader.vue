<script setup>
  import { useRouter } from "vue-router";
  const router = useRouter();

  const props = defineProps({
    loggedIn: Boolean,
    userData: {
      type: Object, required: false
    }
  })

  const emit = defineEmits(["signOut"]);

  const handleLoginClick = () => {
    router.push("/login");
  };

</script>

<template>
  <div class="container-fluid text-white pb-1 bg-navy">
    <div class="row justify-content-end">
      <div class="col mt-2 text-end">
        <button v-if="!loggedIn" type="button" class="btn btn-sm btn-outline-light" @click="handleLoginClick">Přihlášení pro členy</button>

        <div v-if="loggedIn" class="d-flex d-inline-block align-items-center justify-content-end mt-1">
          <b class="d-none d-md-inline m-0 me-3 me-md-2">{{ userData.email }}</b>
          <button @click="emit('signOut')" class="btn btn-sm btn-secondary d-flex align-items-center" style="padding-right: 4px; padding-left: 6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
              <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
            </svg>
          </button>
        </div>

      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-2 col-md-4 col-sm-5 col-5 text-center pt-3 pt-sm-0">
        <img class="img-fluid w-auto pt-4 pb-3" src="@/assets/img/zare-logo-transparent.png" alt="">
      </div>
    </div>

    <div class="row justify-content-center mb-5">
      <div class="col-12 text-center">
        <h1 class="text-white d-block d-sm-none h1mobile">Skautský oddíl Záře</h1>
        <h1 class="text-white d-none d-sm-block">Skautský oddíl Záře</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>