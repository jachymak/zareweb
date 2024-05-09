<script setup>
import VypravaForm from "@/components/VypravaForm.vue";
import Vypravnik from "@/components/Vypravnik/Vypravnik.vue";
import EventInfoForm from "@/components/EventInfoForm.vue";
import EventInfo from "@/components/EventInfo.vue";
import {computed, ref, watch} from "vue";
import EventItemsCard from "@/components/EventItemsCard.vue";

const currentEventId = ref('');

const handleEventInfoClicked = (id) => {
  currentEventId.value = id
}

</script>

<template>
  <div class="container-fluid mt-5 px-5 mb-5">
    <div class="row">
      <div class="col-12 col-md-6">
        <event-info event-id="2024-05-24-a-sportovni-vyprava" />
      </div>
      <div class="col-12 col-md-6 ps-5">
        <event-items-card event-id="2024-05-24-a-sportovni-vyprava"></event-items-card>
      </div>
    </div>


    <div class="row">
      <div class="col-12 col-md-6">
        <vyprava-form />
      </div>
      <div class="col-12 col-md-6">
        <vypravnik @eventInfoClicked="handleEventInfoClicked" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        <event-info-form :id="currentEventId" />
      </div>
      <div class="col"></div>
    </div>
  </div>
</template>
