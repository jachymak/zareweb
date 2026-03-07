<script setup>
import LeftSide from "@/components/Home/LeftSide.vue";
import HelloWorld from "@/components/HelloWorld.vue";

import { ref, computed, onMounted, onUnmounted } from "vue";

const titleRef = ref(null);

const mouseX = ref(window.innerWidth / 2);
const mouseY = ref(window.innerHeight / 2);

const smoothX = ref(0);
const smoothY = ref(0);

function handleMouseMove(e) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}

function animate() {
  if (titleRef.value) {
    const rect = titleRef.value.getBoundingClientRect();

    const targetX = mouseX.value - rect.left;
    const targetY = mouseY.value - rect.top;

    smoothX.value += (targetX - smoothX.value) * 0.06;
    smoothY.value += (targetY - smoothY.value) * 0.06;
  }

  requestAnimationFrame(animate);
}

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  animate();
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});

const gradientStyle = computed(() => ({
  background: `
    radial-gradient(
      circle 800px at ${smoothX.value}px ${smoothY.value}px,
      rgba(228,6,19,0.9) 0%,
      rgba(243,146,0,0.7) 25%,
      rgba(255,255,0,0.5) 45%,
      rgba(255,255,0,0.2) 65%,
      transparent 80%
    ),
    linear-gradient(
      90deg,
      #e40613 0%,
      #f39200 50%,
      #ffff00 100%
    )
  `,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
}));
</script>

<template>
  <div class="min-h-screen">
    <div class="grid grid-cols-12">
      <div class="col-span-1"></div>
      <div class="col-span-8">
        <div class="mx-12 mt-17 grid sm:grid-cols-12">
          <div class="my-auto mb-8 items-center gap-4 rounded-lg sm:col-span-8">
            <img
              src="@/assets/zare-logo-transparent.png"
              alt=""
              class="ms-2 mb-[-25px] h-60 w-auto brightness-0 invert filter"
            />
            <!-- class="bg-gradient-to-r from-[#ff6a00] via-[#ffcc00] to-[#00c3ff] bg-clip-text text-5xl font-bold text-transparent" -->

            <div class="text-left">
              <h1
                ref="titleRef"
                class="inline-block bg-clip-text text-5xl font-bold text-transparent"
                :style="gradientStyle"
              >
                Skautský oddíl Záře
              </h1>
            </div>
            <!--
            <div class="text-left">
              <h1
                class="inline-block bg-gradient-to-r from-[#e40613] via-[#f39200] to-[#ffff00] bg-clip-text text-5xl font-bold text-transparent"
              >
                Skautský oddíl Záře
                Kdy se scházíme
              </h1>
            </div>
          --></div>
        </div>

        <!-- <hr class="mx-10 mb-10" /> -->

        <LeftSide />
      </div>

      <div class="col-span-3 hidden">
        <div class="ms-50 mt-90 text-4xl">
          <ul>
            <li>Hovno</li>
            <li class="mt-3">Hovno</li>
            <li class="mt-3">Hovno</li>
          </ul>
        </div>
      </div>
    </div>

    <!--<RouterLink class="m-72" to="/">Go to INTRO</RouterLink>-->
  </div>
</template>

<style scoped></style>

<!--
TODO

- tlačítko pro členy na intro stránce
- vrátit se na intro stránku při daní zpět
- přeskakování mezi textem na veřejnost stránce pomocí tlačítka pokračovat někde vpravo dole
- nadpis skautský oddíl záře se mění na "kdy se scházíme" "naše klubovna" ...

-->
