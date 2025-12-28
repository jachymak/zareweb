import { defineStore } from "pinia";
import { ref } from "vue";

export const useEventStore = defineStore("event", () => {
  const currentEventId = ref("");
  const currentEventLabel = ref({});

  function setCurrentEvent(id, title, who) {
    currentEventId.value = id;
    currentEventLabel.value.title = title;
    currentEventLabel.value.who = who;
  }

  function resetCurrentEvent() {
    currentEventId.value = "";
    currentEventLabel.value = {};
  }

  return {
    currentEventId,
    currentEventLabel,
    setCurrentEvent,
    resetCurrentEvent,
  };
});
