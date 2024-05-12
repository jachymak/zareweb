<script setup>
  import { ref } from 'vue';
  import {doc, setDoc} from "firebase/firestore";
  import db from "@/firebase/firebase.js";
  import VueDatePicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css'

  const title = ref('');
  const who = ref('');
  const leader = ref('');
  const date = ref([]);

  const generateIdFromString = (inputString) => {
    let str = inputString
    // remove diactritics https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // Convert to lowercase
    str = str.toLowerCase();
    // Replace spaces with dashes
    str = str.replace(/\s+/g, '-');
    // Remove special characters
    str = str.replace(/[^\w-]/g, '');

    const year = new Date(date.value[0]).getFullYear()
    const month = new Date(date.value[0]).getMonth() + 1
    const day = new Date(date.value[0]).getDate()

    return year + "-" + (month < 10 ? "0" : "") + month
        + "-" + (day < 10 ? "0" : "") + day + "-" + who.value + "-" + str;
  }

  const onSubmit = async () => {
    if (!title.value || !who.value || !leader.value || !date.value) {
      console.log("hovno nemas vsechno vyplneny!")
      return;
    }

    await setDoc(doc(db, "vypravy", generateIdFromString(title.value)), {
      title: title.value,
      who: who.value,
      leader: leader.value,
      date: date.value,
      infoPublished: false
    })
    console.log(title.value)

    // Clear form fields
    title.value = ''
    who.value = ''
    leader.value = ''
    date.value = ''
  };
</script>

<template>
  <div class="container-fluid py-3">
    <div class="row">
      <h3>Přidat akci</h3>
    </div>

    <form id="form" @submit.prevent="onSubmit">
      <div class="row">
        <div class="col px-4">

          <div class="row">
            <div class="col p-0">
              <div class="mb-3">
                <label for="title" class="form-label">Název akce</label>
                <input type="text" id="title" v-model="title" class="form-control">
              </div>
            </div>
          </div>


          <div class="row">
            <div class="col p-0">
              <div class="mb-3">
                <label for="who" class="form-label">Pro koho</label>
                <select class="form-select" id="who" v-model="who">
                  <option value="v">vlčušky</option>
                  <option value="s">skauti</option>
                  <option value="a">všichni</option>
                </select>
              </div>
            </div>
          </div>


          <div class="row">
            <div class="col p-0">
              <div class="mb-3">
                <label for="leader" class="form-label">Vedoucí</label>
                <input type="text" class="form-control" id="leader" v-model="leader">
              </div>
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-9 p-0">
                <label class="form-check-label" for="campCheck">
                  Akce bez plakátku <br class="d-none d-md-inline">(např. tábor)
                </label>
            </div>
            <div class="col-3 p-0 text-end">
              <input class="form-check-input" type="checkbox" value="" id="campCheck" style="width: 25px; height: 25px;">
            </div>
          </div>

        </div>

        <div class="col d-flex justify-content-center mt-4 mt-md-2">
          <div class="mb-3">
            <VueDatePicker v-model="date" locale="cs" range inline auto-apply
                           :enable-time-picker="false"
                           :start-time="[{ hours: 0, minutes: 0 }, { hours: 0, minutes: 0 }]"/>
          </div>
        </div>
      </div>

      <div class="row mt-3 px-2">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </form>
  </div>

</template>
