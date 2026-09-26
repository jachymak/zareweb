<script setup>
import { computed } from 'vue'
import { useClubhouse } from '@/composables/useClubhouse'
import { useAuthStore } from '@/stores/auth'
import AreaFooter from '@/components/AreaFooter.vue'
import ComingSoonCover from '@/components/ComingSoonCover.vue'
import ClubhouseStatus from '@/components/clubhouse/ClubhouseStatus.vue'
import ClubhouseTimeline from '@/components/clubhouse/ClubhouseTimeline.vue'
import DeviceList from '@/components/clubhouse/DeviceList.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import { SAVE_ERROR } from '@/components/parent/parentText'

// Clubhouse — SPEC §4.5. First version on mock data (src/services/clubhouse.js),
// no hardware yet, so the page is greyed out as „coming“.
const auth = useAuthStore()
const { loading, saveError, clubhouse, now, toManual, toAuto, changeDevice } = useClubhouse()

const isAdmin = computed(() => auth.role === 'admin')
const manual = computed(() => clubhouse.value?.mode === 'manual')

const section = 'mx-auto max-w-[1040px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="flex flex-wrap items-end gap-x-[30px] gap-y-3.5 pt-6">
      <div class="min-w-0 flex-[1_1_320px]">
        <p class="m-0 mb-2 text-[15px]">
          <RouterLink to="/vedouci" class="inline-block py-1">
            ← zpět na vedoucovskou stránku
          </RouterLink>
        </p>
        <p class="kicker m-0 -mb-0.5">Kafkova 23, sklep</p>
        <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
          Klubovna
        </h1>
      </div>
      <!-- clubhouse with a flag, a tree and smoke from the chimney -->
      <svg
        viewBox="0 0 220 110"
        class="hidden h-auto w-[190px] flex-none overflow-visible sm:block"
        fill="none"
        stroke="var(--color-brown)"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M40 100 L40 46 L124 46 L124 100" />
        <path d="M30 48 L82 14 L134 48" />
        <path d="M58 100 L58 70 L86 70 L86 100" />
        <path d="M100 58 L118 58 L118 76 L100 76 Z" />
        <path d="M109 58 L109 76 M100 67 L118 67" />
        <path d="M81 14 L81 4 M81 4 L100 9 L81 15" />
        <path d="M12 102 C70 108 150 96 214 104" stroke-width="2.8" />
        <path
          d="M156 100 L156 60 M156 60 C144 50 150 34 164 39 C169 27 185 32 183 44 C192 49 187 66 173 64"
          stroke="var(--color-green)"
        />
        <path d="M62 30 C66 22 62 16 66 8" stroke="var(--color-red)" stroke-dasharray="4 6" />
      </svg>
    </div>

    <p v-if="loading" :class="section" class="pt-8 font-hand text-2xl text-muted">načítám…</p>
    <ComingSoonCover
      v-else
      class="mt-5"
      title="Tohle ještě nefunguje, ale bude"
      text="Ovládání klubovny chystáme — takhle to bude vypadat, až bude klubovna připojená."
    >
      <div :class="section">
        <p v-if="saveError" role="alert" class="m-0 mb-3 text-[15px] text-red">
          {{ SAVE_ERROR }}
        </p>
        <ClubhouseStatus
          :clubhouse="clubhouse"
          :now="now"
          :is-admin="isAdmin"
          @auto="toAuto"
          @manual="toManual"
        />
      </div>

      <div :class="section" class="pt-7">
        <DeviceList
          :devices="clubhouse.devices"
          :temperature="clubhouse.readings.temperature"
          :locked="!manual"
          @change="changeDevice"
        />
      </div>

      <div class="mt-8 bg-[#f6efdc]">
        <svg
          viewBox="0 0 1000 10"
          preserveAspectRatio="none"
          class="block h-2.5 w-full"
          fill="none"
          stroke="#e0d3af"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M0 6 C200 2 340 9 540 5 C720 2 870 8 1000 4"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div
          :class="section"
          class="flex flex-wrap items-start gap-x-10 gap-y-[26px] pt-[26px] pb-[30px]"
        >
          <ClubhouseTimeline
            id="schedule-title"
            class="flex-[1_1_320px]"
            kicker="co bude dál"
            title="Podle rozvrhu"
            :items="clubhouse.schedule"
            :now="now"
          >
            {{
              manual
                ? 'Rozvrh teď neběží, čeká, až manuál vyprší.'
                : 'Rozvrh vychází ze schůzek a výpravníku — mění se v Administraci.'
            }}
          </ClubhouseTimeline>
          <ClubhouseTimeline
            id="log-title"
            class="flex-[1_1_280px]"
            kicker="co se dělo"
            title="Log"
            :items="clubhouse.log"
            :now="now"
            history
          >
            Jen poslední změny, celý log je v
            <RouterLink v-if="isAdmin" to="/vedouci/administrace">Administraci</RouterLink>
            <template v-else>Administraci</template>. Něco nereaguje? Napište
            <a href="mailto:quido.hanulik@skaut.cz">Quidovi</a>.
          </ClubhouseTimeline>
        </div>
        <svg
          viewBox="0 0 1000 10"
          preserveAspectRatio="none"
          class="block h-2.5 w-full"
          fill="none"
          stroke="#e0d3af"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M0 4 C200 8 340 1 540 6 C720 9 870 2 1000 6"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    </ComingSoonCover>
  </main>
  <AreaFooter>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >zpět na vedoucovskou stránku →</RouterLink
      >
    </p>
  </AreaFooter>
</template>
