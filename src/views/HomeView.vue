<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Home01About from "@/components/Home/Home01About.vue";
import Home02When from "@/components/Home/Home02When.vue";
import Home03Where from "@/components/Home/Home03Where.vue";

const route = useRoute();
const router = useRouter();

const pages = [
  { key: "about", title: "Skautský oddíl Záře" },
  { key: "when", title: "Kdy se scházíme" },
  { key: "where", title: "Naše klubovna" },
];

const currentIndex = computed(() => {
  const idx = pages.findIndex((p) => p.key === route.params.page);
  return idx >= 0 ? idx : 0;
});

const currentPage = computed(() => pages[currentIndex.value]);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < pages.length - 1);

function goNext() {
  if (hasNext.value)
    router.push(`/home/${pages[currentIndex.value + 1].key}`);
}

function goPrev() {
  if (hasPrev.value)
    router.push(`/home/${pages[currentIndex.value - 1].key}`);
}

// Mouse gradient
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
  <div class="min-h-screen px-20 pt-20 pb-16">
    <img src="@/assets/zare-white.svg" alt="" class="mb-10 w-64" />

    <h1
      ref="titleRef"
      class="inline-block bg-clip-text text-5xl font-bold text-transparent"
      :style="gradientStyle"
    >
      {{ currentPage.title }}
    </h1>

    <div class="mt-8 max-w-lg">
      <Home01About v-if="currentPage.key === 'about'" />
      <Home02When v-else-if="currentPage.key === 'when'" />
      <Home03Where v-else-if="currentPage.key === 'where'" />
    </div>

    <!-- Nav fixed to right side, vertically centered -->
    <div
      class="fixed right-12 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4"
    >
      <button
        @click="goPrev"
        :class="
          hasPrev
            ? 'cursor-pointer text-white/40 hover:border-white/60 hover:text-white/90'
            : 'invisible'
        "
        class="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 transition-all"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <div class="flex flex-col gap-2.5 py-1">
        <span
          v-for="(p, i) in pages"
          :key="p.key"
          class="block h-3 w-3 rounded-full transition-all"
          :class="
            i === currentIndex
              ? 'scale-125 bg-white/80'
              : 'cursor-pointer bg-white/25 hover:bg-white/50'
          "
          @click="router.push(`/home/${p.key}`)"
        />
      </div>

      <button
        @click="goNext"
        :class="
          hasNext
            ? 'cursor-pointer text-white/40 hover:border-white/60 hover:text-white/90'
            : 'invisible'
        "
        class="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 transition-all"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
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
