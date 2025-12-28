<script setup>
import { ref } from "vue";
import { doc, setDoc } from "firebase/firestore";
import db from "@/firebase/firebase.js";

import { cs } from "date-fns/locale";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const title = ref("");
const who = ref("");
const leader = ref("");
const date = ref(null);
const withoutInfo = ref(false);

const generateIdFromString = (inputString) => {
  let str = inputString;
  // remove diactritics https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Convert to lowercase
  str = str.toLowerCase();
  // Replace spaces with dashes
  str = str.replace(/\s+/g, "-");
  // Remove special characters
  str = str.replace(/[^\w-]/g, "");

  const year = new Date(date.value[0]).getFullYear();
  const month = new Date(date.value[0]).getMonth() + 1;
  const day = new Date(date.value[0]).getDate();

  return (
    year +
    "-" +
    (month < 10 ? "0" : "") +
    month +
    "-" +
    (day < 10 ? "0" : "") +
    day +
    "-" +
    who.value +
    "-" +
    str
  );
};

const onSubmit = async () => {
  if (!title.value || !who.value || !date.value[0] || !date.value[1]) {
    return;
  }

  await setDoc(doc(db, "events", generateIdFromString(title.value)), {
    title: title.value,
    who: who.value,
    leader: leader.value,
    date: date.value,
    withoutInfo: withoutInfo.value,
    infoPublished: false,
    info: {},
    registeredChildren: [],
  });
  console.log(title.value);

  // Clear form fields
  title.value = "";
  who.value = "";
  leader.value = "";
  date.value = null;
  withoutInfo.value = false;
};
</script>

<template>
  <div class="m-4">
    <h3 class="mb-4">Přidat akci</h3>

    <form id="form" @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-12">
        <div class="mr-12 ml-4 sm:col-span-8">
          <label for="title" class="block text-sm/6 font-medium text-white"
            >Název akce</label
          >
          <div class="mt-2">
            <input
              id="title"
              type="text"
              v-model="title"
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>

          <label for="who" class="block text-sm/6 font-medium text-white"
            >Pro koho</label
          >
          <div class="mt-2 grid grid-cols-1">
            <select
              id="who"
              v-model="who"
              class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-white outline-1 -outline-offset-1 outline-white/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            >
              <option value="v">vlčušky</option>
              <option value="s">skauti</option>
              <option value="a">všichni</option>
            </select>
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              data-slot="icon"
              aria-hidden="true"
              class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-400 sm:size-4"
            >
              <path
                d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
                fill-rule="evenodd"
              />
            </svg>
          </div>

          <label for="leader" class="block text-sm/6 font-medium text-white"
            >Vedoucí</label
          >
          <div class="mt-2">
            <input
              v-model="leader"
              type="text"
              id="leader"
              class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>

          <div class="group grid size-4 grid-cols-1">
            <input
              v-model="withoutInfo"
              type="checkbox"
              value=""
              id="withoutInfo"
              class="col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:checked:bg-white/10 forced-colors:appearance-auto"
            />
            <svg
              viewBox="0 0 14 14"
              fill="none"
              class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-white/25"
            >
              <path
                d="M3 8L6 11L11 3.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-0 group-has-checked:opacity-100"
              />
              <path
                d="M3 7H11"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-0 group-has-indeterminate:opacity-100"
              />
            </svg>
          </div>

          <div class="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="submit"
              class="cursor-pointer rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Save
            </button>
          </div>
        </div>

        <div class="mx-auto sm:col-span-4">
          <VueDatePicker
            v-model="date"
            :locale="cs"
            range
            inline
            auto-apply
            :time-config="{ enableTimePicker: false }"
            :month-change-on-scroll="false"
            :start-time="[
              { hours: 0, minutes: 0 },
              { hours: 0, minutes: 0 },
            ]"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
