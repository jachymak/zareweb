<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ZareLogo from '@/components/ZareLogo.vue'

// Header of the signed-in areas: title, the user's e-mail, sign out.
defineProps({
  area: { type: String, required: true }, // „pro členy“ / „pro vedoucí“
})

const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="border-b border-line-soft/60">
    <div
      class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-6"
    >
      <RouterLink to="/" class="mr-auto flex items-center gap-2.5 text-ink no-underline">
        <ZareLogo class="w-[34px]" />
        <span class="font-hand text-[22px] font-bold sm:text-[24px]">
          Skautský oddíl Záře <span class="text-red">· {{ area }}</span>
        </span>
      </RouterLink>
      <span class="min-w-0 text-[14.5px] break-words text-muted">{{ auth.user?.email }}</span>
      <button type="button" class="btn-link" @click="signOut">odhlásit</button>
    </div>
  </header>
</template>
