<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import ZareLogo from '@/components/ZareLogo.vue'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import NoAccess from '@/components/auth/NoAccess.vue'
import NotebookSketch from '@/components/auth/NotebookSketch.vue'
import PendingApproval from '@/components/auth/PendingApproval.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import { INTRO } from '@/components/auth/authText'

// Login / registration — SPEC §2.4. One entry point for parents and leaders;
// approved users are sent on by role, the others see their account status.
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = ref('login') // login | forgot | register — while signed out

// Account status of a signed-in user whose role has no area (yet).
const status = computed(() => {
  if (!auth.user || auth.busy || !auth.profileLoaded || auth.homeRoute) return null
  return auth.role === 'none' ? 'none' : 'pending'
})
const screen = computed(() => status.value ?? form.value)
const intro = computed(() => INTRO[screen.value])

// Where the guard sent the user from (`?next=/vedouci/...`); local paths only.
const next = computed(() => {
  const path = route.query.next
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : null
})

// Leaves as soon as the role allows it — right after login, or live when approved.
watch(
  () => !auth.busy && auth.homeRoute,
  (home) => home && router.replace(next.value ?? home),
  { immediate: true },
)

async function signOut() {
  await auth.signOut()
  form.value = 'login'
}
</script>

<template>
  <div class="flex min-h-dvh flex-col overflow-x-hidden">
    <div class="mx-auto w-full max-w-[1060px] px-4 pt-4 sm:px-6">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2.5 py-1 text-ink no-underline hover:text-red"
      >
        <ZareLogo class="w-[34px]" />
        <span class="font-hand text-[23px] font-bold">← zpět na stránky oddílu</span>
      </RouterLink>
    </div>

    <main class="flex flex-1 items-center justify-center px-4 pt-6 pb-16 sm:px-6">
      <div class="flex w-full max-w-[940px] flex-wrap items-center gap-10">
        <div class="min-w-0 flex-[1_1_300px]">
          <p class="kicker m-0 mb-1">{{ intro[0] }}</p>
          <h1
            class="m-0 mb-4 text-[30px] leading-[1.06] font-medium tracking-[-0.04em] text-ink sm:text-[44px]"
          >
            {{ intro[1] }}
          </h1>
          <p class="prose-body m-0 mb-6 max-w-[42ch]">{{ intro[2] }}</p>
          <NotebookSketch class="hidden sm:block" />
          <p class="m-0 mt-5 max-w-[40ch] text-[15px] leading-relaxed text-brown">
            Jeden vstup pro rodiče i vedoucí — po přihlášení se ti ukáže to, na co máš přístup.
          </p>
        </div>

        <HandDrawnBox stroke="var(--color-red)" shape="tall" class="min-w-0 flex-[1_1_360px]">
          <div class="px-5 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7">
            <PendingApproval v-if="screen === 'pending'" @sign-out="signOut" />
            <NoAccess v-else-if="screen === 'none'" @sign-out="signOut" />
            <ForgotPasswordForm v-else-if="screen === 'forgot'" @back="form = 'login'" />
            <RegisterForm v-else-if="screen === 'register'" @back="form = 'login'" />
            <LoginForm v-else @forgot="form = 'forgot'" @register="form = 'register'" />
          </div>
        </HandDrawnBox>
      </div>
    </main>
  </div>
</template>
