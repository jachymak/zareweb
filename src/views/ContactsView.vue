<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { loadDirectory } from '@/services/directory'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import DirectoryRow from '@/components/directory/DirectoryRow.vue'
import PhoneSetup from '@/components/directory/PhoneSetup.vue'
import SharedContactForm from '@/components/directory/SharedContactForm.vue'
import { FILTERS, matchesFilter, saveToPhone } from '@/components/directory/directoryText'
import { LOAD_ERROR } from '@/components/parent/parentText'
import { foldText } from '@shared/skautisExport'

// Contacts — SPEC §4.10: the leaders' directory of children (with parents) and
// leaders to search and call / write from. „Přidat do telefonu“ offers saving
// them one by one („uložit“ by each) or the phone address book (CardDAV).
const auth = useAuthStore()

const entries = ref([])
const loading = ref(true)
const loadError = ref(false)
async function load() {
  try {
    entries.value = await loadDirectory()
  } catch (e) {
    console.error('Loading the directory failed', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

// The form of a shared contact („ostatní“): null, 'new' or the entry edited.
const editing = ref(null)
async function sharedSaved() {
  editing.value = null
  filter.value = 'others'
  await load()
}

const search = ref('')
const filter = ref('all')
const filters = computed(() =>
  FILTERS.map((f) => ({
    ...f,
    label: `${f.label} ${entries.value.filter((e) => matchesFilter(e, f.value)).length}`,
  })),
)
const shown = computed(() => {
  const words = foldText(search.value).split(' ').filter(Boolean)
  return entries.value.filter(
    (e) => matchesFilter(e, filter.value) && words.every((w) => e.search.includes(w)),
  )
})

const key = (e) => `${e.kind}-${e.id}`
// null (just the directory) | 'menu' (the two ways) | 'pick' („uložit“ by each) | 'sync' (CardDAV)
const mode = ref(null)
function close() {
  mode.value = null
}
const WAYS = [
  {
    mode: 'pick',
    title: 'Uložit jednotlivě',
    text: 'U koho chceš, dáš „uložit“ a máš ho v telefonu jako svůj vlastní kontakt.',
  },
  {
    mode: 'sync',
    title: 'Mít všechny a pořád aktuální',
    text: 'Telefon si kontakty bere z webu a sám je aktualizuje (noví přibudou, kdo odejde, zmizí).',
  },
]
const section = 'mx-auto max-w-[1000px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1"
          >← zpět na vedoucovskou stránku</RouterLink
        >
      </p>
      <div class="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div class="mr-auto">
          <p class="kicker m-0 -mb-0.5">komu zavolat</p>
          <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
            Kontakty
          </h1>
        </div>
        <button
          type="button"
          class="btn-outline px-4 py-2 text-[15.5px]"
          :aria-expanded="mode !== null"
          data-testid="phone-setup-toggle"
          @click="mode ? close() : (mode = 'menu')"
        >
          {{ mode ? 'zavřít' : 'Přidat do telefonu' }}
        </button>
      </div>
      <div
        v-if="mode === 'menu'"
        class="mb-7 grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Jak přidat do telefonu"
      >
        <button
          v-for="way in WAYS"
          :key="way.mode"
          type="button"
          class="cursor-pointer rounded-[3px] border-[1.5px] border-line bg-paper px-4 py-3.5 text-left hover:border-green"
          @click="mode = way.mode"
        >
          <span class="block text-[18px] font-medium text-ink">{{ way.title }}</span>
          <span class="mt-1 block text-[14.5px] leading-normal text-muted">{{ way.text }}</span>
        </button>
      </div>
      <div v-else-if="mode === 'sync'" class="mb-7">
        <button type="button" class="btn-link mb-2" @click="mode = 'menu'">← zpět na výběr</button>
        <PhoneSetup />
      </div>
      <div v-else-if="mode === 'pick'" class="note-warm mb-5" data-testid="pick-note">
        <p class="m-0">
          U kontaktu, který chceš mít v telefonu, dej „uložit“. Uloží se jako tvůj vlastní kontakt
          bez ⚜️ před jménem. Můžeš ho upravit a zůstane ti, jen se nebude aktualizovat.
        </p>
        <p class="m-0 mt-1">
          <b class="font-semibold">Na iPhonu</b> se kontakt otevře jako náhled — sjeď dolů a ťukni
          na „Vytvořit nový kontakt“.
        </p>
        <button type="button" class="btn-link mt-1" @click="close">hotovo</button>
      </div>
    </div>

    <p v-if="loading" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="text-red">{{ LOAD_ERROR }}</p>
    <div v-else :class="section" class="flex flex-col gap-3">
      <input
        v-model="search"
        type="search"
        class="field-input max-w-[480px] py-[11px]"
        placeholder="hledat jméno, přezdívku nebo rodiče"
        aria-label="Hledat"
        data-testid="directory-search"
      />
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Skupina">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          :aria-pressed="filter === f.value"
          class="cursor-pointer rounded-full border-[1.5px] border-ink px-[13px] py-[5px] text-[14.5px] font-medium whitespace-nowrap"
          :class="filter === f.value ? 'bg-ink text-cream' : 'bg-transparent text-text'"
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-x-4 text-[15px]">
        <span class="text-muted-2">{{ shown.length }} z {{ entries.length }}</span>
        <button
          v-if="!editing"
          type="button"
          class="btn-link"
          data-testid="add-shared-contact"
          @click="editing = 'new'"
        >
          + přidat kontakt (ostatní)
        </button>
      </div>
      <SharedContactForm
        v-if="editing"
        :key="editing === 'new' ? 'new' : editing.id"
        :contact="editing === 'new' ? null : editing"
        @saved="sharedSaved"
        @cancel="editing = null"
      />
      <p v-if="!shown.length" class="m-0 text-[16px] text-muted">Nikdo takový tu není.</p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <DirectoryRow
          v-for="entry in shown"
          :key="key(entry)"
          :entry="entry"
          :can-import="auth.role === 'admin'"
          :saving="mode === 'pick'"
          @save="saveToPhone([entry])"
          @edit="editing = entry"
        />
      </ul>
    </div>
  </main>
  <AreaFooter />
</template>
