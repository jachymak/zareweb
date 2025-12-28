<script setup>
import HelloWorld from "@/components/HelloWorld.vue";
</script>

<template>
  <div>
    <div class="mx-12 my-4 grid gap-4 sm:grid-cols-12">
      <div class="min-h-[100px] rounded-lg sm:col-span-7">
        <div class="grid grid-cols-12">
          <div class="col-span-12">
            <h3 class="text-xl font-semibold">Nazdar!</h3>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-y-3 md:gap-x-5 md:gap-y-0">
          <div class="col-span-12 sm:col-span-10">
            <div class="mx-auto">
              <p>
                My jsme Záře. Jsme dva skautské oddíly – jeden pro mladší, druhý
                pro starší děti. Členové u nás obvykle nastupují do mladších
                vlčušek a poté přecházejí do starších skautů. Spolu s dalšími
                oddíly nás zastřešuje středisko
                <a href="https://stredisko-sipka.skauting.cz" class="underline"
                  >Šipka</a
                >.
              </p>

              <p class="mt-4">
                Každý týden se scházíme v naší klubovně – hrajeme hry, povídáme
                si, smějeme se, debatujeme, vyrábíme a spoustu dalšího. Jednou
                až dvakrát do měsíce vyrážíme na výpravy.
              </p>

              <p class="mt-4">
                Jsme skauti a to znamená, že máme svoje zásady, konáme dobré
                skutky, řídíme se dle našich zákonů a jednáme tak, abychom co
                nejlépe dodrželi náš slib. Více o samotném skautingu se můžeš
                dočíst
                <a href="https://www.skaut.cz/skauting/" class="underline"
                  >zde</a
                >.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="my-auto min-h-[100px] rounded-lg sm:col-span-5">
        <div class="col-span-12 md:col-span-5">
          <!-- Card 1 -->
          <div class="mx-auto pb-5">
            <div class="rounded-lg border border-white p-0">
              <div class="px-2 py-3">
                <div class="grid grid-cols-12">
                  <!-- Left -->
                  <div class="col-span-6 flex flex-col justify-center pr-0">
                    <h6 class="block font-semibold sm:hidden">220. Vlčušky</h6>
                    <h6 class="hidden font-semibold sm:block">
                      220. Záře – vlčušky
                    </h6>

                    <p class="mt-2 mb-0 block sm:hidden">od 7 do 11 let</p>
                    <p class="mt-2 mb-0 hidden sm:block">
                      kluci a holky od 7 do 11 let
                    </p>
                  </div>

                  <!-- Right -->
                  <div
                    class="col-span-6 flex flex-col justify-center text-center"
                  >
                    <p class="m-0 block sm:hidden">po 17:00 – 19:00</p>
                    <p class="m-0 hidden sm:block">pondělí 17:00 – 19:00</p>

                    <p class="m-0 italic">nebo</p>

                    <p class="m-0 block sm:hidden">čt 17:00 – 19:00</p>
                    <p class="m-0 hidden sm:block">čtvrtek 17:00 – 19:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="mx-auto">
            <div class="rounded-lg border border-white p-0">
              <div class="px-2 py-3">
                <div class="grid grid-cols-12">
                  <!-- Left -->
                  <div class="col-span-6 flex flex-col justify-center pr-0">
                    <h6 class="font-semibold">222. Záře</h6>

                    <p class="mt-2 mb-0 block sm:hidden">od 12 do 15 let</p>
                    <p class="mt-2 mb-0 hidden sm:block">
                      kluci a holky od 12 do 15 let
                    </p>
                  </div>

                  <!-- Right -->
                  <div
                    class="col-span-6 flex flex-col justify-center text-center"
                  >
                    <p class="m-0 block sm:hidden">út 17:00 – 19:00</p>
                    <p class="m-0 hidden sm:block">úterý 17:00 – 19:00</p>

                    <p class="m-0 italic">nebo</p>

                    <p class="m-0 block sm:hidden">st 17:00 – 19:00</p>
                    <p class="m-0 hidden sm:block">středa 17:00 – 19:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-11 mt-5 mb-5 md:mt-12 md:mb-0">
      <div class="rounded-xl border border-white px-4 pt-4 pb-3">
        <h6 class="mb-2 font-semibold">Proč nechat dítě vyrůst ve skautu?</h6>
        <p>
          Skauting je celosvětově největší výchovné hnutí pro mládež. Na rozdíl
          od zájmových kroužků přináší rozmanité aktivity a jeho cílem je
          celkový rozvoj dětí – od fyzického, přes rozvoj týmových a sociálních
          dovedností, až po důraz na hodnoty a morálku. To vše skauting podává
          lehce a přirozeně formou her a aktivit v přirozené partě mladých lidí!
        </p>
      </div>
    </div>

    <div class="mx-12 my-4 grid gap-4 sm:grid-cols-12"></div>
  </div>
</template>

<style scoped></style>
