<script setup>
import Month from "@/components/EventList/Month.vue";
import Event from "@/components/EventList/Event.vue";
import { computed, ref } from "vue";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import db from "@/firebase/firebase.js";
import router from "@/router/router.js";
import { useEventStore } from "@/stores/event.js";
import { useSubscriptionsStore } from "@/stores/subscriptions.js";

const eventStore = useEventStore();
const subscriptionsStore = useSubscriptionsStore();

const props = defineProps({
  edit: Boolean,
  attendance: Boolean,
});

const months = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
];

const events = ref([]);

const q = query(collection(db, "events"), orderBy("date", "asc"));
const unsubscribe = onSnapshot(q, (querySnapshot) => {
  events.value = [];
  querySnapshot.forEach((doc) => {
    events.value.push({
      id: doc.id,
      title: doc.data().title,
      who: doc.data().who,
      leader: doc.data().leader,
      date: [doc.data().date[0].toDate(), doc.data().date[1].toDate()],
      monthIdx: doc.data().date[0].toDate().getMonth(),
      infoPublished: doc.data().infoPublished,
      withoutInfo: doc.data().withoutInfo,
    });
  });
});

subscriptionsStore.activeSubscriptions.push(unsubscribe);

const getMonthEvents = (month) => {
  return events.value.filter((event) => event.monthIdx === month);
};

const handleEventInfoClick = (event) => {
  if (!props.edit && event.infoPublished) {
    router.push("/member/event/" + event.id);
  } else if (props.edit) {
    eventStore.setCurrentEvent(event.id, event.title, event.who);
  }
};

const handleDelete = async (id) => {
  if (confirm("Opravdu smazat akci? (" + id + ")")) {
    await deleteDoc(doc(db, "events", id));
    console.log("deleted");
  }
};

const editIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">\n' +
  '  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>\n' +
  '  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>\n' +
  "</svg>";
</script>

<template>
  <!-- Mobile half-year switch (simple) -->
  <div class="mb-4 grid grid-cols-2 gap-2 sm:hidden">
    <button
      class="rounded-md bg-slate-800 py-2 text-sm font-semibold text-white"
    >
      První pololetí
    </button>
    <button
      class="rounded-md border border-slate-800 py-2 text-sm font-semibold text-slate-800"
    >
      Druhé pololetí
    </button>
  </div>

  <!-- Main grid: two halves -->
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div
      v-for="arr in [
        [9, 10, 11, 12, 1],
        [2, 3, 4, 5, 6, 7, 8],
      ]"
      :key="arr.join('-')"
    >
      <div v-for="i in arr" :key="i">
        <Month v-if="getMonthEvents(i - 1).length > 0" :month="months[i - 1]">
          <Event
            v-for="event in getMonthEvents(i - 1)"
            :key="event.id"
            :data="event"
          >
            <!-- Buttons grid -->
            <div class="mt-2 grid grid-cols-[auto_auto] gap-2">
              <!-- Info / edit button -->
              <button
                v-if="!event.withoutInfo"
                @click="handleEventInfoClick(event)"
                class="rounded-md border px-2 py-1 text-sm"
                :class="
                  event.infoPublished
                    ? 'bg-slate-600 text-white'
                    : edit
                      ? 'border-slate-400 text-slate-600'
                      : 'cursor-not-allowed border-slate-300 text-slate-300'
                "
              >
                <span v-if="edit" v-html="editIcon" />
                <span v-else>plakátek</span>
              </button>

              <!-- Delete button -->
              <button
                v-if="edit && !attendance"
                @click="handleDelete(event.id)"
                class="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M5.5 5.5v7a.5.5 0 0 0 1 0v-7a.5.5 0 0 0-1 0Zm3 0v7a.5.5 0 0 0 1 0v-7a.5.5 0 0 0-1 0Z"
                  />
                  <path
                    d="M14.5 3a1 1 0 0 1-1 1H13l-.8 10.4A2 2 0 0 1 10.2 16H5.8a2 2 0 0 1-2-1.6L3 4H2.5a1 1 0 1 1 0-2H6V1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h3.5a1 1 0 0 1 1 1Z"
                  />
                </svg>
              </button>
            </div>
          </Event>
        </Month>
      </div>
    </div>
  </div>
</template>
