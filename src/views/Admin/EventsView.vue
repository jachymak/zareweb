<script setup>
  import EventsList from "@/components/EventsList/EventsList.vue";
  import NewEventForm from "@/components/Admin/Events/NewEventForm.vue";
  import EventInfoForm from "@/components/Admin/Events/EventInfoForm.vue";

</script>

<template>
  <div class="container-fluid">
    <div class="row text-center bg-sand py-4"><h1 class="m-0">Výpravy</h1></div>
  </div>
  <div class="container my-5">
    <div class="row">
      <div class="col">
        <event-info-form />
      </div>

      <div class="col">
        <div class="row">
          <div class="col">
            <events-list :edit="true"/>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col bg-sand">
            <new-event-form />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>