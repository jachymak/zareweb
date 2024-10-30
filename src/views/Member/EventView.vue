<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import EventInfo from "@/components/Member/EventPage/EventInfo.vue"
  import EventItemsCard from "@/components/Member/EventPage/EventItemsCard.vue"
  import ChildCard from "@/components/Member/ChildCard.vue"
  import SignUpBtn from "@/components/Member/EventPage/EventSignUpBtn.vue"

  import { useUserStore } from '@/stores/user.js'
  import {storeToRefs} from "pinia"
  import {computed, onMounted, ref} from "vue"
  import {doc, onSnapshot, updateDoc} from "firebase/firestore"
  import db from "@/firebase/firebase.js"
  import getChildrenData from "@/firebase/getChildrenData.js";
  import NickOrName from "@/components/NickOrName.vue";
  import {useSubscriptionsStore} from "@/stores/subsriptions.js";

  const subscriptionsStore = useSubscriptionsStore()

  const store = useUserStore()
  const { childrenData, userData } = storeToRefs(store)
  store.authUser()

  const router = useRouter()
  const route = useRoute()
  const eventId = route.params.id

  const handleExitClick = () => {
    router.push("/login")
  }

  const registeredChildren = ref([])
  const childData = ref([])

  const unsubscribe = onSnapshot(doc(db, "events", eventId), async (doc) => {
    if (doc.exists()) {
      registeredChildren.value = doc.data().registeredChildren

      if (userData.value.leader) childData.value = await getChildrenData(registeredChildren.value)
    }
  })
  subscriptionsStore.activeSubscriptions.push(unsubscribe)

  const isChildRegistered = (childId) => {
    return registeredChildren.value.some((child) => child === childId)
  }

  const handleStatusChange = async (id, newStatus) => {
    const data = newStatus ? [...registeredChildren.value, id] : registeredChildren.value.filter(ch => ch !== id)
    await updateDoc(doc(db, "events", eventId), { registeredChildren: data })
  }

  const registeredCount = computed(() => {
    return registeredChildren.value.length
  })

</script>

<template>
  <div class="container my-5">
    <div class="row justify-content-between">
      <div class="col-12 col-md-6 order-1 order-md-1">
          <event-info :event-id="eventId" />
      </div>

      <div class="col-12 col-md-5 order-3 order-md-2 mt-5">
        <event-items-card :event-id="eventId"></event-items-card>
      </div>

      <!--
      <div class="col-12 col-md-6 order-2 order-md-3 mt-3">
        <div v-if="!userData.leader" :key="registeredChildren">
          <child-card v-for="ch in childrenData" :data="ch" :key="ch.id">
            <sign-up-btn :child-id="ch.id" :status="isChildRegistered(ch.id)" @status-changed="handleStatusChange" />
          </child-card>
        </div>

        <div v-if="userData.leader" class="container-fluid p-4 mt-4 bg-sand">
          <div class="row align-items-center mb-3">
            <div class="col">
              <h3>Přihlášené děti</h3>
            </div>
            <div class="col text-end">
              <h3>{{ registeredCount }}</h3>
            </div>
          </div>

          <div class="row">
            <div v-for="ch in childData" class="col-3 text-center">
              <nick-or-name :short="true" :user-data="ch" />
            </div>
          </div>
        </div>
      </div>
      -->
    </div>

  </div>
</template>
