<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import EventInfo from "@/components/Member/EventPage/EventInfo.vue"
  import EventItemsCard from "@/components/Member/EventPage/EventItemsCard.vue"
  import ChildCard from "@/components/Member/ChildCard.vue"
  import SignUpBtn from "@/components/Member/EventPage/EventSignUpBtn.vue"

  import { useUserStore } from '@/stores/user.js'
  import {storeToRefs} from "pinia"
  import {onMounted, ref} from "vue"
  import {doc, onSnapshot, updateDoc} from "firebase/firestore"
  import db from "@/firebase/firebase.js"

  const store = useUserStore()
  const { childrenData } = storeToRefs(store)
  store.authUser()

  const router = useRouter()
  const route = useRoute()
  const eventId = route.params.id

  const handleExitClick = () => {
    router.push("/login")
  }

  const registeredChildren = ref([])

  onSnapshot(doc(db, "events", eventId), (doc) => {
    if (doc.exists()) {
      registeredChildren.value = doc.data().registeredChildren
    }
  })

  const isChildRegistered = (childId) => {
    return registeredChildren.value.some((child) => child === childId)
  }

  const handleStatusChange = async (id, newStatus) => {
    const data = newStatus ? [...registeredChildren.value, id] : registeredChildren.value.filter(ch => ch !== id)
    await updateDoc(doc(db, "events", eventId), { registeredChildren: data })
  }

</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-end">
      <div class="col-1">
        <button class="btn btn-sm btn-light" @click="handleExitClick">X</button>
      </div>
    </div>

    <div class="row">
      <div class="col-12 col-md-7">

        <div class="row">
          <event-info :event-id="eventId" />
        </div>

        <div class="row">

          <div style="min-height: 400px">

              <div :key="registeredChildren">
                <child-card v-for="ch in childrenData" :data="ch" :key="ch.id">
                  <sign-up-btn :child-id="ch.id" :status="isChildRegistered(ch.id)" @status-changed="handleStatusChange" />
                </child-card>
              </div>

          </div>

        </div>
      </div>
      <div class="col-12 col-md-5 ps-5">
        <event-items-card :event-id="eventId"></event-items-card>

      </div>
    </div>
  </div>
</template>
