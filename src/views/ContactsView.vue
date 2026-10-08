<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { loadDirectory } from '@/services/directory'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import DirectoryRow from '@/components/directory/DirectoryRow.vue'
import PhoneSetup from '@/components/directory/PhoneSetup.vue'
import {
  FILTERS,
  hasContacts,
  matchesFilter,
  saveToPhone,
} from '@/components/directory/directoryText'
import { LOAD_ERROR } from '@/components/parent/parentText'
import { foldText } from '@shared/skautisExport'

// Contacts — SPEC §4.10: the leaders' directory of children (with parents) and
// leaders to search and call / write from. „Přidat do telefonu“ offers saving
// chosen ones (the list gets checkboxes) or the phone address book (CardDAV).
const auth = useAuthStore()

const entries = ref([])
const loading = ref(true)
const loadError = ref(false)
onMounted(async () => {
  try {
    entries.value = await loadDirectory()
  } catch (e) {
    console.error('Loading the directory failed', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
})

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
const selected = ref(new Set())
const selectedEntries = computed(() => entries.value.filter((e) => selected.value.has(key(e))))
function setSelected(entry, on) {
  const next = new Set(selected.value)
  if (on) next.add(key(entry))
  else next.delete(key(entry))
  selected.value = next
}
const selectable = computed(() => shown.value.filter(hasContacts))
const allShownSelected = computed(
  () => selectable.value.length && selectable.value.every((e) => selected.value.has(key(e))),
)
function toggleAllShown() {
  const next = new Set(selected.value)
  for (const e of selectable.value) {
    if (allShownSelected.value) next.delete(key(e))
    else next.add(key(e))
  }
  selected.value = next
}
function saveSelected() {
  saveToPhone(selectedEntries.value)
}

// null (just the directory) | 'menu' (the two ways) | 'pick' (checkboxes) | 'sync' (CardDAV)
const mode = ref(null)
function close() {
  mode.value = null
  selected.value = new Set()
}
const WAYS = [
  {
    mode: 'pick',
    title: 'Uložit jednotlivě',
    text: 'Vybereš, koho chceš, a uložíš si je jako své vlastní kontakty.',
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
  <main class="pb-24">
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
        Zaškrtni, koho chceš mít v telefonu, a dej „uložit vybrané“. Uloží se jako tvoje vlastní
        kontakty („[uloženo] ⚜️ …“) — můžeš je upravit a zůstanou ti, jen se nebudou aktualizovat.
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
        <button
          v-if="mode === 'pick' && selectable.length"
          type="button"
          class="btn-link"
          data-testid="select-all"
          @click="toggleAllShown"
        >
          {{ allShownSelected ? 'zrušit výběr zobrazených' : 'vybrat všechny zobrazené' }}
        </button>
        <span class="text-muted-2">{{ shown.length }} z {{ entries.length }}</span>
      </div>
      <p v-if="!shown.length" class="m-0 text-[16px] text-muted">Nikdo takový tu není.</p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <DirectoryRow
          v-for="entry in shown"
          :key="key(entry)"
          :entry="entry"
          :can-import="auth.role === 'admin'"
          :selecting="mode === 'pick'"
          :selected="selected.has(key(entry))"
          @update:selected="setSelected(entry, $event)"
        />
      </ul>
    </div>

    <div
      v-if="mode === 'pick'"
      class="fixed inset-x-0 bottom-0 z-20 border-t border-line-soft bg-cream/95 backdrop-blur-sm"
    >
      <div :class="section" class="flex flex-wrap items-center gap-x-5 gap-y-1 py-3">
        <button
          type="button"
          class="btn-primary px-5 py-2.5 text-[16px]"
          :disabled="!selectedEntries.length"
          data-testid="save-selected"
          @click="saveSelected"
        >
          uložit vybrané ({{ selectedEntries.length }})
        </button>
        <button type="button" class="btn-link" @click="close">hotovo</button>
      </div>
    </div>
  </main>
  <AreaFooter />
</template>
