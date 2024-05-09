<script setup>

import {ref} from "vue";

const classDefault = "btn btn-sm btn-primary w-50 me-3"
const textDefault = "Přihlásit na akci"

const classSuccess = "btn btn-sm btn-success w-50 me-3"
const textSuccess = "Přihlášen!"

const classHover = "btn btn-sm btn-danger w-50 me-3"
const textHover = "Odhlásit?"

const currClass = ref(classDefault)
const currText = ref(textDefault)

const handleClick = () => {
  if (currClass.value === classDefault) {
    currClass.value = classSuccess
    currText.value = textSuccess
  }
  else if (currClass.value === classHover || currClass.value === classSuccess) {
    currClass.value = classDefault
    currText.value = textDefault
  }

}

const handleHover = (x) => {
  if (currClass.value !== classDefault) {
    switch (x) {
      case 0:
        currClass.value = classHover
        currText.value = textHover
            break
      case 1:
        currClass.value = classSuccess
        currText.value = textSuccess
    }

  }
}

</script>

<template>
  <button type="submit"
          :class="currClass"
          @click="handleClick"
          @mouseover="handleHover(0)"
          @mouseout="handleHover(1)">
    {{ currText }}
  </button>
</template>
