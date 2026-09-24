<script setup>
import Home01About from "@/components/Home/Home01About.vue";
import Home02When from "@/components/Home/Home02When.vue";
import Home03Where from "@/components/Home/Home03Where.vue";
</script>

<template>
  <div>
    <div class="mx-12 grid gap-4">
      <div class="rounded-lg">
        <div class="grid grid-cols-12">
          <div class="col-span-9">
            <div class="mx-auto">
              <Home01About />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
