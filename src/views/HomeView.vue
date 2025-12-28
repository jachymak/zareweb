<script setup>
import HelloWorld from "@/components/HelloWorld.vue";
</script>

<template>
  <div class="min-h-screen">
    <div class="mx-12 mt-8 mb-4 grid gap-4 sm:grid-cols-12">
      <div class="min-h-[100px] rounded-lg bg-orange-500 shadow sm:col-span-2">
        <div class="hidden p-4">
          <HelloWorld msg="Hey!" />
        </div>
        <RouterLink to="/">Go to INTRO</RouterLink>
      </div>

      <div class="min-h-[100px] rounded-lg bg-teal-500 shadow sm:col-span-8">
        <div class="pt-3 text-center">
          <h1>Skautský oddíl Záře</h1>
        </div>
      </div>

      <div
        class="min-h-[100px] rounded-lg bg-red-500 shadow sm:col-span-2"
      ></div>
    </div>

    <div class="mx-12 my-4 grid gap-4 sm:grid-cols-12">
      <div class="min-h-[100px] rounded-lg bg-orange-500 shadow sm:col-span-8">
        <div class="p-4">
          <p>Nazdar!</p>
          <p>My jsme oddíl Záře!</p>
        </div>
      </div>

      <div class="min-h-[100px] rounded-lg bg-teal-500 shadow sm:col-span-4">
        <div class="p-4">
          <div class="grid grid-cols-1 gap-4">
            <div class="min-h-[100px] bg-amber-200">Vlčušky</div>
            <div class="min-h-[100px] bg-amber-200">Skauti</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-12 my-4 grid gap-4 sm:grid-cols-12">
      <div class="col-span-12 min-h-[300px] rounded-lg bg-red-500 shadow">
        Fotky
      </div>
    </div>
  </div>
</template>

<style scoped></style>
