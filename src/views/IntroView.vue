<template>
  <div class="fixed inset-0 overflow-hidden">
    <!-- Background image transition -->
    <transition
      enter-active-class="transition-all duration-700 ease-out"
      enter-from-class="opacity-0 scale-100 translate-y-0"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-700 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-110 -translate-y-10"
    >
      <img
        v-if="visible"
        src="@/assets/intro-image.png"
        alt="Intro background"
        class="absolute inset-0 h-full w-full object-cover"
      />
    </transition>

    <!-- Content -->
    <div class="fixed inset-0 flex items-center justify-center">
      <transition
        enter-active-class="transition-all duration-700 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-500 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-105"
      >
        <div v-if="visible" class="relative z-10 text-center text-white">
          <h1
            class="mb-6 text-4xl font-bold md:text-6xl"
            style="text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6)"
          >
            Skautský oddíl Záře
          </h1>

          <button
            @click="enterSite"
            class="rounded-full bg-white px-8 py-3 font-semibold text-black shadow-xl transition hover:scale-105"
          >
            Hurá na web!
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const visible = ref(true);

function enterSite() {
  visible.value = false;

  // match longest leave animation (700ms)
  setTimeout(() => {
    router.replace({ path: "/home", meta: { fromIntro: true } });
  }, 700);
}
</script>
