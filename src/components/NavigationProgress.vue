<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

// A thin moving bar at the top while a page takes a while to open (waiting
// for the signed-in user, loading the page's code), so a slow click doesn't
// look like nothing happened.
const SHOW_AFTER_MS = 250

const router = useRouter()
const visible = ref(false)
let timer = null

function stop() {
  clearTimeout(timer)
  timer = null
  visible.value = false
}

const removers = [
  router.beforeEach(() => {
    if (!timer) timer = setTimeout(() => (visible.value = true), SHOW_AFTER_MS)
  }),
  router.afterEach(stop),
  router.onError(stop),
]
onBeforeUnmount(() => {
  stop()
  removers.forEach((remove) => remove())
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-green-light"
    role="progressbar"
    aria-label="Načítám stránku"
  >
    <div class="navigation-progress h-full w-1/3 bg-green" />
  </div>
</template>

<style scoped>
.navigation-progress {
  animation: navigation-progress 1.2s ease-in-out infinite;
}

@keyframes navigation-progress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(300%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .navigation-progress {
    animation: none;
    width: 100%;
  }
}
</style>
