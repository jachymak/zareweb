import { defineStore } from "pinia";
import { ref } from "vue";

export const useSubscriptionsStore = defineStore("subscriptions", () => {
  const activeSubscriptions = ref([]);

  function unsubscribeAll() {
    activeSubscriptions.value.forEach((unsub) => unsub());
  }

  function unsubscribeOne(unsub) {
    activeSubscriptions.value.find(unsub)();
  }

  return { activeSubscriptions, unsubscribeAll, unsubscribeOne };
});
