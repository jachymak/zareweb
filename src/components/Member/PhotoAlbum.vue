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
  padding-top: 100%; /* 1:1 Aspect Ratio */
  position: relative;
  overflow: hidden;
  cursor: pointer; /* Show pointer on hover */
}

.square::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: v-bind('imageUrlAttribute'); /* Background image URL */
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
  background-color: rgba(0, 0, 0, 0.6); /* Dark overlay */
  text-align: center;
  padding: 10%;
  margin: auto; /* Centers the content */
  flex-direction: column; /* Allows text to wrap to multiple lines */
  box-sizing: border-box; /* Ensures padding is included in the element's total width and height */
}

.square:hover .square-content {
  opacity: 1; /* Show text on hover */
}

/* Media Query for Small Screens */
@media (max-width: 767px) {
  .square::after {
    opacity: 1; /* Show dark overlay by default on smaller screens */
  }
  .square:hover::after .square-content {
    opacity: 1; /* Keep dark overlay visible on hover for smaller screens */
  }
}
</style>
