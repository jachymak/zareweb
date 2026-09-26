<script setup>
import { ref } from 'vue'
import AccountsPanel from '@/components/admin/AccountsPanel.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'

// Administration (admins only) — SPEC §4.8. Tabs are added as they are built.
const TABS = [{ id: 'accounts', label: 'účty a párování' }]
const tab = ref('accounts')
</script>

<template>
  <LeaderHeader :troop-switch="false" />
  <main class="mx-auto max-w-[1040px] px-4 pt-6 pb-20 sm:px-6">
    <p class="m-0 mb-2.5 text-[15px]">
      <RouterLink to="/vedouci">← zpět na vedoucovskou stránku</RouterLink>
    </p>
    <p class="kicker m-0">jen pro správce oddílu</p>
    <h1 class="m-0 mb-[18px] text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
      Administrace
    </h1>
    <AdminTabs v-model="tab" :tabs="TABS" class="mb-5" />
    <AccountsPanel v-if="tab === 'accounts'" />
  </main>
</template>
