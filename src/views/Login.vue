<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup } from "firebase/auth"
import db from "@/firebase/firebase.js";

const addToFirestore = async (user) => {
  const userData = {
    email: user.user.email,
    name: user.user.displayName,
    verifiedMember: false,
    leader: false
  }
  await setDoc(doc(db, "users", user.user.uid), userData);
}

const register = () => {
  createUserWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((user) => {
        addToFirestore(user);
        router.push('/member');
      })
      .catch((error) => {
        console.log(error);
      })
}

const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(getAuth(), provider)
      .then((user) => {
        addToFirestore(user);
        console.log(user);
        router.push('/member');
      })
      .catch((error) => {
        console.log(error);
      });
};

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref('');

const login = () => {
  signInWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((data) => {
        console.log(data);
        router.push('/login');
      })
      .catch((error) => {
        console.log(error.code);
        switch (error.code) {
          case "auth/invalid-email":
            errorMsg.value = "Neplatná e-mailová adresa!";
            break;
          case "auth/user-not-found":
            errorMsg.value = "Uživatel nenalezen!";
            break;
          case "auth/wrong-password":
            errorMsg.value = "Špatné heslo!";
            break;
          default:
            errorMsg.value = "Špatné přihlašovací údaje!"
        }
      })
}

</script>

<template>
  <h1>Login</h1>
  <p><input type="text" placeholder="email" v-model="email"/></p>
  <p><input type="text" placeholder="password" v-model="password"/></p>
  <p v-if="errorMsg">{{ errorMsg }}</p>
  <p><button @click="login">log in!</button></p>

  <h1>Register</h1>
  <p><input type="text" placeholder="email" v-model="email"/></p>
  <p><input type="text" placeholder="password" v-model="password"/></p>
  <p><button @click="register">Register!</button></p>
  <p><button @click="signInWithGoogle">With Google</button></p>
</template>

<style scoped>

</style>