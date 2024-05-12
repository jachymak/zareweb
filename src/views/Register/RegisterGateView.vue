<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { doc, setDoc } from "firebase/firestore";
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const email = "registrace@zareweb.cz"
const password = ref('');
const errorMsg = ref('');


const checkPassword = () => {
  signInWithEmailAndPassword(getAuth(), email, password.value)
      .then((user) => {
        router.push('/register/main');
      })
      .catch((error) => {
        console.log(error.code);
        errorMsg.value = error.code;
      })
}

</script>

<template>
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Registrace do systému</h3>

              <form id="registerGateForm" @submit.prevent="checkPassword">
                <div class="form-outline mb-4">
                  <input v-model="password" type="text" id="typePasswordX-2" class="form-control form-control-lg" placeholder="Heslo"/>
                </div>
                <!--              'TODO do not remember password -->

                <button class="btn btn-primary btn-lg btn-block" type="submit">Vstoupit</button>

              </form>

              <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

</template>
