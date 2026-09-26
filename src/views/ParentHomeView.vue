<script setup>
import { useAuthStore } from '@/stores/auth'
import { listChildrenOfParent } from '@/services/members'
import AreaFooter from '@/components/AreaFooter.vue'
import AreaHeader from '@/components/AreaHeader.vue'
import ParentHomeContent from '@/components/parent/ParentHomeContent.vue'

// Parent home — SPEC §3.1. Shows only the signed-in parent's children.
const auth = useAuthStore()
</script>

<template>
  <AreaHeader area="pro členy" />
  <ParentHomeContent :load-children="() => listChildrenOfParent(auth.user.uid)" />
  <AreaFooter />
</template>
