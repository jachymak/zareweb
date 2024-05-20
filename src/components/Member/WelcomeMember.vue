<script setup>
  import ChildCard from "@/components/Member/ChildCard.vue";
  import router from "@/router/router.js";

  const props = defineProps({
    userData: Object,
    childrenData: Array
  });

  const emit = defineEmits(["signOut"]);

  const handleBtnClick = (path) => {
    router.push(path)
  }

</script>

<template>
  <section>
    <div class="container-fluid bg-sand p-3 pt-4 pt-md-3 pb-md-2">
      <div class="row align-items-center mb-3">
        <div class="col-6">
          <h3 class="m-md-0">Ahoj!</h3>
        </div>

        <div class="col-6">
          <div class="d-flex d-inline-block align-items-center justify-content-end">
            <h6 class="m-0 me-3 me-md-2">{{ userData.email }}</h6>
            <button @click="emit('signOut')" class="btn btn-sm btn-secondary d-flex align-items-center" style="padding-right: 4px; padding-left: 6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="row pt-2 pt-md-0">
        <div v-if="!userData.leader" class="col-12">

          <child-card v-for="ch in childrenData" :data="ch">
            <div class="container-fluid">
              <div class="row">
                <div class="col">
                  výpravy: 2/4
                </div>
                <div class="col">
                  schůzky: 67&nbsp;%
                </div>
              </div>
            </div>
          </child-card>
        </div>

        <div v-if="userData.leader" class="container px-4" id="admin-buttons">
          <div class="row mb-3 d-flex justify-content-evenly">
            <div class="col-10 col-md-5 btn btn-secondary" @click="handleBtnClick('/admin/attendance')">
              Docházka
            </div>
            <div class="col-10 col-md-5 btn btn-secondary" @click="handleBtnClick('/admin/events')">
              Výpravy
            </div>
          </div>
          <div class="row mb-3 d-flex justify-content-evenly">
            <div class="col-10 col-md-5 btn btn-secondary" @click="handleBtnClick('/admin/members')">
              Členové
            </div>
            <div class="col-10 col-md-5 btn btn-secondary" @click="handleBtnClick('/admin/door')">
              Otrok matoun
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
  #admin-buttons .btn {
    min-height: 3em;
    align-content: center;
  }
</style>
