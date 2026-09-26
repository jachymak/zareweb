<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import { getRenewal } from '@/services/waitlist'
import { FIND_OTHER_GROUP_URL, GROUP_EMAIL } from '@/constants/troops'
import PageHeader from '@/components/PageHeader.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import WaitlistRenewalForm from '@/components/waitlist/WaitlistRenewalForm.vue'
import { sinceMonth } from '@/components/waitlist/waitlistText'
import sketchScouts from '@/assets/sketches/skica-skautici.svg'

// Waiting-list renewal — SPEC §2.3. Target of the link in the annual renewal e-mail.
const props = defineProps({
  token: { type: String, required: true },
})

const settingsStore = usePublicSettingsStore()
const { waitlistForm } = storeToRefs(settingsStore)

// 'loading' | 'form' | 'invalid' | 'error' | 'confirmed' | 'withdrawn'
const state = ref('loading')
const entry = ref(null)
const confirmedEmail = ref('')

async function load() {
  state.value = 'loading'
  try {
    const [data] = await Promise.all([getRenewal(props.token), settingsStore.load()])
    entry.value = data
    state.value = data ? 'form' : 'invalid'
  } catch (e) {
    console.error('getRenewal failed', e)
    state.value = 'error'
  }
}

function show(next) {
  state.value = next
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onConfirmed({ email }) {
  confirmedEmail.value = email
  show('confirmed')
}

onMounted(load)
</script>

<template>
  <PageHeader />

  <main class="mx-auto max-w-[760px] px-4 pt-9 pb-24 sm:px-5" :aria-busy="state === 'loading'">
    <p v-if="state === 'loading'" class="m-0 py-16 text-center font-hand text-[26px] text-muted">
      načítám zápis…
    </p>

    <template v-else-if="state === 'form'">
      <div class="px-1.5 pb-[30px]">
        <p class="m-0 mb-1 font-hand text-[27px] text-red sm:text-[29px]">obnovení zápisu</p>
        <h1
          class="m-0 mb-3.5 text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-[44px]"
        >
          Máte stále zájem?
        </h1>
        <p class="m-0 max-w-[56ch] text-[17px] leading-[1.7] text-pretty sm:text-[17.5px]">
          Čekací listinu každý rok obnovujeme. Zkontrolujte prosím údaje a potvrďte, že o místo v
          oddíle stále máte zájem.
        </p>
        <p
          class="m-0 mt-3.5 inline-block -rotate-[.4deg] rounded-[10px] bg-gold-light px-3.5 py-2 text-[15.5px] leading-normal text-ink"
        >
          Na listině je {{ sinceMonth(entry.firstSignedUpAt) }} — po potvrzení zůstane na svém
          původním místě v pořadí.
        </p>
      </div>

      <WaitlistRenewalForm
        :token="token"
        :entry="entry"
        :school-year="waitlistForm.schoolYear"
        :school-year-label="waitlistForm.schoolYearLabel"
        :warn-age="waitlistForm.warnAge"
        :max-age="waitlistForm.maxAge"
        @confirmed="onConfirmed"
        @withdrawn="show('withdrawn')"
        @expired="show('invalid')"
      />
    </template>

    <HandDrawnBox v-else shape="tall" class="mt-2.5">
      <div class="px-[22px] py-11 sm:px-12">
        <div class="flex flex-wrap items-center gap-x-[34px] gap-y-5">
          <img
            v-if="state === 'confirmed'"
            :src="sketchScouts"
            alt=""
            width="260"
            height="300"
            class="block h-auto w-[150px] flex-none"
          />
          <div class="min-w-0 flex-[1_1_300px]">
            <template v-if="state === 'confirmed'">
              <p class="kicker mb-1">díky!</p>
              <h1 class="result-title">{{ entry.firstName }} zůstává na čekací listině</h1>
              <p class="result-text">
                Zápis je obnovený a {{ entry.firstName }} je dál na svém původním místě v pořadí (na
                listině {{ sinceMonth(entry.firstSignedUpAt) }}). Další e-mail pošleme zase před
                příštím náborem na
                <strong class="font-semibold wrap-anywhere text-ink">{{ confirmedEmail }}</strong
                >.
              </p>
            </template>

            <template v-else-if="state === 'withdrawn'">
              <p class="kicker mb-1">zápis smazán</p>
              <h1 class="result-title">Díky, že jste dali vědět</h1>
              <p class="result-text">
                {{ entry.firstName }} už na čekací listině není a žádné další e-maily od nás
                nepřijdou. Ať se vám daří — třeba v jiném oddíle.
              </p>
            </template>

            <template v-else-if="state === 'invalid'">
              <p class="kicker mb-1">jejda</p>
              <h1 class="result-title">Tenhle odkaz už neplatí</h1>
              <p class="result-text">
                Odkaz pro obnovení zápisu je neplatný nebo už byl použitý. Pokud jste zájem už
                potvrdili, je všechno v pořádku. Jinak nám prosím napište na
                <a :href="`mailto:${GROUP_EMAIL}`">{{ GROUP_EMAIL }}</a
                >.
              </p>
            </template>

            <template v-else>
              <p class="kicker mb-1">jejda</p>
              <h1 class="result-title">Zápis se nepodařilo načíst</h1>
              <p class="result-text">Zkuste to prosím za chvíli znovu.</p>
            </template>
          </div>
        </div>

        <div
          v-if="state === 'confirmed'"
          class="mt-[30px] -rotate-[.5deg] rounded-[14px] bg-[#F7EBCB] px-[22px] py-[18px]"
        >
          <p class="m-0 mb-1 font-semibold text-ink">Ještě jednou upřímně</p>
          <p class="m-0 text-base leading-[1.65] text-pretty">
            Na listině bývá kolem 150 dětí a každý rok nabereme jen 5–7 nováčků. Doporučujeme proto
            porozhlédnout se i po jiném oddílu — skautů je v Praze spousta.
          </p>
          <a :href="FIND_OTHER_GROUP_URL" class="mt-2.5 inline-block text-[16.5px] font-medium">
            Najít oddíl v okolí →
          </a>
        </div>

        <div class="mt-7 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
          <button v-if="state === 'error'" type="button" class="btn-primary" @click="load">
            Zkusit znovu
          </button>
          <RouterLink v-else to="/" class="btn-primary px-[26px] py-3.5 text-[16.5px]">
            Zpět na stránku oddílu
          </RouterLink>
        </div>
      </div>
    </HandDrawnBox>
  </main>
</template>

<style scoped>
@reference '@/assets/main.css';

.result-title {
  @apply m-0 mb-4 text-[28px] leading-[1.1] font-medium tracking-[-0.03em] text-ink sm:text-[38px];
}

.result-text {
  @apply m-0 text-[17px] leading-[1.7] text-pretty sm:text-[17.5px];
}
</style>
