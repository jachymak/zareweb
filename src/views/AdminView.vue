<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountsPanel from '@/components/admin/AccountsPanel.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import ChildrenPanel from '@/components/admin/ChildrenPanel.vue'
import ContactsPanel from '@/components/admin/ContactsPanel.vue'
import EmailsPanel from '@/components/admin/EmailsPanel.vue'
import MeetingsPanel from '@/components/admin/MeetingsPanel.vue'
import PackingTemplatesPanel from '@/components/admin/PackingTemplatesPanel.vue'
import SettingsPanel from '@/components/admin/SettingsPanel.vue'
import SkautisPanel from '@/components/admin/SkautisPanel.vue'
import WaitlistPanel from '@/components/admin/WaitlistPanel.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'

// Administration (admins only) — SPEC §4.8. Tabs are added as they are built;
// the open tab is kept in the URL (?zalozka=deti).
const TABS = [
  { id: 'skautis', label: 'skautIS', panel: SkautisPanel },
  { id: 'deti', label: 'děti', panel: ChildrenPanel },
  { id: 'ucty', label: 'účty a párování', panel: AccountsPanel },
  { id: 'kontakty', label: 'kontakty', panel: ContactsPanel },
  { id: 'schuzky', label: 'schůzky', panel: MeetingsPanel },
  { id: 'cekaci-listina', label: 'čekací listina', panel: WaitlistPanel },
  { id: 'emaily', label: 'e-maily', panel: EmailsPanel },
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

// Back from the skautIS login (public/skautis/prihlaseni.php) with the token in
// the hash: hand it to the skautIS tab and drop it from the URL.
const skautisToken = ref(new URLSearchParams(route.hash.slice(1)).get('skautis'))
if (skautisToken.value) router.replace({ query: { zalozka: 'skautis' }, hash: '' })
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
    <component
      :is="panel"
      v-bind="tab === 'skautis' ? { token: skautisToken } : {}"
      @open-tab="(id) => (tab = id)"
      @token-used="skautisToken = null"
    />
  </main>
</template>
