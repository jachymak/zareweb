<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountsPanel from '@/components/admin/AccountsPanel.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import ChildrenPanel from '@/components/admin/ChildrenPanel.vue'
import EventEmailsPanel from '@/components/admin/EventEmailsPanel.vue'
import MeetingsPanel from '@/components/admin/MeetingsPanel.vue'
import PackingTemplatesPanel from '@/components/admin/PackingTemplatesPanel.vue'
import SettingsPanel from '@/components/admin/SettingsPanel.vue'
import WaitlistPanel from '@/components/admin/WaitlistPanel.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'

// Administration (admins only) — SPEC §4.8. Tabs are added as they are built;
// the open tab is kept in the URL (?zalozka=deti).
const TABS = [
  { id: 'deti', label: 'děti', panel: ChildrenPanel },
  { id: 'ucty', label: 'účty a párování', panel: AccountsPanel },
  { id: 'schuzky', label: 'schůzky', panel: MeetingsPanel },
  { id: 'cekaci-listina', label: 'čekací listina', panel: WaitlistPanel },
  { id: 'emaily-akce', label: 'e-maily k akcím', panel: EventEmailsPanel },
  { id: 'sablony', label: 'šablony s sebou', panel: PackingTemplatesPanel },
  { id: 'nastaveni', label: 'nastavení', panel: SettingsPanel },
]
const DEFAULT_TAB = 'ucty'

const route = useRoute()
const router = useRouter()
const tab = computed({
  get: () => (TABS.some((t) => t.id === route.query.zalozka) ? route.query.zalozka : DEFAULT_TAB),
  set: (id) => router.replace({ query: id === DEFAULT_TAB ? {} : { zalozka: id } }),
})
const panel = computed(() => TABS.find((t) => t.id === tab.value).panel)
</script>

<template>
  <LeaderHeader />
  <main class="mx-auto max-w-[1040px] px-4 pt-6 pb-20 sm:px-6">
    <p class="m-0 mb-2.5 text-[15px]">
      <RouterLink to="/vedouci">← zpět na vedoucovskou stránku</RouterLink>
    </p>
    <p class="kicker m-0">jen pro správce oddílu</p>
    <h1 class="m-0 mb-[18px] text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
      Administrace
    </h1>
    <AdminTabs v-model="tab" :tabs="TABS" class="mb-5" />
    <component :is="panel" @open-tab="(id) => (tab = id)" />
  </main>
</template>
