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

        <div class="card bg-sand-light">
          <div class="card-body py-3 px-4">

            <h5 style="font-weight: normal !important;">
              <div class="row mb-2" v-for="(item, idx) in itemsDefaultList">
                <div class="col">
                  <input class="form-check-input m-0 align-middle" type="checkbox" value="" :id="'check' + idx">
                  <label class="form-check-label align-middle ms-3" :for="'check' + idx">
                    {{ item }}
                  </label>
                </div>
              </div>

              <hr>

              <div class="row mb-2" v-for="(item, idx) in itemsCustomList">
                <div class="col">
                  <input class="form-check-input m-0 align-middle" type="checkbox" value="" :id="'check' + idx">
                  <label class="form-check-label align-middle ms-3" :for="'check' + idx">
                    {{ item }}
                  </label>
                </div>
              </div>

            </h5>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>

</style>