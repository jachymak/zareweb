<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref('');

const register = () => {
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
  <p><button @click="register">log in!</button></p>
</template>

<style scoped>

</style>