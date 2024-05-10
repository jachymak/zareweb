<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser } from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref('');

/* --- FIRESTORE --- */

const userExistsInDatabase = async (user) => {
  console.log(user.user.uid);
  const docSnap = await getDoc(doc(db, "users", user.user.uid));
  console.log(docSnap.exists());
  return docSnap.exists();
}

/* --- END FIRESTORE --- */


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

const signIn = () => {
  signInWithEmailAndPassword(getAuth(), email.value.trimEnd(), password.value)
      .then((user) => {
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

const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(getAuth(), provider)
      .then((user) => {

        userExistsInDatabase(user)
            .then((ret) => {
              if (ret) {
                console.log(userExistsInDatabase(user));
                console.log(user);
                router.push('/member');
              }
              else {
                console.log(user + " not in database!");
                const auth = getAuth();
                const usr = auth.currentUser;
                deleteUser(usr).then(() => {
                  console.log("user deleted")
                }).catch((error) => {
                  console.log("error with deleting user " + error)
                })
                router.push('/login');
              }
            })

      })
      .catch((error) => {
        console.log(error);
      });
};

</script>

<template>
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-2-strong" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Přihlášení pro členy</h3>

              <form @submit.prevent="signIn">
                <div class="form-outline mb-4">
                  <input v-model="email" type="email" id="typeEmailX-2" class="form-control form-control-lg" placeholder="Email"/>
                </div>

                <div class="form-outline mb-4">
                  <input v-model="password" type="password" id="typePasswordX-2" class="form-control form-control-lg" placeholder="Heslo"/>
                </div>

                <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->

                <button class="btn btn-primary btn-lg btn-block" type="submit">Přihlásit se</button>
              </form>

              <hr class="my-4">

              <button class="btn btn-lg btn-block btn-danger"
                      type="submit" @click="signInWithGoogle">Přihlásit se přes Google</button>

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

<!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

</template>

<style scoped>

</style>