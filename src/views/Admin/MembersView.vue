<script setup>
  import {ref} from "vue";
  import getMembersSkautIS from "@/soap/getMembersSkautIS.js";
  import {doc, setDoc} from "firebase/firestore";
  import db from "@/firebase/firebase.js";
  import AdminPageLayout from "@/components/Admin/AdminPageLayout.vue";
  import {useMembersStore} from "@/stores/members.js";
  import {storeToRefs} from "pinia";

  const membersStore = useMembersStore()
  const { userAccounts, children, leaders } = storeToRefs(membersStore)

  membersStore.getUserAccounts()
  membersStore.getMembers()

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
  <admin-page-layout title="Členové">



    <div class="row">
      <div class="col col-md-5">
        <h2>Děti</h2>

        <table class="table table-striped">
          <caption><i>Ve SkautISu nastavená kategorie benjamínek/vlče/světluška/skaut/skautka</i></caption>
          <thead>
          <tr>
            <th scope="col" class="col-2">Dítě</th>
            <th scope="col" class="col-7">Propojené účty</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="ch in children" :key="ch.id">
            <td>{{ch.nickname}} {{ ch.firstName }}&nbsp;{{ ch.lastName }}</td>  <!-- TODO truncate text -->
            <td>{{ ch.accounts.map(acc => acc.email).join(", ") }}</td>
          </tr>

          </tbody>
        </table>

      </div>

      <div class="col col-md-7">
        <h2>Vedoucí</h2>

        <table class="table table-striped">
          <caption><i>Ve SkautISu nastavená kategorie rover/ranger</i></caption>
          <thead>
          <tr>
            <th scope="col">Jméno</th>
            <th scope="col">E-mail</th>
            <th scope="col" class="d-none d-md-block">Telefon</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="l in leaders" :key="l.id">
            <td>{{ l.nickname }} {{ l.firstName }}&nbsp;{{ l.lastName }}</td>
            <td>jachym.vitecek@gmail.com</td>
            <td class="d-none d-md-block">776 019 939</td>
          </tr>

          </tbody>
        </table>

        <div class="row mt-4 px-5">
          <button class="btn btn-secondary disabled" @click="updateMembers">Aktualizovat data ze SkautISu</button>
          <p v-if="status === 1">Fetching...</p>
          <p v-if="status === 2">Updating database...</p>
          <p v-if="status === 3">DONE!</p>
          <p>Pro aktualizaci dat je vyžadováno přihlášení do systému SkautIS</p>

        </div>

      </div>
    </div>

  </admin-page-layout>
</template>
