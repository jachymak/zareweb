<script setup>
import {ref} from "vue"
import Vypravnik from "@/components/EventsList/EventsList.vue"
import WelcomeMember from "@/components/Member/WelcomeMember.vue"
import Photos from "@/components/Member/Photos.vue"

import { useUserStore } from '@/stores/user.js'
import {storeToRefs} from "pinia"

const store = useUserStore()
const { userData, childrenData } = storeToRefs(store)
store.authUser()

</script>

<template>
  <div class="container-fluid container-md p-0 mb-5 mt-md-5">

    <div class="row align-items-center">
      <div class="col-12 col-md-6">
        <welcome-member @sign-out="store.signUserOut()" :user-data="userData" :children-data="childrenData"/>
      </div>

      <div class="col-12 col-md-6">
<!--        <photos />-->
        <ul>
          <li><router-link to="/admin/attendance">Docházka</router-link></li>
          <li><router-link to="/admin/events">Výpravy</router-link></li>
          <li><router-link to="/admin/members">Členové</router-link></li>
          <li><router-link to="/admin/door">Otrok</router-link></li>
        </ul>

      </div>

    </div>

    <div class="row px-2">
      <div class="col-12 col-md-6">
        <vypravnik />

      </div>
    </div>
  </div>
</template>
