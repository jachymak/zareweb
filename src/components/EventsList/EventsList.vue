<script setup>
  import Month from "@/components/EventsList/Month.vue";
  import Event from "@/components/EventsList/Event.vue";
  import {ref} from "vue";
  import {collection, deleteDoc, doc, onSnapshot, orderBy, query} from "firebase/firestore";
  import db from "@/firebase/firebase.js";
  import router from "@/router/router.js";
  import {useEventStore} from "@/stores/event.js";
  import {useSubscriptionsStore} from "@/stores/subsriptions.js";

  const eventStore = useEventStore()
  const subscriptionsStore = useSubscriptionsStore()

  const props = defineProps({
    edit: Boolean,
    attendance: Boolean
  })

  const months = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

  const events = ref([])

  const q = query(collection(db, "events"), orderBy("date", "asc"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    events.value = []
    querySnapshot.forEach((doc) => {
      events.value.push({
        id: doc.id,
        title: doc.data().title,
        who: doc.data().who,
        leader: doc.data().leader,
        date: [doc.data().date[0].toDate(), doc.data().date[1].toDate()],
        monthIdx: doc.data().date[0].toDate().getMonth(),
        infoPublished: doc.data().infoPublished,
        withoutInfo: doc.data().withoutInfo
      })
    });
  });

  subscriptionsStore.activeSubscriptions.push(unsubscribe)

  const getMonthEvents = (month) => {
    return events.value.filter((event) => event.monthIdx === month)
  }

  const handleEventInfoClick = (event) => {
    if (!props.edit && event.infoPublished) {
      router.push('/member/event/' + event.id)
    }
    else if (props.edit) {
      eventStore.setCurrentEvent(event.id, event.title, event.who)
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Opravdu smazat akci? (" + id + ")")) {
      await deleteDoc(doc(db, "events", id));
      console.log("deleted")
    }
  }

  const editIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-pencil-square\" viewBox=\"0 0 16 16\">\n" +
      "  <path d=\"M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z\"/>\n" +
      "  <path fill-rule=\"evenodd\" d=\"M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z\"/>\n" +
      "</svg>"

</script>

<template>
  <div v-for="i in 12">
    <month v-if="getMonthEvents(i-1).length > 0" :month="months[i-1]">
      <event v-for="event in getMonthEvents(i-1)" :data="event" :key="event.id">
        <button
            v-if="!event.withoutInfo"
            :class="['btn', 'btn-sm', 'm-0', 'me-2', (event.infoPublished ? 'btn-secondary' : ['btn-outline-secondary', (edit ? '' : 'disabled')])]"
            @click="handleEventInfoClick(event)">
          <div v-if="edit" v-html="editIcon"></div>
          <div v-else>plakátek</div>
        </button>

        <button v-if="edit && !attendance" :class="['btn', 'btn-sm', 'btn-secondary']" @click="handleDelete(event.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
          </svg>
        </button>
      </event>
    </month>
  </div>
</template>
