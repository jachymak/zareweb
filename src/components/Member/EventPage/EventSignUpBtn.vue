<script setup>
import {computed, ref} from "vue";

const props = defineProps({
  childId: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(["statusChanged"])

const classDefault = "btn btn-sm btn-primary w-50"
const textDefault = "Přihlásit na akci"
const classSuccess = "btn btn-sm btn-success w-50"
const textSuccess = "Přihlášen!"
const classHover = "btn btn-sm btn-danger w-50"
const textHover = "Odhlásit?"

const st = ref(props.status)
const hover = ref(false)
const hoverOutHappened = ref(false)

const currClass = computed(() => {
  if (!st.value) return classDefault
  else if (st.value && hover.value && hoverOutHappened.value) return classHover
  else return classSuccess
})

const currText = computed(() => {
  if (!st.value) return textDefault
  else if (st.value && hover.value && hoverOutHappened.value) return textHover
  else return textSuccess
})

const handleClick = () => {
  st.value = !st.value
  hoverOutHappened.value = false

  emit("statusChanged", props.childId, st.value)
}

const handleHover = (x) => {
  x ? hover.value = true : hover.value = false
  if (!hoverOutHappened.value) hoverOutHappened.value = true
}

</script>

<template>
  <button type="submit" :class="currClass"
          @click="handleClick"
          @mouseover="handleHover(true)"
          @mouseout="handleHover(false)">
    {{ currText }}
  </button>
</template>
