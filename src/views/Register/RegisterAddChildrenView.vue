<script setup>
import {computed, ref, watch} from "vue";
import { useRouter } from "vue-router";
import {collection, doc, getDocs, onSnapshot, query, where, setDoc, updateDoc} from "firebase/firestore";
import {getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, deleteUser} from "firebase/auth"
import db from "@/firebase/firebase.js";

const router = useRouter();

const loading = ref(false);
const errorMsg = ref('');

/* --- FIRESTORE --- */

const addChild = async (childrenIds) => {
  const user = getAuth().currentUser
  const data = {
    children: childrenIds
  }
  await updateDoc(doc(db, "users", user.uid), data);
}

const getMemberId = async (identificationCode) => {
  const q = query(collection(db, "members"), where("identificationCode", "==", identificationCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;
  return querySnapshot.docs[0].id;
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

const confirm = async () => {
  if (errorInData.value.some(value => value === true)) console.log("err")
  else {
    loading.value = true
    const childrenIds = [];

    for (let i = 0; i < children.value.length; i++) {
      const currentChildValue = children.value[i];
      if (currentChildValue.length === 0) continue;

      const childId = await getMemberId(currentChildValue);
      if (childId !== null) {
        childrenIds.push(childId);
      } else {
        errorInData.value[i] = true;
      }
    }

    if (childrenIds.length > 0 && !errorInData.value.some(value => value === true)) {
      await addChild(childrenIds).then(() => {
        router.push("/member")
      })
    } else {
      errorMsg.value = "Některý člen nebyl nalezen!"
      loading.value = false
    }

  }
};

// TODO slash appear on sixth char
const handleKeyDown = (event, i) => {
  if (children.value[i].length === 6 && event.key !== "Backspace") {
    children.value[i] += '/';
  }
};

const handleChange = (i) => {
  const regex = /^\d{6}\/\d{4}$/;
  if (!regex.test(children.value[i]) && children.value[i].length > 0) {
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
                         @keydown="handleKeyDown($event,i-1)"
                         @change="handleChange(i-1)"
                         maxlength="11" type="text"
                         :class="['form-control', 'form-control-lg', (errorInData[i-1] ? 'is-invalid' : '')]"
                         placeholder="Rodné číslo dítěte">
                </div>

              </div>


              <button class="btn btn-primary btn-lg btn-block mt-4" type="submit" @click="confirm">
                Potvrdit <span v-if="loading" class='spinner-border spinner-border-sm' aria-hidden='true'></span>
              </button>


              <p v-if="errorMsg">{{ errorMsg }}</p>  <!-- TODO error handling with focus -->


            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--  https://mdbootstrap.com/docs/standard/extended/login/#! -->

</template>
