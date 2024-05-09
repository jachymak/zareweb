<script setup>
import {computed, defineProps, ref, watch} from 'vue';
  import {collection, doc, onSnapshot, orderBy, query, updateDoc} from "firebase/firestore";
  import db from "@/firebase/firebase.js";

  const props = defineProps({
    id: {
      type: String
    }
  });

  const currentEventId = computed(() => props.id)

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
  const itemsCustom = ref('');

  const food = ref('');

  const infoPublished = ref(false);

  const clearFields = () => {
    infoPar.value = '';
    whereName.value = '';
    whereUrl.value = '';
    meetingPamatnik.value = '';
    meetingHlavak.value = '';
    meetingCustom.value = '';
    returnPamatnik.value = '';
    returnHlavak.value = '';
    returnCustom.value = '';
    money.value = '';
    itemsDefault.value = '';
    itemsCustom.value = '';
    food.value = '';
    infoPublished.value = false;
  }

  ////////

  let unsubscribe = null;

  watch(currentEventId, () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (currentEventId.value) unsubscribe = onSnapshot(doc(db, "vypravy", currentEventId.value), (doc) => {
      if (!doc.data().info) clearFields();
      else {
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
        itemsCustom.value = doc.data().info.items.itemsCustomList.join(", ");

        food.value = doc.data().info.food;

        infoPublished.value = doc.data().infoPublished;
      }
    });
  });


  // TODO refresh form warning

  const onSubmit = async () => {
    // if (!title.value || !who.value || !leader.value || !date.value) {
    //   console.log("hovno nemas vsechno vyplneny!")
    //   return;
    // }

    const itemsCustomList = itemsCustom.value ? itemsCustom.value.split(", ") : [];

    const moneyWithCurrency = /^\d+\s*$/.test(money.value) ? money.value.replace(/\s/g, '') + " Kč" : money.value;

    const infoData = {
      infoPar: infoPar.value,
      where: {
        whereName: whereName.value,
        whereUrl: whereUrl.value
      },
      meeting: {
        meetingPamatnik: meetingPamatnik.value,
        meetingHlavak: meetingHlavak.value,
        meetingCustom: meetingCustom.value
      },
      return: {
        returnPamatnik: returnPamatnik.value,
        returnHlavak: returnHlavak.value,
        returnCustom: returnCustom.value
      },
      money: moneyWithCurrency,
      items: {
        itemsDefault: itemsDefault.value,
        itemsCustomList: itemsCustomList,
      },
      food: food.value
    }

    await updateDoc(doc(db, "vypravy", currentEventId.value), {
      infoPublished: infoPublished.value,
      info: infoData
    })
  };
</script>

<template>
  id: {{currentEventId}}
  <form id="form" @submit.prevent="onSubmit">
    <div class="mb-3">
      <label for="infoPar" class="form-label">Obecné informace o výpravě</label>
      <textarea type="text" id="infoPar" v-model="infoPar" class="form-control" rows="3"></textarea>
    </div>

    <div class="row">
      <div class="col">
        <div class="mb-3">
          <label for="whereName" class="form-label">Kam se jede?</label>
          <input type="text" id="whereName" v-model="whereName" class="form-control">
        </div>
      </div>

      <div class="col">
        <div class="mb-3">
          <label for="whereUrl" class="form-label">Odkaz na mapu</label>
          <input type="text" id="whereUrl" v-model="whereUrl" class="form-control">
        </div>
      </div>
    </div>

    <label for="meetingPamatnik" class="form-label"><b>Sraz</b></label>
    <div class="row">
      <div class="col">
        <div class="mb-3">
          <label for="meetingPamatnik" class="form-label">Čas u památníku</label>
          <input type="text" id="meetingPamatnik" v-model="meetingPamatnik" class="form-control">
        </div>
      </div>

      <div class="col">
        <div class="mb-3">
          <label for="meetingHlavak" class="form-label">Čas na Hlaváku</label>
          <input type="text" id="meetingHlavak" v-model="meetingHlavak" class="form-control">
        </div>
      </div>
    </div>

    <div class="col">
      <div class="mb-3">
        <label for="meetingCustom" class="form-label">Sraz jinde</label>
        <input type="text" id="meetingCustom" v-model="meetingCustom" class="form-control" placeholder="16:40 na nádraží Praha-Podbaba">
      </div>
    </div>

    <label for="returnPamatnik" class="form-label"><b>Návrat</b></label>
    <div class="row">
      <div class="col">
        <div class="mb-3">
          <label for="returnHlavak" class="form-label">Čas na Hlaváku</label>
          <input type="text" id="returnHlavak" v-model="returnHlavak" class="form-control">
        </div>
      </div>

      <div class="col">
        <div class="mb-3">
          <label for="returnPamatnik" class="form-label">Čas u památníku</label>
          <input type="text" id="returnPamatnik" v-model="returnPamatnik" class="form-control">
        </div>
      </div>
    </div>

    <div class="col">
      <div class="mb-3">
        <label for="returnCustom" class="form-label">Návrat jinde</label>
        <input type="text" id="returnCustom" v-model="returnCustom" class="form-control" placeholder="16:40 na nádraží Praha-Podbaba">
      </div>
    </div>


    <div class="mb-3">
      <label for="money" class="form-label">Peněz</label>
      <input type="text" id="money" v-model="money" class="form-control">
    </div>

    <div class="row">
      <div class="col">
        <div class="mb-3">
          <label for="itemsDefault" class="form-label">S sebou</label>
          <select class="form-select" id="itemsDefault" v-model="itemsDefault">
            <option selected value="">-</option>
            <option value="jednodenni">Věci na jednodenní výpravu</option>
            <option value="chata">Věci na výpravu do chaty</option>
            <option value="rebl">Věci na výpravu pod rébl</option>
          </select>
        </div>
      </div>

      <div class="col">
        <div class="mb-3">
          <label for="itemsCustom" class="form-label">Další</label>
          <input type="text" id="itemsCustom" v-model="itemsCustom" class="form-control">
        </div>
      </div>
    </div>


    <div class="mb-3">
      <label for="food" class="form-label">Jídlo</label>
      <input type="text" class="form-control" id="food" v-model="food">
    </div>

    <div class="row">
      <div class="col">
        <button type="submit" class="btn btn-primary me-3">Uložit</button>
      </div>
      <div class="col">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="" id="infoPublished" v-model="infoPublished">
          <label class="form-check-label" for="infoPublished">
            Zveřejnit plakátek
          </label>
        </div>
      </div>
    </div>
  </form>
</template>
