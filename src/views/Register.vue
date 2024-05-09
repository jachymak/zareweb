<script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup } from "firebase/auth"
  import { doc, setDoc } from "firebase/firestore";
  import db from "@/firebase/firebase.js";

  const router = useRouter();

  const email = ref('');
  const password = ref('');

  const register = () => {
    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
        .then(async (user) => {

          // add user to firestore
          const userData = {
            email: user.user.email,
            name: user.user.displayName,
            verifiedMember: false,
            leader: false
          }
          await setDoc(doc(db, "users", user.user.uid), userData);

          router.push('/member');
        })
        .catch((error) => {
          console.log(error);
        })
  }

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(getAuth(), provider)
        .then((data) => {
          console.log(data);
          router.push('/member');
        })
        .catch((error) => {
          console.log(error);
        });
  };

</script>

<template>
  <h1>Register</h1>
  <p><input type="text" placeholder="email" v-model="email"/></p>
  <p><input type="text" placeholder="password" v-model="password"/></p>
  <p><button @click="register">Register!</button></p>
  <p><button @click="signInWithGoogle">With Google</button></p>
</template>

<style scoped>

</style>