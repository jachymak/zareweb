<script setup>
  import ChildCard from "@/components/Member/ChildCard.vue";

  const props = defineProps({
    userData: Object,
    childrenData: Array
  });

  const emit = defineEmits(["signOut"]);

</script>

<template>
  <section>
    <div class="container-fluid bg-sand p-3 me-5">
      <div class="row align-items-center mb-3">
        <div class="col">
          <h3 class="m-0">Ahoj!</h3>
        </div>
        <div class="col text-end">
          <div class="d-flex d-inline-block align-items-center">
            <h6 class="m-0 me-2">{{ userData.email }}</h6>
            <button @click="emit('signOut')" class="btn btn-sm btn-secondary d-flex align-items-center" style="padding-right: 4px; padding-left: 6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">

          <child-card v-for="ch in childrenData" :data="ch">
            <div class="row">
              <div class="col">
                výpravy: 2/4
              </div>
              <div class="col">
                schůzky: 67 %
              </div>
            </div>
          </child-card>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>