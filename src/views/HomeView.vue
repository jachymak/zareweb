<script setup>
import LeftSide from "@/components/Home/LeftSide.vue";
import HelloWorld from "@/components/HelloWorld.vue";
</script>

<template>
  <div class="min-h-screen">
    <div class="grid grid-cols-12">
      <div class="col-span-8">
        <div class="mx-12 mt-8 grid gap-4 sm:grid-cols-12">
          <div
            class="my-auto mb-10 min-h-[100px] items-center gap-4 rounded-lg sm:col-span-8"
          >
            <img
              src="@/assets/zare-logo-transparent.png"
              alt=""
              class="my-auto h-30 w-auto brightness-0 invert filter"
            />
            <div class="text-left">
              <h1>Skautský oddíl Záře</h1>
            </div>
          </div>
        </div>

        <hr class="mx-10 mb-10" />

        <LeftSide />
      </div>
      <div class="col-span-4">
        <img
          src="@/assets/path.png"
          class="h-full w-full rounded-lg object-cover p-8"
        />
      </div>
    </div>

    <RouterLink to="/">Go to INTRO</RouterLink>
  </div>
</template>

<style scoped></style>
