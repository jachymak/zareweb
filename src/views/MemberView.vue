<script setup>
import bg from "@/assets/background.png";
</script>

<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat"
    :style="{
      backgroundImage: `url(${bg})`,
    }"
  >
    <!-- page content -->
    <section class="p-10 text-white">
      <h1 class="text-4xl font-bold">Hello</h1>
      <div class="min-h-[200vh]"></div>
    </section>
  </div>
</template>

<style scoped></style>
