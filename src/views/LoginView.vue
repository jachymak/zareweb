<script setup>
import { ref } from "vue";

import { useUserStore } from '@/stores/user.js'

const store = useUserStore()

const email = ref('');
const password = ref('');
const errorMsg = ref('');

</script>

<template>
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-2-strong bg-sand" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Přihlášení pro členy</h3>

              <p>Sekci pro členy ještě připravujeme, prosím o strpení!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!--
  <section class="vh-100">
    <div class="container py-5 h-100">
      <div class="row d-flex justify-content-center align-items-center h-100">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-2-strong bg-sand" style="border-radius: 1rem;">
            <div class="card-body p-5 text-center">

              <h3 class="mb-5">Přihlášení pro členy</h3>

              <form @submit.prevent="store.signUserIn(email, password)">
                <div class="form-outline mb-4">
                  <input v-model="email" type="email" id="typeEmailX-2" class="form-control form-control-lg" placeholder="E-mail"/>
                </div>

                <div class="form-outline mb-4">
                  <input v-model="password" type="password" id="typePasswordX-2" class="form-control form-control-lg" placeholder="Heslo"/>
                </div>

                <p v-if="errorMsg">{{ errorMsg }}</p>  TODO error handling with focus

                <button class="btn btn-primary btn-lg btn-block" type="submit">Přihlásit se</button>
              </form>

              <hr class="my-4">

              <button class="btn btn-lg btn-block btn-danger"
                      type="submit" @click="store.signUserInWithGoogle()">Přihlásit se přes Google</button>

            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  -->

</template>

<style scoped>

</style>