<script setup>
  import { useRouter, useRoute } from 'vue-router';
  import EventInfo from "@/components/EventInfo.vue";
  import EventItemsCard from "@/components/EventItemsCard.vue";

  const router = useRouter();
  const route = useRoute();
  const eventId = route.params.id;

  const handleExitClick = () => {
    router.push("/login");
  };

</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-end">
      <div class="col-1">
        <button class="btn btn-sm btn-light" @click="handleExitClick">X</button>
      </div>
    </div>

    <div class="row">
      <div class="col-12 col-md-7">
        <event-info :event-id="eventId" /> <!-- 2024-05-24-a-sportovni-vyprava -->
      </div>
      <div class="col-12 col-md-5 ps-5">
        <event-items-card :event-id="eventId"></event-items-card>
      </div>
    </div>
  </div>
</template>
