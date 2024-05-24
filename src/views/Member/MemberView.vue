<script setup>
import {ref} from "vue"
import Vypravnik from "@/components/EventsList/EventsList.vue"
import WelcomeMember from "@/components/Member/WelcomeMember.vue"
import Photos from "@/components/Member/Photos.vue"

import { useUserStore } from '@/stores/user.js'
import {storeToRefs} from "pinia"
import Contact from "@/components/Member/Contact.vue";

const store = useUserStore()
const { userData, childrenData } = storeToRefs(store)
store.authUser()

</script>

<template>
  <div class="container-fluid container-md mt-3 mb-5">

    <div class="row">
      <div class="col-12 col-md-6 px-0">
        <div class="row">
          <div class="col-12">
            <welcome-member @sign-out="store.signUserOut()" :user-data="userData" :children-data="childrenData"/>
          </div>

          <div class="col-12 px-md-4">
            <photos />
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 ps-4 vypravnik-container">
          <vypravnik />
      </div>
    </div>

    <div class="row mt-4">
      <h4>Kontakty</h4>
      <div class="row mt-2 mx-auto">
        <div class="col-12 col-md-4 mb-3 mb-md-0">
          <contact name="Jáchym Víteček" role="vedoucí oddílu vlčušek" phone="776 018 939" email="jachym.vitecek@skaut.cz" img-url="http://www.zare.skauting.cz/profiles/jachym.png"/>
        </div>
        <div class="col-12 col-md-4 mb-3 mb-md-0">
          <contact name="Hobit - Theodor Mikolajek" role="vedoucí oddílu skautů" phone="776 772 777" email="hobit@skaut.cz" img-url="http://www.zare.skauting.cz/profiles/hobit.jpg"/>
        </div>
        <div class="col-12 col-md-4 mb-3 mb-md-0">
          <contact name="Quido Hanulík" role="správce klubovny" phone="735 305 823" email="quido.hanulik@skaut.cz" img-url="http://www.zare.skauting.cz/profiles/quido.jpg"/>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
  .vypravnik-container {
    max-height: 70vh;
    overflow: auto;
  }
</style>
