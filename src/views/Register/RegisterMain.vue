<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, setDoc } from "firebase/firestore";
import {getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, deleteUser} from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMsg = ref('');

/* --- FIRESTORE --- */

const addToFirestore = async (user) => {
  const userData = {
    email: user.user.email,
    verifiedMember: true,
    children: [],
    leader: false
  }
  await setDoc(doc(db, "users", user.user.uid), userData);
}

/* --- END FIRESTORE --- */


const register = () => {
  createUserWithEmailAndPassword(getAuth(), email.value, password.value)
      .then((user) => {
        addToFirestore(user);
        router.push('/register/children');
      })
      .catch((error) => {
        console.log(error);
      })
}

const registerWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(getAuth(), provider)
      .then((user) => {
        router.push('/register/children');
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

              <h3 class="mb-5">Registrace do systému</h3>

              <div class="form-outline mb-4">
                <input v-model="email" type="email" id="typeEmailX-2" class="form-control form-control-lg" placeholder="Email"/>
              </div>

              <div class="form-outline mb-4">
                <input v-model="password" type="password" id="typePasswordX-2" class="form-control form-control-lg" placeholder="Heslo"/>
              </div>

              <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->

              <button class="btn btn-primary btn-lg btn-block" type="submit" @click="register">Zaregistrovat se</button>

              <hr class="my-4">

              <button class="btn btn-lg btn-block btn-danger"
                      type="submit" @click="registerWithGoogle">Zaregistrovat se přes Google</button>

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

</template>
