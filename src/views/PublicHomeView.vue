<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { isFirstPage } from '@/router'
import { usePublicSettingsStore } from '@/stores/publicSettings'
import { FAQ } from '@/content/faq'
import TRAIL_TWEAKS from '@/content/trailTweaks.json'
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
import photoTrip400 from '@/assets/public/foto-vyprava-400.webp'
import photoTrip800 from '@/assets/public/foto-vyprava-800.webp'
import photoMeeting400 from '@/assets/public/foto-schuzka-400.webp'
import photoMeeting800 from '@/assets/public/foto-schuzka-800.webp'
import photoCamp400 from '@/assets/public/foto-tabor-400.webp'
import photoCamp800 from '@/assets/public/foto-tabor-800.webp'

// Public home — SPEC §2.1. Reads settings/public, writes nothing.
const settingsStore = usePublicSettingsStore()
const { recruitment } = storeToRefs(settingsStore)

onMounted(() => settingsStore.load())

// Props for a StorySection with a raster drawing (400 px and 800 px wide).
const drawing = (small, large) => ({ sketch: small, srcset: `${small} 400w, ${large} 800w` })

// Props for a PolaroidPhoto (400 px and 800 px wide).
const photo = (small, large, height) => ({
  src: large,
  srcset: `${small} 400w, ${large} 800w`,
  width: 800,
  height,
})

// Drawing and side of each StorySection; the DrawingPicker (dev only) can
// override them to try out variants from design-reference/drawings.
const STORIES = [
  // A photo instead of a drawing (not in the DrawingPicker).
  { id: 'start', sketchSide: 'right' },
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
    defaultFile: 'tabor-3.png',
    sketchSide: 'left',
    ...drawing(camp400, camp800),
  },
  {
    id: 'cil',
    label: 'Závěr (konec cesty)',
    defaultFile: 'dejvice-3.png',
    sketchSide: 'left',
    ...drawing(dejvice400, dejvice800),
  },
]
const overrides = ref({})
// { size, layout } of the HomeHero variant under trial.
const hero = ref({})
const DrawingPicker = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/public/DrawingPicker.vue'))
  : null

// Hand tweaks of the trail; the TrailEditor (dev only) edits and saves them.
const trailTweaks = ref(TRAIL_TWEAKS)
const trailRoute = ref(null)
const TrailEditor = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/public/TrailEditor.vue'))
  : null
// Kept across the reload that saving the tweaks file triggers.
const EDITING_KEY = 'zare:trail-editing'
const trailEditing = ref(readEditing())
function readEditing() {
  try {
    return import.meta.env.DEV && sessionStorage.getItem(EDITING_KEY) === '1'
  } catch {
    return false
  }
}
function setTrailEditing(on) {
  trailEditing.value = on
  try {
    sessionStorage.setItem(EDITING_KEY, on ? '1' : '')
  } catch {
    // Private window.
  }
}

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
      <TrailPath
        :key="JSON.stringify([overrides, hero])"
        :tweaks="trailTweaks"
        class="hidden md:block"
        @route="trailRoute = $event"
      />
      <TrailEditor
        v-if="TrailEditor && trailEditing"
        v-model:tweaks="trailTweaks"
        :route="trailRoute"
        :saved="TRAIL_TWEAKS"
        @close="setTrailEditing(false)"
      />

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
          <p class="prose-body m-0 max-w-[52ch]">
            Pravidelně se scházíme, vyrážíme na výpravy do přírody a v létě na tábor.
          </p>
          <!-- The two troops beside the greeting; the trail runs between them. -->
          <template #aside>
            <div id="oddily" class="w-full text-left">
              <p class="kicker mb-2 text-right">dva oddíly</p>
              <h3 class="section-title mb-4 text-right">Mladší a starší</h3>
              <TroopList class="mb-3.5" />
              <p class="m-0 text-[17px] leading-[1.7] text-pretty">
                Každé dítě chodí na jednu schůzku týdně — podle toho, do kterého oddílu patří.
              </p>
            </div>
          </template>
        </StorySection>

        <TrailConnector :from="textSide('start')" to="center" class="md:hidden" />

        <!-- Three photos side by side; the trail goes round them. -->
        <section
          data-section
          class="mx-auto grid max-w-[400px] grid-cols-1 justify-items-center gap-8 py-4 sm:max-w-none sm:grid-cols-3 sm:gap-5 md:py-8 lg:gap-8"
        >
          <PolaroidPhoto
            v-bind="photo(photoTrip400, photoTrip800, 600)"
            alt="Děti z oddílu na výpravě"
            caption="Naše parta na výpravě"
            :tilt="-1.8"
          />
          <PolaroidPhoto
            v-bind="photo(photoMeeting400, photoMeeting800, 533)"
            alt="Děti na schůzce"
            caption="Schůzka"
            :tilt="1.4"
            class="sm:mt-6"
          />
          <PolaroidPhoto
            v-bind="photo(photoCamp400, photoCamp800, 533)"
            alt="Podsadové stany na táborové louce"
            caption="Táborová louka"
            :tilt="-1.1"
          />
        </section>

        <TrailConnector from="center" :to="textSide('cinnost')" class="md:hidden" />

        <!-- Text lower, drawing higher: further from the photos above, but the
             drawing still close under them. -->
        <StorySection
          id="cinnost"
          kicker="co děláme"
          title="Parta, příroda, samostatnost"
          v-bind="story('cinnost')"
          class="md:[&>div:first-child]:pt-16 md:[&>div:last-child]:-mt-10"
        >
          <p class="prose-body mb-3.5 max-w-[52ch]">
            Na schůzkách hrajeme, vyrábíme, učíme se praktické věci a plánujeme, kam vyrazíme
            příště. Na výpravách spíme v chatě i v lese pod plachtou, vaříme na ohni a chodíme i v
            dešti — komfortní zónu posouváme kousek po kousku dál.
          </p>
          <p class="prose-body m-0 max-w-[52ch]">
            Nejde nám o jednu dovednost jako v kroužku. Jde o partu, o samostatnost a o to, aby se
            na sebe děti mohly spolehnout.
          </p>
        </StorySection>

        <!-- Set apart by a soft painted wash (no outline, unlike the join card). -->
        <section id="proc" data-section class="relative mx-auto my-10 max-w-[1060px] md:my-4">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            class="absolute inset-0 size-full"
          >
            <path
              d="M4 9 C18 3 38 6 58 3 C76 1 90 5 96 10 C99 32 96 56 98 79 C99 90 94 96 86 97 C64 99 42 95 21 98 C9 99 3 94 2 84 C1 60 5 34 4 9 Z"
              fill="var(--color-sand)"
            />
          </svg>
          <div class="relative px-6 py-9 text-center sm:px-12 md:py-11">
            <p class="kicker mb-2">proč skauting</p>
            <h3 class="section-title mb-4">Proč nechat dítě vyrůst ve skautu?</h3>
            <p class="prose-body mb-3.5 text-pretty">
              Skauting je celosvětově největší výchovné hnutí pro mládež. Na rozdíl od zájmových
              kroužků přináší rozmanité aktivity a jeho cílem je celkový rozvoj dětí — od fyzického,
              přes týmové a sociální dovednosti, až po důraz na hodnoty a morálku. To vše podává
              lehce a přirozeně, formou her v partě vrstevníků.
            </p>
            <p class="m-0 text-[17px]">
              <a href="https://www.skaut.cz/skauting/proc-skauting/">Proč se stát skautem?</a>
            </p>
          </div>
        </section>

        <StorySection
          id="rok"
          kicker="jak to u nás chodí"
          title="Od schůzky k táboru"
          v-bind="story('rok')"
        >
          <div class="flex max-w-[44ch] flex-col gap-4">
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
          <p class="prose-body mb-3.5 max-w-[48ch]">
            Začátkem července vyrážíme na dva až tři týdny do přírody, na táborovou louku. V
            posledních letech míváme tábory rozdělené — jeden u Soběnova a druhý u Slavče. Spíme v
            týpí či podsadových stanech, vaříme na kamnech a myjeme se v řece. Většinou hrajeme
            celotáborovou hru, která se táhne celým táborem.
          </p>
          <p class="m-0 font-hand text-[24px] leading-tight sm:text-[26px]">
            <RouterLink to="/historie"
              >historie oddílu a všechny naše tábory od roku 1976</RouterLink
            >
          </p>
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

        <!-- The trail ends here, at the foot of the road into Dejvice. -->
        <StorySection
          id="cil"
          v-bind="story('cil')"
          :trail-end="{ x: 0.42, y: 1.03 }"
          class="pt-12 md:pt-10 md:pb-4"
        >
          <h2
            class="m-0 max-w-[20ch] font-hand text-[36px] leading-[1.1] font-semibold text-balance text-ink sm:text-[48px] lg:text-[60px]"
          >
            hory, města, vesnice, pozná Záře Dejvice!
          </h2>
        </StorySection>
      </div>
    </main>

    <PublicFooter />
    <DrawingPicker
      v-if="DrawingPicker"
      v-model="overrides"
      v-model:hero="hero"
      :slots="STORIES.filter((s) => s.label)"
      @edit-trail="setTrailEditing(true)"
    />
  </div>
</template>
