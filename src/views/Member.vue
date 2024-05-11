<script setup>
import {ref} from "vue"
import Vypravnik from "@/components/Vypravnik/Vypravnik.vue"
import WelcomeMember from "@/components/Member/WelcomeMember.vue"
import Photos from "@/components/Member/Photos.vue"

import { useUserStore } from '@/stores/user.js'
import {storeToRefs} from "pinia"

const store = useUserStore()
const { loggedIn, userData, childrenData } = storeToRefs(store)
store.authUser()

</script>

<template>
  <div class="container-fluid mt-5 px-5 mb-5">

    <div class="row align-items-center">
      <div class="col-12 col-md-6">
        <welcome-member @sign-out="store.signUserOut()" :user-data="userData" :children-data="childrenData"/>
      </div>

      <div class="col-12 col-md-6">
        <photos />
      </div>

    </div>

    <div class="row ps-3 pe-4">
      <div class="col">
        <vypravnik />

      </div>
      <div class="col"></div>
    </div>
  </div>
</template>
