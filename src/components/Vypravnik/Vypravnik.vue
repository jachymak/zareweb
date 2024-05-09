<script setup>
  import Month from "@/components/Vypravnik/Month.vue";
  import Vyprava from "@/components/Vypravnik/Vyprava.vue";
  import {ref} from "vue";
  import {collection, onSnapshot, orderBy, query} from "firebase/firestore";
  import db from "@/firebase/firebase.js";

  const emit = defineEmits(['eventInfoClicked']);

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

  const handleEventInfoClicked = (id) => {
    emit('eventInfoClicked', id);
  }

</script>

<template>
  <div v-for="i in 12">
    <month v-if="getMonthEvents(i-1).length > 0" :month="months[i-1]">
      <vyprava v-for="vyprava in getMonthEvents(i-1)" :data="vyprava" :key="vyprava.id" @eventInfoClicked="handleEventInfoClicked"></vyprava>
    </month>
  </div>
</template>
