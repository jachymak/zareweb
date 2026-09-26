<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import PageHeader from '@/components/PageHeader.vue'
import WaitlistForm from '@/components/waitlist/WaitlistForm.vue'
import WaitlistSuccess from '@/components/waitlist/WaitlistSuccess.vue'

// Waiting-list sign-up — SPEC §2.2. Reads settings/public, writes via submitWaitlist.
const settingsStore = usePublicSettingsStore()
const { recruitment, waitlistForm, loaded } = storeToRefs(settingsStore)

const done = ref(null) // { firstName, parent } after a successful sign-up
const parent = ref({}) // kept for „Zapsat další dítě“
const formKey = ref(0)

function onSubmitted(result) {
  done.value = result
  parent.value = result.parent
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function signUpAnother() {
  done.value = null
  formKey.value++ // fresh form, parent contact pre-filled
  window.scrollTo({ top: 0 })
}

onMounted(() => settingsStore.load())
</script>

<template>
  <PageHeader />

  <main class="mx-auto max-w-[760px] px-4 pt-9 pb-24 sm:px-5">
    <WaitlistSuccess
      v-if="done"
      :first-name="done.firstName"
      :email="done.parent.email"
      @another="signUpAnother"
    />

    <template v-else>
      <div class="px-1.5 pb-[30px]">
        <p class="m-0 mb-1 font-hand text-[27px] text-red sm:text-[29px]">zápis nováčka</p>
        <h1
          class="m-0 mb-3.5 text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-[44px]"
        >
          Čekací listina
        </h1>
        <p class="m-0 max-w-[56ch] text-[17px] leading-[1.7] text-pretty sm:text-[17.5px]">
          Vyplnění zabere asi dvě minuty. Zápis bohužel nezaručuje přijetí — nováčky vybíráme koncem
          prázdnin a ozveme se sami.
        </p>
        <p
          v-if="recruitment"
          class="m-0 mt-3.5 inline-block -rotate-[.4deg] rounded-[10px] bg-gold-light px-3.5 py-2 text-[15.5px] leading-normal text-ink"
        >
          Nováčky na školní rok {{ recruitment.doneYear }} už máme nabrané. Nové zápisy zařadíme do
          výběru na rok {{ recruitment.nextYear }}.
        </p>
      </div>

      <!-- Wait for settings so age limits and the school year are right from the start. -->
      <WaitlistForm
        v-if="loaded"
        :key="formKey"
        :school-year="waitlistForm.schoolYear"
        :school-year-label="waitlistForm.schoolYearLabel"
        :warn-age="waitlistForm.warnAge"
        :max-age="waitlistForm.maxAge"
        :initial-parent="parent"
        @submitted="onSubmitted"
      />
    </template>
  </main>
</template>
