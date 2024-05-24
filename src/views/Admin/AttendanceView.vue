<script setup>
import AdminPageLayout from "@/components/Admin/AdminPageLayout.vue"
import db from "@/firebase/firebase.js"
import {collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, addDoc, setDoc, arrayUnion, arrayRemove} from "firebase/firestore"
import {computed, ref, watch} from "vue"
import { useSubscriptionsStore } from "@/stores/subsriptions.js"
import {useUserStore} from "@/stores/user.js";
import EventsList from "@/components/EventsList/EventsList.vue";
import {useEventStore} from "@/stores/event.js";
import {storeToRefs} from "pinia";
import Badge from "@/components/Badge.vue";
import NickOrName from "@/components/NickOrName.vue";

const subscriptionsStore = useSubscriptionsStore()
const eventStore = useEventStore()
const { currentEventId, currentEventLabel } = storeToRefs(eventStore)

eventStore.resetCurrentEvent()

const store = useUserStore()
store.authUser()

const attendanceList = ref([])
const membersList = ref([])


watch(currentEventId, async () => {
  const uns = onSnapshot(collection(db, "members"), (querySnapshot) => {
    membersList.value = []
    querySnapshot.forEach((doc) => {
      membersList.value.push({id: doc.id, ...doc.data()})
    });
  });

  onSnapshot(doc(db, "attendance", currentEventId.value), async (dd) => {

    if (dd.exists()) {
      attendanceList.value = dd.data().children
    }
    else {
      await setDoc(doc(db, "attendance", currentEventId.value), {
        children: []
      });
      attendanceList.value = []
    }

  });
});

const handleClick = async (memberId, add) => {
  await updateDoc(doc(db, "attendance", currentEventId.value), {
    children: add ? arrayUnion(memberId) : arrayRemove(memberId)
  });
}

const isAttending = (memberId) => {
  return attendanceList.value.indexOf(memberId) !== -1
}

</script>

<template>
  <admin-page-layout title="Evidence docházky">
    <div class="row">

      <div class="col">
        <events-list :edit="true" :attendance="true"/>
      </div>

      <div class="col">
        <div class="row text-center mb-4">
          <span class="text-truncate"><badge :type="currentEventLabel.who" /><b>{{ currentEventLabel.title }}</b></span>
        </div>

        <div class="row px-5">
          <table class="table table-striped">
            <thead>
            <tr>
              <th scope="col" class="col-8">Jméno</th>
              <th scope="col" class="col-4">Účast na akci?</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="m in membersList" :key="m.id">
              <td><nick-or-name class="" :short="false" :user-data="m" :bold="true" /></td>  <!-- TODO truncate text -->
              <td>
                <input v-if="isAttending(m.id)" class="form-check-input" type="checkbox" :id="m.id" @click="handleClick(m.id, false)" checked>
                <input v-else class="form-check-input" type="checkbox" :id="m.id" @click="handleClick(m.id, true)">
              </td>
            </tr>

            </tbody>
          </table>
        </div>


      </div>

    </div>
  </admin-page-layout>
</template>

<style>

</style>
