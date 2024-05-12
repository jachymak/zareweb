<script setup>
import Badge from "@/components/Badge.vue";

import {doc, onSnapshot} from "firebase/firestore";
import db from "@/firebase/firebase.js";
import {computed, ref} from "vue";

const props = defineProps({
  eventId: {
    type: String,
    required: true
  }
})

const title = ref('');
const who = ref('');
const leader = ref('');
const date = ref('');
const infoPar = ref('');
const whereName = ref('');
const whereUrl = ref('');
const meetingPamatnik = ref('');
const meetingHlavak = ref('');
const meetingCustom = ref('');
const returnPamatnik = ref('');
const returnHlavak = ref('');
const returnCustom = ref('');
const money = ref('');
const itemsDefault = ref('');
const itemsCustomList = ref([]);
const food = ref('');

const unsubscribe = onSnapshot(doc(db, "events", props.eventId), (doc) => {
  if (!doc.data().info) console.log("EventPage with no info!");
  else {
    title.value = doc.data().title;
    who.value = doc.data().who;
    leader.value = doc.data().leader;
    date.value = [doc.data().date[0].toDate(), doc.data().date[1].toDate()];

    infoPar.value = doc.data().info.infoPar;
    whereName.value = doc.data().info.where.whereName;
    whereUrl.value = doc.data().info.where.whereUrl;
    meetingPamatnik.value = doc.data().info.meeting.meetingPamatnik;
    meetingHlavak.value = doc.data().info.meeting.meetingHlavak;
    meetingCustom.value = doc.data().info.meeting.meetingCustom;
    returnPamatnik.value = doc.data().info.return.returnPamatnik;
    returnHlavak.value = doc.data().info.return.returnHlavak;
    returnCustom.value = doc.data().info.return.returnCustom;
    money.value = doc.data().info.money;
    itemsDefault.value = doc.data().info.items.itemsDefault;
    itemsCustomList.value = doc.data().info.items.itemsCustomList;
    food.value = doc.data().info.food;
  }
});

const dateString = computed(() => {
  if (!date.value) return "";

  const d = [date.value[0], date.value[1]];

  let month = ['' + (d[0].getMonth() + 1), '' + (d[1].getMonth() + 1)];
  let day = ['' + (d[0].getDate()), '' + (d[1].getDate())];

  if (day[0] === day[1] && month[0] === month[1]) return day[0] + "." + month[0] + ".";
  else if (month[0] === month[1]) return day[0] + ".-" + day[1] + "." + month[1] + ".";
  else return day[0] + "." + month[0] + ".-" + day[1] + "." + month[1] + ".";
})

const meetingInfo = computed(() => {
  let s = ["", ""]
  if (meetingCustom.value.length > 0) return meetingCustom.value
  if (meetingPamatnik.value.length > 0) s[0] = meetingPamatnik.value + " u Památníku"
  if (meetingHlavak.value.length > 0) s[1] = meetingHlavak.value + " na Hlavním nádraží"

  const b = (s[0].length > 0 && s[1].length > 0) ? ", " : ""
  return s[0] + b + s[1]
})

const returnInfo = computed(() => {
  let s = ["", ""]
  if (returnCustom.value.length > 0) return returnCustom.value
  if (returnHlavak.value.length > 0) s[1] = returnHlavak.value + " na Hlavní nádraží"
  if (returnPamatnik.value.length > 0) s[0] = returnPamatnik.value + " k Památníku"

  const b = (s[0].length > 0 && s[1].length > 0) ? ", " : ""
  return s[1] + b + s[0]
})

const itemsDefaultString = computed(() => {
  switch (itemsDefault.value) {
    case "jednodenni":
      return "Věi na jednodenní výpravu";
    case "chata":
      return "Věci na výpravu do chaty";
    case "rebl":
      return "Věci na výpravu pod rébl";
    default:
      return ""
  }
});

const itemsCustomString = computed(() => {
  if (itemsCustomList.value) {
    let str = itemsCustomList.value.join(", ");

    // Capitalize first letter
    if (!itemsDefault.value) str = str.charAt(0).toUpperCase() + str.slice(1);

    return str;
  }
  else return "";
})

</script>

<template>
  <div>
    <span class=""><badge :type="who" /> <h1>{{ title }} ({{ dateString }})</h1> </span>

    <p :class="[(infoPar.length > 0 ? '' : 'd-none')]">{{ infoPar }}</p>

    <p><b>Kam:</b> {{ whereName }} <span :class="[whereUrl ? '' : 'd-none']">(<a :href="whereUrl" target="_blank">mapa</a>)</span></p>
    <p><b>Sraz:</b> {{ meetingInfo }}</p>
    <p><b>Návrat:</b> {{ returnInfo }}</p>
    <p><b>Peněz:</b> {{ money }}</p>
    <p><b>S sebou:</b> {{ itemsDefaultString }}{{ (itemsCustomList.length > 0 && itemsDefaultString) ? ", " : ""}}{{ itemsCustomString }}</p>
    <p><b>Jídlo:</b> {{ food }}</p>
    <br>
    <p>Těší se na vás <b>{{ leader }}</b></p>

  </div>
</template>

<style scoped>

</style>