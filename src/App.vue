<script setup>
import VypravaForm from "@/components/VypravaForm.vue";
import Vypravnik from "@/components/Vypravnik/Vypravnik.vue";
import EventInfoForm from "@/components/EventInfoForm.vue";
import EventInfo from "@/components/EventInfo.vue";
import {computed, onMounted, ref, watch} from "vue";
import EventItemsCard from "@/components/EventItemsCard.vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import router from "@/router/router.js";

const currentEventId = ref('');

const handleEventInfoClicked = (id) => {
  currentEventId.value = id
}

const isLoggedIn = ref(false);

let auth;
onMounted(() => {
  auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) isLoggedIn.value = true;
    else isLoggedIn.value = false;
  });
});

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/");
  })
};

</script>

<template>
  <nav>
    <router-link to="/">Home</router-link>
    <router-link to="/login">Login</router-link>
    <router-link to="/register">Register</router-link>
    <router-link to="/member">Member</router-link>

  </nav>
  <button @click="handleSignOut" v-if="isLoggedIn">Odhlásit se</button>
  <router-view />
  <!--<div class="container-fluid mt-5 px-5 mb-5">
    <div class="row">
      <div class="col-12 col-md-6">
        <event-info event-id="2024-05-24-a-sportovni-vyprava" />
      </div>
      <div class="col-12 col-md-6 ps-5">
        <event-items-card event-id="2024-05-24-a-sportovni-vyprava"></event-items-card>
      </div>
    </div>


    <div class="row">
      <div class="col-12 col-md-6">
        <vyprava-form />
      </div>
      <div class="col-12 col-md-6">
        <vypravnik @eventInfoClicked="handleEventInfoClicked" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        <event-info-form :id="currentEventId" />
      </div>
      <div class="col"></div>
    </div>
  </div>-->
</template>
