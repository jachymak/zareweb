<script setup>

import {computed} from "vue";

const props = defineProps({
  userData: { type: Object, required: true },
  short: { type: Boolean, required: true },
  // true: nick or firstName lastName[0].
  // false: nick (firstName lastName) or firstName lastName
  bold: Boolean
})

const hasNick = computed(() => {
  return props.userData.nickname.length > 0
})

const boldStyle = computed(() => {
  if (props.bold) return "font-weight: bold;"
  else return ""
})

</script>

<template>
  <span v-if="short">
    <span v-if="hasNick">
      <span :style="boldStyle">{{ props.userData.nickname }}</span>
    </span>
    <span v-else>
      <span :style="boldStyle">{{ props.userData.firstName }} {{ Array.from(props.userData.lastName)[0] }}.</span>
    </span>
  </span>

  <span v-else>
    <span v-if="hasNick">
      <span :style="boldStyle">{{ props.userData.nickname }}</span> ({{ props.userData.firstName + ' ' + props.userData.lastName }})
    </span>
    <span v-else>
      <span :style="boldStyle">{{ props.userData.firstName }}</span> {{ props.userData.lastName }}
    </span>
  </span>
</template>
