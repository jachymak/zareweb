<script setup>
import {getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {onMounted, ref} from "vue";
import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

import VypravaForm from "@/components/VypravaForm.vue";
import Vypravnik from "@/components/Vypravnik/Vypravnik.vue";
import EventInfoForm from "@/components/EventInfoForm.vue";
import EventInfo from "@/components/EventInfo.vue";
import EventItemsCard from "@/components/EventItemsCard.vue";
import router from "@/router/router.js";

const isLoggedIn = ref(false);
const currentUserData = ref({});

const auth = getAuth();
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      isLoggedIn.value = true;

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        currentUserData.value = docSnap.data();
      } else {
        console.log("No such document!");
      }

    } else {
      isLoggedIn.value = false;
    }
  });
});

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/");
  })
};

const currentEventId = ref('');

const handleEventInfoClicked = (id) => {
  currentEventId.value = id
}

</script>

<template>
  <button @click="handleSignOut" v-if="isLoggedIn">Odhlásit se</button>
  {{ currentUserData }}

  <div class="container-fluid mt-5 px-5 mb-5">
    <div class="row">
      <div class="col-12 col-md-6">
<!--        <vyprava-form />-->
      </div>
      <div class="col-12 col-md-6">
        <vypravnik @eventInfoClicked="handleEventInfoClicked" />
      </div>
    </div>
    <div class="row">
      <div class="col">
<!--        <event-info-form :id="currentEventId" />-->
      </div>
      <div class="col"></div>
    </div>
  </div>
</template>

<style scoped>

</style>