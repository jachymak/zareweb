<script setup>
  const props = defineProps({
    title: String
  })
</script>

<template>
  <div class="container-fluid">
    <div class="row text-center bg-sand py-4"><h1 class="m-0">{{ title }}</h1></div>
  </div>
  <div class="container my-5">
    <slot />
  </div>

</template>
