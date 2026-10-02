<script setup>
import { defineAsyncComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import { isFirstPage } from '@/router'
import { FAQ } from '@/content/faq'
import TRAIL_TWEAKS from '@/content/trailTweaks.json'
import PublicHeader from '@/components/public/PublicHeader.vue'
import PublicFooter from '@/components/public/PublicFooter.vue'
import StorySection from '@/components/public/StorySection.vue'
import TrailPath from '@/components/public/TrailPath.vue'
import TrailDivider from '@/components/public/TrailDivider.vue'
import PolaroidPhoto from '@/components/public/PolaroidPhoto.vue'
import TroopList from '@/components/public/TroopList.vue'
import JoinCard from '@/components/public/JoinCard.vue'
import FaqAccordion from '@/components/public/FaqAccordion.vue'
import IntroScreen from '@/components/public/IntroScreen.vue'
import HomeHero from '@/components/public/HomeHero.vue'
import HomeFinale from '@/components/public/HomeFinale.vue'
import clubhouseMap from '@/assets/public/mapa-klubovna.svg?raw'
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
import photoGame400 from '@/assets/public/foto-hra-400.webp'
import photoGame800 from '@/assets/public/foto-hra-800.webp'
import photoFire400 from '@/assets/public/foto-ohen-400.webp'
import photoFire800 from '@/assets/public/foto-ohen-800.webp'

// Public home — SPEC §2.1. Reads settings/public, writes nothing.
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
    defaultFile: 'pruvodce-4.png',
    sketchSide: 'right',
    ...drawing(guide400, guide800),
  },
  {
    id: 'rok',
    label: 'Od schůzky k táboru',
    defaultFile: 'rozcestnik-3.png',
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
    defaultFile: 'dejvice-2.png',
    sketchSide: 'left',
    ...drawing(dejvice400, dejvice800),
  },
]
// The troop's year in the „Od schůzky k táboru“ section.
const YEAR = [
  {
    when: 'každý týden',
    what: 'Schůzka',
    text: 'Díky schůzkám jsme spolu pořád v kontaktu, i když zrovna nikam nevyrážíme. Často je trávíme venku na hřišti, jindy v klubovně.',
  },
  {
    when: 'jednou až dvakrát za měsíc',
    what: 'Výprava',
    text: 'Většinou každý oddíl zvlášť, občas oba spolu. Spíme v chatě i pod plachtou, vyrážíme v pátek a v neděli jsme zpátky.',
  },
  {
    when: 'každé léto',
    what: 'Tábor',
    text: 'Několik týdnů v přírodě, na které se pak vzpomíná nejdéle. Pro mnohé vrchol celého roku.',
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
        :bend="!trailEditing"
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

        <StorySection
          id="start"
          kicker="kdo jsme"
          title="Ahoj! My jsme Záře!"
          v-bind="story('start')"
          class="max-md:[&>div:last-child]:mt-0"
        >
          <p class="prose-body mb-3.5 max-w-[52ch]">
            Dva skautské oddíly z Dejvic. Jsme parta kluků a holek, od malých po velké. Většina z
            nás tu začínala jako malá vlčuška a dnes sami vedeme ty mladší.
          </p>
          <p class="prose-body m-0 max-w-[52ch]">
            Pravidelně se scházíme, vyrážíme na výpravy do přírody a v létě na tábor. Jsme parta na
            celý život.
          </p>
          <!-- The two troops beside the greeting; the trail runs between them. -->
          <template #aside>
            <div id="oddily" class="w-full text-left">
              <TrailDivider class="md:hidden" />
              <p class="kicker mb-2 md:text-right">dva oddíly</p>
              <h3 class="section-title mb-4 md:text-right">Mladší a starší</h3>
              <TroopList class="mb-3.5" />
              <p class="m-0 text-[17px] leading-[1.7] text-pretty">
                Každé dítě chodí na jednu schůzku týdně.
              </p>
            </div>
          </template>
        </StorySection>

        <!-- Three photos side by side; the trail goes round them (inset on small
             desktops to leave it room). -->
        <section
          data-section
          class="mx-auto grid max-w-[280px] grid-cols-1 items-start justify-items-center gap-8 pt-10 pb-12 sm:max-w-none sm:py-4 sm:grid-cols-3 sm:gap-5 md:py-8 md:max-xl:px-10 lg:gap-8"
        >
          <PolaroidPhoto
            v-bind="photo(photoTrip400, photoTrip800, 533)"
            alt="Děti s krosnami a karimatkami jdou loukou na výpravě"
            caption="Na výpravě"
            :tilt="-1.8"
          />
          <PolaroidPhoto
            v-bind="photo(photoGame400, photoGame800, 533)"
            alt="Vedoucí v kostýmech hrají dětem divadlo na táborové louce"
            caption="Celotáborová hra"
            :tilt="1.4"
            class="sm:mt-6"
          />
          <PolaroidPhoto
            v-bind="photo(photoFire400, photoFire800, 533)"
            alt="Skauti v krojích kolem táborového ohně"
            caption="U táborového ohně"
            :tilt="-1.1"
          />
        </section>

        <!-- Text lower, drawing higher: further from the photos above, but the
             drawing still close under them. On mobile the drawing is cropped at the
             sides so the figures (left of the canvas centre) sit centred. -->
        <StorySection
          id="cinnost"
          kicker="co děláme"
          title="Nejen uzly a ohně"
          v-bind="story('cinnost')"
          class="max-md:[&>div:last-child]:-mt-14 max-md:[&_img]:aspect-[600/924] max-md:[&_img]:w-[min(240px,68%)] max-md:[&_img]:object-cover max-md:[&_img]:object-[22.5%_0] md:[&>div:first-child]:pt-16 md:[&>div:last-child]:-mt-10"
        >
          <p class="prose-body m-0 max-w-[52ch]">
            Skauting nemusí být jen o uzlování a rozdělávání ohňů. Snažíme se, aby dával smysl i
            dnes. Na schůzkách hrajeme hry, diskutujeme, tvoříme a učíme se nové věci. Na výpravách
            jdeme dál, i když leje a je kolem tma jako v pytli. Máme spolu srandu, zažíváme
            dobrodružství, učíme se brát zodpovědnost a mít respekt k ostatním. A víme, že se na sebe můžeme spolehnout.
          </p>
        </StorySection>

        <!-- Set apart by a soft painted wash (no outline, unlike the join card). -->
        <section
          id="proc"
          data-section
          data-trail-over
          class="relative mx-auto my-10 max-w-[1060px] md:my-4"
        >
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
          class="max-md:[&_img]:w-[230px]"
        >
          <div class="flex max-w-[44ch] flex-col gap-4 md:text-justify md:hyphens-auto">
            <p
              v-for="step in YEAR"
              :key="step.when"
              class="m-0 text-[17px] leading-[1.7] sm:text-[17.5px]"
            >
              <span class="block font-hand text-[25px] leading-tight text-green">{{
                step.when
              }}</span>
              <strong class="font-semibold text-ink">{{ step.what }}.</strong> {{ step.text }}
            </p>
          </div>
        </StorySection>

        <TrailDivider class="md:hidden" />

        <StorySection
          id="klubovna"
          kicker="naše klubovna"
          title="Kafkova 23, Dejvice"
          v-bind="story('klubovna')"
          class="max-md:[&>div:last-child]:mt-12"
        >
          <p class="prose-body mb-5 max-w-[40ch]">
            Klubovnu máme kousek od Kulaťáku. Ve vnitrobloku za ní je hřiště, kam na schůzkách
            často chodíme.
          </p>
          <!-- Icons from the original web: the Prague metro logo and a bus. -->
          <ul class="m-0 mb-5 flex list-none flex-col gap-3 p-0 text-brown">
            <li class="flex items-center gap-3">
              <span class="grid w-10 flex-none place-items-center opacity-65">
                <svg viewBox="0 0 320.2 160.8" class="w-9" fill="currentColor" aria-hidden="true">
                  <path
                    d="M96.94 97.69 222.5 98.17 159.5 160.8 96.94 97.69zM274 47.12 230.1 46.95 229.9 90.82 274 47.12zM45.89 46.24 89.69 46.41 89.5 90.21 45.89 46.24zM320.2 1.234 230.3.8878 230.1 39.5 281.5 39.7 320.2 1.234zM0 0 89.86.3459 89.71 38.96 38.46 38.76 0 0zM159.9 36.94 194.4.7542 222.8.853 222.5 90.71 197 90.61 197.2 35 159.8 72.84 122.6 34.72 122.4 90.33 96.98 90.23 97.33.3753 125.7.4906 159.9 36.94z"
                  />
                </svg>
              </span>
              <span class="text-[17px] text-text">metro A — <strong class="font-semibold text-ink">Dejvická</strong></span>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid w-10 flex-none place-items-center opacity-65">
                <svg viewBox="0 0 16 16" class="size-[26px]" fill="currentColor" aria-hidden="true">
                  <path
                    d="M5 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-6-1a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm1-6c-1.876 0-3.426.109-4.552.226A.5.5 0 0 0 3 4.723v3.554a.5.5 0 0 0 .448.497C4.574 8.891 6.124 9 8 9s3.426-.109 4.552-.226A.5.5 0 0 0 13 8.277V4.723a.5.5 0 0 0-.448-.497A44 44 0 0 0 8 4m0-1c-1.837 0-3.353.107-4.448.22a.5.5 0 1 1-.104-.994A44 44 0 0 1 8 2c1.876 0 3.426.109 4.552.226a.5.5 0 1 1-.104.994A43 43 0 0 0 8 3"
                  />
                  <path
                    d="M15 8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1V2.64c0-1.188-.845-2.232-2.064-2.372A44 44 0 0 0 8 0C5.9 0 4.208.136 3.064.268 1.845.408 1 1.452 1 2.64V4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v3.5c0 .818.393 1.544 1 2v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h6v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2c.607-.456 1-1.182 1-2zM8 1c2.056 0 3.71.134 4.822.261.676.078 1.178.66 1.178 1.379v8.86a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5V2.64c0-.72.502-1.301 1.178-1.379A43 43 0 0 1 8 1"
                  />
                </svg>
              </span>
              <span class="text-[17px] text-text">tram/bus — <strong class="font-semibold text-ink">Vítězné náměstí</strong></span>
            </li>
          </ul>
          <!-- Drawn from OpenStreetMap by scripts/clubhouse-map.js; inline so it
               uses the page's fonts and colours. Opens the address on Mapy.cz. -->
          <PolaroidPhoto caption="Od Dejvické tři minuty pěšky" :tilt="-1.2" :max-width="380">
            <a
              href="https://mapy.cz/zakladni?q=Kafkova%20544%2F23%2C%20Praha%206"
              title="Otevřít na Mapy.cz"
              class="block [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              v-html="clubhouseMap"
            />
          </PolaroidPhoto>
        </StorySection>

        <TrailDivider class="md:hidden" />

        <StorySection
          id="tabor"
          kicker="vrchol roku"
          title="Tábor v jižních Čechách"
          v-bind="story('tabor')"
          class="max-md:[&>div:last-child]:-mt-2"
        >
          <p class="prose-body mb-3.5 max-w-[48ch]">
            Začátkem července vyrážíme na dva až tři týdny do přírody. Na Kovářovu louku
            u&nbsp;Soběnova jezdíme už přes 40 let. Dnes tam táboří vlčušky, skauti a&nbsp;skautky mají
            svůj tábor u&nbsp;Slavče.
          </p>
          <p class="prose-body mb-3.5 max-w-[48ch]">
            Spíme v&nbsp;týpí či podsadových stanech, vaříme na kamnech a&nbsp;myjeme se v&nbsp;řece.
            Celý tábor obvykle provází celotáborová hra.
          </p>
          <p class="m-0 font-hand text-[24px] leading-tight max-md:hidden sm:text-[26px]">
            <RouterLink to="/historie"
              >historie oddílu od roku 1976</RouterLink
            >
          </p>
          <!-- On mobile in the drawing's empty sky, left of the smoke. -->
          <template #sketch-note>
            <p
              class="absolute top-[6%] left-0 m-0 w-[48%] font-hand text-[23px] leading-[1.15] md:hidden"
            >
              <RouterLink to="/historie">historie oddílu od&nbsp;roku&nbsp;1976</RouterLink>
            </p>
          </template>
        </StorySection>

        <section id="pridat-se" data-section data-trail-over class="pt-12 pb-10 md:pt-6">
          <JoinCard />
        </section>

        <!-- Narrower on small desktops, so the trail can pass beside it. -->
        <section id="otazky" data-section class="mx-auto max-w-[800px] pt-5 md:max-lg:px-8">
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
        <HomeFinale
          :sketch="story('cil').sketch"
          :srcset="story('cil').srcset"
          :trail-end="{ x: 0.32, y: 0.94 }"
        />
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
