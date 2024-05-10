<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup } from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const addToFirestore = async (user) => {
  const userData = {
    email: user.user.email,
    name: user.user.displayName,
    verifiedMember: false,
    leader: false
  }
  await setDoc(doc(db, "users", user.user.uid), userData);
}

const login = () => {
  signInWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((user) => {
        addToFirestore(user);
        router.push('/member');
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
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-2-strong" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Přihlášení pro členy</h3>

              <div class="form-outline mb-4">
                <input v-model="email" type="email" id="typeEmailX-2" class="form-control form-control-lg" placeholder="Email"/>
              </div>

              <div class="form-outline mb-4">
                <input v-model="password" type="password" id="typePasswordX-2" class="form-control form-control-lg" placeholder="Heslo"/>
              </div>

              <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->

              <button class="btn btn-primary btn-lg btn-block" type="submit" @click="login">Přihlásit se</button>

              <hr class="my-4">

              <button class="btn btn-lg btn-block btn-primary" style="background-color: #dd4b39;"
                      type="submit" @click="signInWithGoogle">Přihlásit se přes Google</button>

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

  <h1>Register</h1>
  <p><input type="text" placeholder="email" v-model="email"/></p>
  <p><input type="text" placeholder="password" v-model="password"/></p>
  <p><button @click="register">Register!</button></p>

</template>

