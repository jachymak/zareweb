<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { isFirstPage } from '@/router'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import { FAQ } from '@/content/faq'
import PublicHeader from '@/components/public/PublicHeader.vue'
import PublicFooter from '@/components/public/PublicFooter.vue'
import StorySection from '@/components/public/StorySection.vue'
import TrailPath from '@/components/public/TrailPath.vue'
import TrailConnector from '@/components/public/TrailConnector.vue'
import PolaroidPhoto from '@/components/public/PolaroidPhoto.vue'
import TroopList from '@/components/public/TroopList.vue'
import JoinCard from '@/components/public/JoinCard.vue'
import FaqAccordion from '@/components/public/FaqAccordion.vue'
import IntroScreen from '@/components/public/IntroScreen.vue'
import HomeHero from '@/components/public/HomeHero.vue'
import sketchClubhouse from '@/assets/sketches/skica-klubovna.svg'
import sketchGoal from '@/assets/sketches/skica-cil.svg'
import clubhouseMap from '@/assets/public/mapa-klubovna.jpg'
import dejvice400 from '@/assets/public/dejvice-400.webp'
import dejvice800 from '@/assets/public/dejvice-800.webp'
import guide400 from '@/assets/public/pruvodce-400.webp'
import guide800 from '@/assets/public/pruvodce-800.webp'
import clubhouse400 from '@/assets/public/klubovna-400.webp'
import clubhouse800 from '@/assets/public/klubovna-800.webp'
import camp400 from '@/assets/public/tabor-400.webp'
import camp800 from '@/assets/public/tabor-800.webp'
import signpost400 from '@/assets/public/rozcestnik-400.webp'
import signpost800 from '@/assets/public/rozcestnik-800.webp'

// Public home — SPEC §2.1. Reads settings/public, writes nothing.
const settingsStore = usePublicSettingsStore()
const { recruitment } = storeToRefs(settingsStore)

onMounted(() => settingsStore.load())

// Props for a StorySection with a raster drawing (400 px and 800 px wide).
const drawing = (small, large) => ({ sketch: small, srcset: `${small} 400w, ${large} 800w` })

// Drawing and side of each StorySection; the DrawingPicker (dev only) can
// override them to try out variants from design-reference/drawings.
const STORIES = [
  {
    id: 'start',
    label: 'Kdo jsme',
    defaultFile: 'dejvice-2.png',
    sketchSide: 'right',
    ...drawing(dejvice400, dejvice800),
  },
  {
    id: 'oddily',
    label: 'Mladší a starší',
    defaultFile: 'skica-klubovna.svg',
    sketchSide: 'left',
    sketch: sketchClubhouse,
  },
  {
    id: 'cinnost',
    label: 'Co děláme',
    defaultFile: 'pruvodce-2.png',
    sketchSide: 'right',
    ...drawing(guide400, guide800),
  },
  {
    id: 'rok',
    label: 'Od schůzky k táboru',
    defaultFile: 'rozcestnik-2.png',
    sketchSide: 'left',
    ...drawing(signpost400, signpost800),
  },
  {
    id: 'klubovna',
    label: 'Klubovna',
    defaultFile: 'klubovna.png',
    sketchSide: 'right',
    ...drawing(clubhouse400, clubhouse800),
  },
  {
    id: 'tabor',
    label: 'Tábor',
    defaultFile: 'tabor-2.png',
    sketchSide: 'left',
    ...drawing(camp400, camp800),
  },
  {
    id: 'cil',
    label: 'Závěr',
    defaultFile: 'skica-cil.svg',
    sketchSide: 'left',
    sketch: sketchGoal,
  },
]
const overrides = ref({})
// { size, layout } of the HomeHero variant under trial.
const hero = ref({})
const DrawingPicker = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/public/DrawingPicker.vue'))
  : null

function story(id) {
  const { sketch, srcset, sketchSide } = STORIES.find((s) => s.id === id)
  const o = overrides.value[id] ?? {}
  const image = o.url
    ? { sketch: o.url, srcset: o.raster ? `${o.url} 800w` : undefined }
    : { sketch, srcset }
  return { ...image, sketchSide: o.side ?? sketchSide }
}

// Mobile trail connectors run from one story's text side to the next one's.
const textSide = (id) => (story(id).sketchSide === 'left' ? 'right' : 'left')

// The intro greets every fresh load of the home page, but not in-app returns
// or links to a section.
const showIntro = isFirstPage() && !useRoute().hash
</script>

<template>
  <div class="overflow-x-clip">
    <IntroScreen v-if="showIntro" />
    <PublicHeader />

    <main class="relative">
      <TrailPath :key="JSON.stringify([overrides, hero])" class="hidden md:block" />

      <div class="relative z-[1] mx-auto max-w-[1120px] px-4 pb-6 sm:px-6">
        <HomeHero v-bind="hero" />

        <TrailConnector from="center" :to="textSide('start')" class="md:hidden" />

        <StorySection
          id="start"
          kicker="kdo jsme"
          title="Ahoj! My jsme Záře!"
          v-bind="story('start')"
        >
          <p class="prose-body mb-3.5 max-w-[52ch]">
            Dva skautské oddíly z Dejvic — jeden pro
            <strong class="font-semibold text-ink">mladší</strong> a druhý pro
            <strong class="font-semibold text-ink">starší</strong> děti. Jsme parta kluků a holek,
            od malých po velké.
          </p>
          <p class="prose-body mb-6 max-w-[52ch]">
            Pravidelně se scházíme, vyrážíme na výpravy do přírody a v létě na tábor.
          </p>
          <PolaroidPhoto caption="Naše parta na výpravě" :tilt="-1.6" />
        </StorySection>

        <TrailConnector :from="textSide('start')" :to="textSide('oddily')" class="md:hidden" />

        <StorySection
          id="oddily"
          kicker="dva oddíly"
          title="Mladší a starší"
          v-bind="story('oddily')"
        >
          <TroopList class="mb-3.5" />
          <p class="ml-auto max-w-[46ch] text-[17px] leading-[1.7] text-pretty">
            Každé dítě chodí na jednu schůzku týdně — podle toho, do kterého oddílu patří.
          </p>
        </StorySection>

        <TrailConnector :from="textSide('oddily')" :to="textSide('cinnost')" class="md:hidden" />

        <StorySection
          id="cinnost"
          kicker="co děláme"
          title="Parta, příroda, samostatnost"
          v-bind="story('cinnost')"
        >
          <p class="prose-body mb-3.5 max-w-[52ch]">
            Na schůzkách hrajeme, vyrábíme, učíme se praktické věci a plánujeme, kam vyrazíme
            příště. Na výpravách spíme v chatě i v lese pod plachtou, vaříme na ohni a chodíme i v
            dešti — komfortní zónu posouváme kousek po kousku dál.
          </p>
          <p class="prose-body mb-5 max-w-[52ch]">
            Nejde nám o jednu dovednost jako v kroužku. Jde o partu, o samostatnost a o to, aby se
            na sebe děti mohly spolehnout.
          </p>
          <PolaroidPhoto caption="Schůzka v klubovně" :tilt="1.8" />
        </StorySection>

        <section id="proc" data-section class="mx-auto max-w-[640px] py-12 text-center md:py-6">
          <p class="kicker mb-2">proč skauting</p>
          <h3 class="section-title mb-4">Proč nechat dítě vyrůst ve skautu?</h3>
          <p class="prose-body mb-3.5">
            Skauting je celosvětově největší výchovné hnutí pro mládež. Na rozdíl od zájmových
            kroužků přináší rozmanité aktivity a jeho cílem je celkový rozvoj dětí — od fyzického,
            přes týmové a sociální dovednosti, až po důraz na hodnoty a morálku. To vše podává lehce
            a přirozeně, formou her v partě vrstevníků.
          </p>
          <p class="m-0 text-[17px]">
            <a href="https://www.skaut.cz/skauting/proc-skauting/">Proč se stát skautem?</a>
          </p>
        </section>

        <StorySection
          id="rok"
          kicker="jak to u nás chodí"
          title="Od schůzky k táboru"
          v-bind="story('rok')"
        >
          <div class="ml-auto flex max-w-[44ch] flex-col gap-4">
            <p class="m-0 text-[17px] leading-[1.7] sm:text-[17.5px]">
              <span class="font-hand text-[25px] text-green">každý týden</span> — schůzka v
              klubovně. Hry, dovednosti a plánování toho, kam vyrazíme příště. Scházíme se
              pravidelně, protože právě tím parta drží pohromadě.
            </p>
            <p class="m-0 text-[17px] leading-[1.7] sm:text-[17.5px]">
              <span class="font-hand text-[25px] text-green">jednou za měsíc</span> — výprava. Do
              chaty i do lesa pod plachtu, ve sněhu i v dešti, na vodu i na kolo. Vyrážíme v pátek,
              v neděli jsme zpátky.
            </p>
            <p class="m-0 text-[17px] leading-[1.7] sm:text-[17.5px]">
              <span class="font-hand text-[25px] text-green">jednou za rok</span> — tábor. Dva až
              tři týdny na louce v jižních Čechách, vrchol celého roku.
            </p>
          </div>
        </StorySection>

        <TrailConnector :from="textSide('rok')" :to="textSide('klubovna')" class="md:hidden" />

        <StorySection
          id="klubovna"
          kicker="naše klubovna"
          title="Kafkova 23, Dejvice"
          v-bind="story('klubovna')"
        >
          <p class="prose-body mb-5 max-w-[40ch]">
            Kousek od Kulaťáku. Ve vnitrobloku za klubovnou je hřiště, kam často na schůzkách
            chodíme.
          </p>
          <ul class="m-0 mb-5 flex list-none flex-col gap-3 p-0">
            <li class="flex items-center gap-3">
              <svg
                viewBox="0 0 34 34"
                class="size-[30px] flex-none"
                fill="none"
                stroke="var(--color-brown)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="17" cy="17" r="13" />
                <path d="M10 22 L12 12 L17 19 L22 12 L24 22" />
              </svg>
              <span class="text-[17px]">metro A — Dejvická</span>
            </li>
            <li class="flex items-center gap-3">
              <svg
                viewBox="0 0 34 34"
                class="size-[30px] flex-none"
                fill="none"
                stroke="var(--color-brown)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M9 6 L25 6 L25 24 L9 24 Z M9 12 L25 12 M13 28 L21 28 M17 6 L17 2" />
                <circle cx="13" cy="26" r="2" />
                <circle cx="21" cy="26" r="2" />
              </svg>
              <span class="text-[17px]">tramvaj a autobus — Vítězné náměstí</span>
            </li>
          </ul>
          <PolaroidPhoto
            :src="clubhouseMap"
            alt="Mapa — Kafkova 544/23, Dejvice"
            caption="Od Dejvické tři minuty pěšky"
            :tilt="-1.2"
            :max-width="380"
            :width="988"
            :height="518"
          />
        </StorySection>

        <TrailConnector :from="textSide('klubovna')" :to="textSide('tabor')" class="md:hidden" />

        <StorySection
          id="tabor"
          kicker="vrchol roku"
          title="Tábor v jižních Čechách"
          v-bind="story('tabor')"
        >
          <p class="prose-body mb-3.5 ml-auto max-w-[48ch]">
            Začátkem července vyrážíme na dva až tři týdny do přírody, na táborovou louku. V
            posledních letech míváme tábory rozdělené — jeden u Soběnova a druhý u Slavče. Spíme v
            týpí či podsadových stanech, vaříme na kamnech a myjeme se v řece. Většinou hrajeme
            celotáborovou hru, která se táhne celým táborem.
          </p>
          <p class="mb-6 font-hand text-[24px] leading-tight sm:text-[26px]">
            <RouterLink to="/historie"
              >historie oddílu a všechny naše tábory od roku 1976</RouterLink
            >
          </p>
          <div class="flex justify-end">
            <PolaroidPhoto caption="Táborová louka" :tilt="-2.2" />
          </div>
        </StorySection>

        <section id="pridat-se" data-section class="pt-12 pb-10 md:pt-6">
          <JoinCard :recruitment="recruitment" />
        </section>

        <section id="otazky" data-section class="mx-auto max-w-[800px] pt-5">
          <p class="m-0 mb-1 text-center font-hand text-[27px] text-red sm:text-[30px]">
            ptejte se, rádi odpovíme
          </p>
          <h3
            class="m-0 mb-6 text-center text-[26px] font-medium tracking-[-0.03em] text-ink sm:text-[38px]"
          >
            Otázky rodičů
          </h3>
          <FaqAccordion :items="FAQ" />
        </section>

        <StorySection v-bind="story('cil')" class="pt-12 md:pt-10 md:pb-4">
          <h2
            class="m-0 ml-auto max-w-[20ch] font-hand text-[36px] leading-[1.1] font-semibold text-balance text-ink sm:text-[48px] lg:text-[60px]"
          >
            hory, města, vesnice, pozná Záře Dejvice!
          </h2>
        </StorySection>
      </div>
    </main>

    <PublicFooter />
    <DrawingPicker v-if="DrawingPicker" v-model="overrides" v-model:hero="hero" :slots="STORIES" />
  </div>
</template>
