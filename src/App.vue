<script setup></script>

<template>
  <p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
  <p><RouterLink to="/">Go to Home</RouterLink></p>
  <p><RouterLink to="/member">Go to Member</RouterLink></p>

  <RouterView :key="$route.fullPath" />
</template>
