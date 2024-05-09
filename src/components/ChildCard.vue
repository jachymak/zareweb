<script setup>

const props = defineProps({
  data: Object
})

</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="row align-items-center">
        <div class="col">
          <span>{{ data.nickname }}</span> <span class="d-none d-md-inline">({{ data.name }} {{ data.surname }})</span>
        </div>
        <div class="col text-center">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>