<script setup>
import {computed, ref, watch} from "vue";
import { useRouter } from "vue-router";
import {doc, onSnapshot, setDoc} from "firebase/firestore";
import {getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, deleteUser} from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const errorMsg = ref('');

/* --- FIRESTORE --- */

const addToFirestore = async (user) => {
  const userData = {
    email: user.user.email,
    name: user.user.displayName,
    verifiedMember: true,
    leader: false
  }
  await setDoc(doc(db, "users", user.user.uid), userData);
}

/* --- END FIRESTORE --- */


const children = ref([""]);
const errorInData = ref([false]);

const childrenCount = computed(() => {
  let ret = 1;
  children.value.forEach((ch) => {
    if (ch.length > 0) ret++;
  });
  return ret;
});


const confirm = () => {
  if (errorInData.value.some(value => value === true)) console.log("err")
  else console.log(children.value);
};

const handleKeyDown = (event, i) => {
  if (children.value[i].length === 6 && event.key !== "Backspace") {
    children.value[i] += "/";
  }
};

const handleChange = (i) => {
  const regex = /^\d{6}\/\d{4}$/;
  if (!regex.test(children.value[i])) {
    errorInData.value[i] = true;
  } else {
    errorInData.value[i] = false;
  }
  console.log(errorInData.value);

};


</script>

<template>
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-2-strong" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Členové pro tento účet</h3>

              <div v-for="i in childrenCount">

                <div class="input-group mb-3">
                  <span class="input-group-text" id="basic-addon1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-person-circle px-auto" viewBox="0 0 16 16">
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                      <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                    </svg>
                  </span>
                  <input v-model="children[i-1]"
                         @keyup="handleKeyDown($event,i-1)"
                         @change="handleChange(i-1)"
                         maxlength="11" type="text"
                         :class="['form-control', 'form-control-lg', (errorInData[i-1] ? 'is-invalid' : '')]"
                         placeholder="Rodné číslo dítěte">
                </div>

              </div>


              <button class="btn btn-primary btn-lg btn-block mt-4" type="submit" @click="confirm">Potvrdit</button>


              <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->


            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

</template>
