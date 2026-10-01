<script setup>
import PageHeader from '@/components/PageHeader.vue'
import { HISTORY, FIRST_CAMP_YEAR, campsByDecade } from '@/content/history'

// Troop history — SPEC §2.5. Static content, reads and writes nothing.
const decades = campsByDecade()
</script>

<template>
  <PageHeader />

  <main class="mx-auto max-w-[760px] px-4 pt-9 pb-24 sm:px-5">
    <div class="px-1.5 pb-[30px]">
      <p class="m-0 mb-1 font-hand text-[27px] text-red sm:text-[29px]">od roku 1975</p>
      <h1
        class="m-0 text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-[44px]"
      >
        Historie oddílu
      </h1>
    </div>

    <section v-for="period in HISTORY" :key="period.years" class="px-1.5 pb-8">
      <h2
        class="m-0 mb-2 font-hand text-[26px] leading-tight font-semibold text-green sm:text-[28px]"
      >
        {{ period.years }}
      </h2>
      <p v-for="(text, i) in period.paragraphs" :key="i" class="prose-body m-0 mb-3.5">
        {{ text }}
      </p>
    </section>

    <section id="tabory" class="pt-6">
      <div class="px-1.5 pb-6">
        <p class="kicker mb-2">každé léto od roku {{ FIRST_CAMP_YEAR }}</p>
        <h2 class="section-title m-0">Tábory oddílu Záře</h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="{ decade, camps } in decades"
          :key="decade"
          class="rounded-2xl border border-line-soft bg-paper px-5 pt-4 pb-3"
        >
          <h3 class="m-0 mb-2 font-hand text-[25px] leading-tight text-brown">
            {{ decade }}–{{ decade + 9 }}
          </h3>
          <ul class="m-0 list-none p-0">
            <li
              v-for="{ year, themes } in camps"
              :key="year"
              class="flex gap-4 border-t border-line-soft/60 py-2 first:border-t-0"
            >
              <span class="w-[3.2em] flex-none text-[16px] text-muted tabular-nums">{{
                year
              }}</span>
              <span class="min-w-0 text-[16.5px] leading-snug text-ink">
                <template v-if="themes.length">
                  <span v-for="[troop, name] in themes" :key="name" class="block">
                    <span v-if="troop" class="text-muted">{{ troop }}: </span>{{ name }}
                  </span>
                </template>
                <span v-else class="text-faint">doplníme</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>
