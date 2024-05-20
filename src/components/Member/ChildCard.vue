<script setup>

  import NickOrName from "@/components/NickOrName.vue";

  const props = defineProps({
    data: Object
  })

</script>

<template>
  <div class="card mb-2 bg-sand">
    <div class="card-body">
      <div class="row align-items-center">
        <div class="col-6 text-truncate">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-person-circle px-auto pe-2" viewBox="0 0 16 16">
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
              <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
            </svg>
          </span>
          <nick-or-name class="d-none d-md-inline" :short="false" :user-data="data" :bold="true" />
          <nick-or-name class="d-inline d-md-none" :short="true" :user-data="data" :bold="true" />
        </div>
        <div class="col-6 p-0 text-center">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>