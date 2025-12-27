<script setup>
import HelloWorld from "@/components/HelloWorld.vue";
</script>

<template>
  <div class="m-4 grid gap-4 sm:grid-cols-12">
    <div class="min-h-[100px] rounded-lg bg-orange-500 shadow sm:col-span-2">
      <div class="p-4">
        <HelloWorld msg="Hey!" />
      </div>
    </div>

    <div class="min-h-[100px] rounded-lg bg-teal-500 shadow sm:col-span-8">
      <div class="pt-3 text-center">
        <h1>Skautský oddíl Záře</h1>
      </div>
    </div>

    <div class="min-h-[100px] rounded-lg bg-red-500 shadow sm:col-span-2"></div>
  </div>
</template>

<style scoped></style>
