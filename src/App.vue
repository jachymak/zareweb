<script setup>

import {computed, onMounted, ref, watch} from "vue";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import router from "@/router/router.js";

const currentEventId = ref('');

const handleEventInfoClicked = (id) => {
  currentEventId.value = id
}

</script>

<template>

  <router-view />

</template>
