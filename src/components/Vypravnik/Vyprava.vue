<script setup>
import Badge from "@/components/Badge.vue";
import { computed } from 'vue';
import db from "@/firebase/firebase.js"
import { doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const onEventInfoClicked = () => {
  if (props.data.infoPublished) router.push("/event/" + props.data.id);
}

const handleDelete = async (id) => {
  await deleteDoc(doc(db, "vypravy", id));
  console.log("deleted")
}

const dateString = computed(() => {
  const d = [props.data.date[0], props.data.date[1]];

  let month = ['' + (d[0].getMonth() + 1), '' + (d[1].getMonth() + 1)];
  let day = ['' + (d[0].getDate()), '' + (d[1].getDate())];

  if (day[0] === day[1] && month[0] === month[1]) return day[0] + "." + month[0] + ".";
  else if (month[0] === month[1]) return day[0] + ".-" + day[1] + "." + month[1] + ".";
  else return day[0] + "." + month[0] + ".-" + day[1] + "." + month[1] + ".";
})

const infoPublished = computed(() => { return props.data.infoPublished })
</script>

<template>
  <div class="row my-1">
    <div class="card bg-sand-light">
      <div class="card-body p-2">
        <div class="row align-items-center flex-nowrap">
          <div class="col-3 col-md-2">{{ dateString }}</div>
          <div class="col-5 col-md-5"><badge :type="data.who" />{{ data.title }}</div>
          <div class="col-md-3 d-none d-md-block">{{ data.leader }}</div>
          <div class="col d-flex justify-content-end">
            <button :class="['btn', 'btn-sm', (infoPublished ? 'btn-secondary' : ['btn-outline-secondary', 'disabled'])]" @click="onEventInfoClicked">plakátek</button>
            <button :class="['btn', 'btn-sm', 'btn-secondary', 'd-none']" @click="handleDelete(data.id)">del</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>