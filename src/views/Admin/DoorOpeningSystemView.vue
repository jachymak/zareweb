<script setup>
  import AdminPageLayout from "@/components/Admin/AdminPageLayout.vue"
  import db from "@/firebase/firebase.js"
  import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
  import { ref } from "vue"
  import { useSubscriptionsStore } from "@/stores/subsriptions.js"
  import {useUserStore} from "@/stores/user.js";

  const subscriptionsStore = useSubscriptionsStore()

  const store = useUserStore()
  store.authUser()

  const logs = ref([])
  const lastUpdateTimestamp = ref("")
  const numbers = ref([])

  const formatDateTime = (date) => {
    const pad = num => String(num).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  const formatLog = (type, content) => {
    switch (type) {
      case '0':
        return "Dveře otevřeny [" + content + "]"
      case '1':
        return "Přístup odepřen [" + content + "]"
      case '2':
        return "Aktualizován seznam čísel"
      case '4':
        return content
      default:
        return content
    }
  }

  const q1 = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(10))
  const unsub1 = onSnapshot(q1, (querySnapshot) => {
    logs.value = []
    querySnapshot.forEach((doc) => {
      const data = {
        id: doc.id,
        timestamp: formatDateTime(doc.data().timestamp.toDate()),
        log: formatLog(doc.data().type, doc.data().content)
      }
      logs.value.push(data)
    })
  })
  subscriptionsStore.activeSubscriptions.push(unsub1)

  const q2 = query(collection(db, "logs"), where("type", "==", "2") , orderBy("timestamp", "desc"), limit(1))
  const unsub2 = onSnapshot(q2, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      lastUpdateTimestamp.value = formatDateTime(doc.data().timestamp.toDate());
    })
  })
  subscriptionsStore.activeSubscriptions.push(unsub2)

  const unsub3 = onSnapshot(collection(db, "numbers"), (querySnapshot) => {
    numbers.value = []
    querySnapshot.forEach((doc) => {
      let lastOpened = "-"

      const q3 = query(collection(db, "logs"), where("content", "==", doc.id), orderBy("timestamp", "desc"), limit(1))
      const unsub4 = onSnapshot(q3, (querySnapshot2) => {
        querySnapshot2.forEach((doc2) => {
          lastOpened = formatDateTime(doc2.data().timestamp.toDate())
        })

        const data = {
          phoneString: doc.id.replace(/(\d{3})(?=\d)/g, '$1 '),
          lastOpened: lastOpened
        }

        const exists = numbers.value.findIndex(n => n.phoneString === data.phoneString)

        if (exists >= 0) {
          numbers.value[exists].lastOpened = data.lastOpened
        }
        else numbers.value.push(data)


      })
      subscriptionsStore.activeSubscriptions.push(unsub4)
    })
  })
  subscriptionsStore.activeSubscriptions.push(unsub3)

</script>

<template>
  <admin-page-layout title="Systém pro otevírání dveří">
    <div class="row">

      <div class="col-12 col-md-6 mt-5 mt-md-0 order-2 order-md-1">
        <ul v-for="l in logs" :key="l.id">
          <li>{{ l.timestamp }} <b>{{ l.log }}</b></li>
        </ul>
      </div>

      <div class="col-12 col-md-6 order-1 order-md-2">

        <div class="row mb-4 align-items-center">
          <div class="col">
            Seznam povolených čísel byl naposledy aktualizován:
          </div>
          <div class="col">
            <b>{{ lastUpdateTimestamp }}</b>

          </div>
        </div>

        <div class="row">
          <div class="col">

            <table class="table table-striped">
              <thead>
              <tr>
                <th scope="col" class="col-4">Telefon</th>
                <th scope="col" class="col-4">Naposledy otevřeno</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="n in numbers" :key="n.phoneString">
                <td>{{ n.phoneString }}</td>
                <td>{{ n.lastOpened }}</td>
              </tr>

              </tbody>
            </table>

          </div>

        </div>
      </div>

    </div>
  </admin-page-layout>
</template>

<style>

</style>
