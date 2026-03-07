<script setup>
import LeftSide from "@/components/Home/LeftSide.vue";
import HelloWorld from "@/components/HelloWorld.vue";
</script>

<template>
  <div class="min-h-screen">
    <div class="grid grid-cols-12">
      <div class="col-span-1"></div>
      <div class="col-span-8">
        <div class="mx-12 mt-17 grid sm:grid-cols-12">
          <div class="my-auto mb-8 items-center gap-4 rounded-lg sm:col-span-8">
            <img
              src="@/assets/zare-logo-transparent.png"
              alt=""
              class="ms-2 mb-[-25px] h-60 w-auto brightness-0 invert filter"
            />
            <div class="text-left">
              <h1
                class="bg-gradient-to-r from-[#ff6a00] via-[#ffcc00] to-[#00c3ff] bg-clip-text text-5xl font-bold text-transparent"
              >
                Skautský oddíl Záře
                <!-- Kdy se scházíme -->
              </h1>
            </div>
          </div>
        </div>

        <!-- <hr class="mx-10 mb-10" /> -->

        <LeftSide />
      </div>

      <div class="col-span-3 hidden">
        <div class="ms-50 mt-90 text-4xl">
          <ul>
            <li>Hovno</li>
            <li class="mt-3">Hovno</li>
            <li class="mt-3">Hovno</li>
          </ul>
        </div>
      </div>
    </div>

    <!--<RouterLink class="m-72" to="/">Go to INTRO</RouterLink>-->
  </div>
</template>

<style scoped></style>

<!--
TODO

- tlačítko pro členy na intro stránce
- vrátit se na intro stránku při daní zpět
- přeskakování mezi textem na veřejnost stránce pomocí tlačítka pokračovat někde vpravo dole
- nadpis skautský oddíl záře se mění na "kdy se scházíme" "naše klubovna" ...

-->
