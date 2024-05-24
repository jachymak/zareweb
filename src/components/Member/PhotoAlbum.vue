<script setup>
  import {computed} from "vue";

  const props = defineProps({
    data: { type: Object, required: true }
  });

  const imageUrlAttribute = computed(() => {
    return "url(" + props.data.thumbnailUrl + ")"
  })
</script>

<template>
    <a :href="data.link" target="_blank">
      <div class="square">
        <div class="square-content">{{ data.title }}</div>
      </div>
    </a>
</template>

<style>
.square {
  width: 100%;
  padding-top: 100%;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.square::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: v-bind('imageUrlAttribute');
  background-size: cover;
  background-position: center;
  transition: background-color 0.3s ease;
}

.square-content {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  background-color: rgba(0, 0, 0, 0.6);
  text-align: center;
  padding: 10%;
  margin: auto;
  flex-direction: column;
  box-sizing: border-box;
}

.square:hover .square-content {
  opacity: 1;
}

@media (max-width: 767px) {
  .square::after {
    opacity: 1;
  }
  .square:hover::after .square-content {
    opacity: 1;
  }
}
</style>
