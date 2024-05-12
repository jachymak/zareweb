<script setup>
import Badge from "@/components/Badge.vue";
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const dateString = computed(() => {
  const d = [props.data.date[0], props.data.date[1]];

  let month = ['' + (d[0].getMonth() + 1), '' + (d[1].getMonth() + 1)];
  let day = ['' + (d[0].getDate()), '' + (d[1].getDate())];

  if (day[0] === day[1] && month[0] === month[1]) return day[0] + "." + month[0] + ".";
  else if (month[0] === month[1]) return day[0] + ".-" + day[1] + "." + month[1] + ".";
  else return day[0] + "." + month[0] + ".-" + day[1] + "." + month[1] + ".";
})

</script>

<template>
  <div class="container-fluid">
    <div class="row mb-2">
      <div class="card bg-sand-light">
        <div class="card-body py-2 px-1">

          <div class="container-fluid">
            <div class="row align-items-center d-flex justify-content-around">
              <div class="col-2 col-md-2 p-0 text-truncate">{{ dateString }}</div>
              <div class="col-6 col-md-5 p-0 text-truncate"><badge :type="data.who" />{{ data.title }}</div>
              <div class="col-md-3 d-none d-md-block">{{ data.leader }}</div>
              <div class="col-2 text-center p-0">
                <slot />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

</template>