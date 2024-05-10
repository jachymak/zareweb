<script setup>
  import ChildCard from "@/components/Member/ChildCard.vue";

  const props = defineProps({
    userData: Object
  });

  const childInfo = {
    nickname: "Lvice",
    name: "Johana",
    surname: "Kallistová"
  }

  const childInfo2 = {
    nickname: "Róza",
    name: "Róza",
    surname: "Kallistová"
  }

</script>

<template>
  <section>
    <div class="container-fluid bg-sand p-3 me-5">
      <div class="row align-items-center mb-3">
        <div class="col">
          <h3>Ahoj!</h3>
        </div>
        <div class="col text-end">
          <h6>{{ userData.email }}</h6>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <child-card :data="childInfo">
            <div class="row">
              <div class="col">
                výpravy: 2/4
              </div>
              <div class="col">
                schůzky: 67 %
              </div>
            </div>
          </child-card>

          <child-card :data="childInfo2">
            <div class="row">
              <div class="col">
                výpravy: 3/4
              </div>
              <div class="col">
                schůzky: 80 %
              </div>
            </div>
          </child-card>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>