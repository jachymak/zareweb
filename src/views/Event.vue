<script setup>
  import { useRouter, useRoute } from 'vue-router';
  import EventInfo from "@/components/Event/EventInfo.vue";
  import EventItemsCard from "@/components/Event/EventItemsCard.vue";
  import ChildCard from "@/components/Member/ChildCard.vue";
  import SignUpBtn from "@/components/SignUpBtn.vue";

  import { useUserStore } from '@/stores/user.js'
  import {storeToRefs} from "pinia";

  const store = useUserStore()
  const { childrenData } = storeToRefs(store)
  store.authUser()

  const router = useRouter();
  const route = useRoute();
  const eventId = route.params.id;

  const handleExitClick = () => {
    router.push("/login");
  };



</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-end">
      <div class="col-1">
        <button class="btn btn-sm btn-light" @click="handleExitClick">X</button>
      </div>
    </div>

    <div class="row">
      <div class="col-12 col-md-7">

        <div class="row">
          <event-info :event-id="eventId" />
        </div>

        <div class="row">

          <div style="min-height: 400px">
            <form id="form" @submit.prevent="onSubmit">

              <child-card v-for="ch in childrenData" :data="ch">
                <sign-up-btn></sign-up-btn>
              </child-card>

            </form>
          </div>

        </div>
      </div>
      <div class="col-12 col-md-5 ps-5">
        <event-items-card :event-id="eventId"></event-items-card>
      </div>
    </div>
  </div>
</template>
