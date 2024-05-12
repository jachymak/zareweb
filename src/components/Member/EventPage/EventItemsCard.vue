<script setup>
  import {ref} from "vue";
  import {doc, onSnapshot} from "firebase/firestore";
  import db from "@/firebase/firebase.js";

  const props = defineProps({
    eventId: String
  })

  const itemsDefault = ref('');
  const itemsCustomList = ref(''); // TODO
  const itemsDefaultList = ref([]);

  onSnapshot(doc(db, "events", props.eventId), (d) => {
    if (!d.data().info) console.log("EventPage with no info!");
    else {
      itemsDefault.value = d.data().info.items.itemsDefault;
      itemsCustomList.value = d.data().info.items.itemsCustomList;

      if (itemsDefault.value !== "") onSnapshot(doc(db, "default-items", itemsDefault.value), (d2) => {
          itemsDefaultList.value = d2.data().items;
      });
    }
  });

</script>

<template>
  <div>
    <div class="row">
      <div class="col">

        <h5>
          <div class="form-check" v-for="(item, idx) in itemsDefaultList">
            <input class="form-check-input" type="checkbox" value="" :id="'check' + idx">
            <label class="form-check-label" :for="'check' + idx">
              {{ item }}
            </label>
          </div>
          ---
          <div class="form-check" v-for="(item, idx) in itemsCustomList">
            <input class="form-check-input" type="checkbox" value="" :id="'checkC' + idx">
            <label class="form-check-label" :for="'checkC' + idx">
              {{ item }}
            </label>
          </div>
        </h5>

      </div>
    </div>
  </div>
</template>

<style scoped>

</style>