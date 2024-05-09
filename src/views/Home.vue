<script setup>
  import MainFooter from "@/components/Home/MainFooter.vue";
  import Faq from "@/components/Home/Faq.vue";
  import HowToJoin from "@/components/Home/HowToJoin.vue";
  import Clubhouse from "@/components/Home/Clubhouse.vue";
  import WhyScouting from "@/components/Home/WhyScouting.vue";
  import MainHeader from "@/components/Home/MainHeader.vue";
</script>

<template>
  <main-header />

  <main>
    <div class="container mt-md-5 mt-3">
      <div class="row">
        <div class="col">
          <h3>Nazdar!</h3>
        </div>
      </div>
      <div class="row gy-3 gy-md-0 gx-md-5">
        <div class="col-md-7 col-12">
          <div class="mx-auto">
            <p>My jsme Záře. Jsme dva skautské oddíly - jeden pro mladší, druhý pro starší děti. Spolu s dalšími oddíly nás zastřešuje středisko Šipka.</p><p>Každý týden se scházíme v naší klubovně - hrajeme hry, povídáme si, smějeme se, debatujeme, vyrábíme a spoustu dalšího.</p><p>Jednou až dvakrát do měsíce vyrážíme na výpravy. Občas jsou společné pro oba oddíly, častěji ale jen pro jeden. Patříme mezi tzv. suchozemské skauty - ty, kteří se rádi drží pevné půdy pod nohama a neplaví se na lodích. Náš rok vyvrcholuje letním táborem. Dva až tři týdny žijeme v týpích a podsadových stanech na louce blízko Soběnova v jižních Čechách.</p><p>Jsme skauti a to znamená, že máme svoje zásady, konáme dobré skutky, řídíme se dle našich zákonů a jednáme tak, abychom co nejlépe dodrželi náš slib. Více o samotném skautingu se můžeš dočíst <a href="https://www.skaut.cz/skauting/">zde</a>.</p>

          </div>
        </div>
        <div class="col-md-5 col-12">
          <div class="row mx-auto pb-5">
            <div class="card text-white p-0 bg-navy">
              <div class="card-body px-2 py-3">
                <div class="container-fluid">
                  <div class="row">
                    <div class="col-6 pe-0 align-content-center">
                      <div class="row">
                        <h6 class="sb">220. Záře - vlčušky</h6>
                      </div>
                      <div class="row">
                        <p class="mt-2 mb-0">kluci a holky od 7 do 11 let</p>
                      </div>
                    </div>
                    <div class="col-6 align-content-center">
                      <div class="row text-center">
                        <p class="m-0">pondělí 17:00 - 19:00</p>
                      </div>
                      <div class="row text-center">
                        <p class="m-0">
                          <i>nebo</i>
                        </p>
                      </div>
                      <div class="row text-center">
                        <p class="m-0">čtvrtek 17:00 - 19:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row mx-auto">
            <div class="card text-white p-0 bg-navy">
              <div class="card-body px-2 py-3">
                <div class="container-fluid">
                  <div class="row">
                    <div class="col-6 pe-0 align-content-center">
                      <div class="row">
                        <h6 class="sb">220. Záře - skauti</h6>
                      </div>
                      <div class="row">
                        <p class="mt-2 mb-0">kluci a holky od 12 do 15 let</p>
                      </div>
                    </div>
                    <div class="col-6 align-content-center">
                      <div class="row text-center">
                        <p class="m-0">úterý 17:00 - 19:00</p>
                      </div>
                      <div class="row text-center">
                        <p class="m-0">
                          <i>nebo</i>
                        </p>
                      </div>
                      <div class="row text-center">
                        <p class="m-0">středa 17:00 - 19:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mt-md-4 py-md-0 py-5">
      <div class="row justify-content-center gy-md-0 gy-3">
        <div class="col-md-4 col-9">
          <img class="img-fluid" src="https://img42.rajce.idnes.cz/d4202/18/18627/18627728_618950f6a7091f12122961c181203341/images/Tbor202388.jpg?ver=0" alt="">
        </div>
        <div class="col-md-4 col-9">
          <img class="img-fluid" src="https://img42.rajce.idnes.cz/d4202/18/18627/18627728_618950f6a7091f12122961c181203341/images/Tbor2023213.jpg?ver=0" alt="">
        </div>
        <div class="col-md-4 col-9">
          <img class="img-fluid" src="https://img42.rajce.idnes.cz/d4202/18/18627/18627728_618950f6a7091f12122961c181203341/images/Tbor20238.jpg?ver=0" alt="">

        </div>
      </div>
    </div>

    <why-scouting />

    <!--<clubhouse />-->

    <how-to-join />

    <faq />

  </main>

  <main-footer />

</template>

<style scoped>

</style>