<script setup>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref} from "vue";
import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

const currentUserData = ref({});

const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
  if (user) {

    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      currentUserData.value = docSnap.data();
    } else {
      console.log("No such document!");
    }

  } else {
    // User is signed out
    // ...
  }
});
</script>

<template>
  <h1>Member!</h1>
  {{ currentUserData }}
</template>

<style scoped>

</style>