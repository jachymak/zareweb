<script setup>
  import {computed, ref} from "vue";
  import getMembersSkautIS from "@/soap/getMembersSkautIS.js";

  const response = ref([]);

  (async () => {
    // Call the SOAP request function and assign the response to the ref
    response.value = await getMembersSkautIS();
  })();

</script>

<template>
  {{ response.length > 0 ? response : "Loading..."}}

</template>
