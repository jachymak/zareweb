<script setup>
  import {ref} from "vue";
  import getMembersSkautIS from "@/soap/getMembersSkautIS.js";
  import {doc, setDoc} from "firebase/firestore";
  import db from "@/firebase/firebase.js";

  const status = ref(0);

  const updateMembers = async () => {
    status.value = 1;
    await getMembersSkautIS()
        .then(async (members) => {
          status.value = 2;
          for (const member of members) {
            const id = member.id;
            delete member.id;
            await setDoc(doc(db, "members", id), member);
          }
          status.value = 3;
        })
        .catch((err) => {
          console.log(err);
        })
  }

</script>

<template>
  <div class="container mt-5">
    <button class="btn btn-secondary" @click="updateMembers">Aktualizovat data ze SkautISu</button>
    <p v-if="status === 1">Fetching...</p>
    <p v-if="status === 2">Updating database...</p>
    <p v-if="status === 3">DONE!</p>

  </div>
</template>
