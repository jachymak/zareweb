<script setup>
  import EventsList from "@/components/EventsList/EventsList.vue";
  import NewEventForm from "@/components/Admin/Events/NewEventForm.vue";
  import EventInfoForm from "@/components/Admin/Events/EventInfoForm.vue";
  import AdminPageLayout from "@/components/Admin/AdminPageLayout.vue";

</script>

<template>
  <admin-page-layout title="Výpravy">
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
  </admin-page-layout>
</template>

<style scoped>

</style>