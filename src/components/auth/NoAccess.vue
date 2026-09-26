<script setup>
import { GROUP_EMAIL } from '@/constants/troops'
import { useAuthStore } from '@/stores/auth'
import CardTitle from './CardTitle.vue'

// Account rejected or deactivated by the admin (role `none`).
defineEmits(['sign-out'])

const auth = useAuthStore()
</script>

<template>
  <div>
    <CardTitle>Účet nemá přístup</CardTitle>
    <p class="m-0 mb-4 text-base leading-relaxed text-muted">
      Účet
      <strong class="font-medium break-words text-ink">{{ auth.user?.email }}</strong>
      správce neschválil, nebo mu přístup ukončil. Pokud jde o omyl, napiš nám na
      <a :href="`mailto:${GROUP_EMAIL}`">{{ GROUP_EMAIL }}</a
      >.
    </p>
    <button type="button" class="btn-link" @click="$emit('sign-out')">odhlásit se</button>
  </div>
</template>
