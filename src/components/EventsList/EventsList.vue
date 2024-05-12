<script setup>
  import Month from "@/components/EventsList/Month.vue";
  import Event from "@/components/EventsList/Event.vue";
  import {ref} from "vue";
  import {collection, deleteDoc, doc, onSnapshot, orderBy, query} from "firebase/firestore";
  import db from "@/firebase/firebase.js";
  import router from "@/router/router.js";
  import {useEventStore} from "@/stores/event.js";

  const eventStore = useEventStore()

  const props = defineProps({
    edit: Boolean
  })

  console.log(props.edit)

  const months = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

  const events = ref([])

  const q = query(collection(db, "vypravy"), orderBy("date", "asc"));
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
        infoPublished: doc.data().infoPublished
      })
    });
  });

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
      await deleteDoc(doc(db, "vypravy", id));
      console.log("deleted")
    }
  }

</script>

<template>
  <div v-for="i in 12">
    <month v-if="getMonthEvents(i-1).length > 0" :month="months[i-1]">
      <event v-for="event in getMonthEvents(i-1)" :data="event" :key="event.id">
        <button
            :class="['btn', 'btn-sm', 'm-0', (event.infoPublished ? 'btn-secondary' : ['btn-outline-secondary', (edit ? '' : 'disabled')])]"
            @click="handleEventInfoClick(event)">
          {{ edit ? "P" : "plakátek"}}
        </button>

        <button v-if="edit" :class="['btn', 'btn-sm', 'btn-secondary']" @click="handleDelete(event.id)">D</button>
      </event>
    </month>
  </div>
</template>
