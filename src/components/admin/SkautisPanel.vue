<script setup>
import { onMounted, ref } from 'vue'
import { TROOPS } from '@/constants/troops'
import { getSkautisSettings } from '@/services/settings'
import { applySkautisSync, previewSkautisSync, skautisLogin } from '@/services/skautis'
import SkautisChanges from './SkautisChanges.vue'
import { appliedText, formatDateTime, skippedText, syncErrorText } from './skautisText'

// „skautIS“ — SPEC §4.8 skautIS: the sync of children and leaders. The admin
// logs in to skautIS and comes back with a login token (`token`, taken from
// the URL by AdminView); the panel loads what would change and applies it
// after confirmation.
const props = defineProps({
  token: { type: String, default: null },
})
const emit = defineEmits(['open-tab', 'token-used'])

const loginUrl = skautisLogin()
const lastSync = ref(null)
const state = ref('idle') // idle | loading | preview | applying | done | error
const preview = ref(null)
const result = ref(null)
const error = ref('')

async function loadLastSync() {
  try {
    lastSync.value = (await getSkautisSettings())?.lastSyncAt ?? null
  } catch (e) {
    console.error('Loading settings/skautis failed', e)
  }
}

async function loadPreview(token) {
  state.value = 'loading'
  try {
    preview.value = await previewSkautisSync(token)
    state.value = 'preview'
  } catch (e) {
    console.error('skautIS preview failed', e)
    error.value = syncErrorText(e)
    state.value = 'error'
  }
}

async function apply() {
  state.value = 'applying'
  try {
    result.value = await applySkautisSync()
    preview.value = null
    state.value = 'done'
    await loadLastSync()
  } catch (e) {
    console.error('skautIS apply failed', e)
    error.value = syncErrorText(e)
    state.value = 'error'
  }
}

function cancel() {
  preview.value = null
  state.value = 'idle'
}

onMounted(() => {
  loadLastSync()
  if (props.token) {
    emit('token-used')
    loadPreview(props.token)
  }
})

const unitText = (units) =>
  TROOPS.filter((t) => units[t.code])
    .map((t) => `${t.name.toLowerCase()}: ${units[t.code].name} (${units[t.code].regNumber})`)
    .join(' · ')
</script>

<template>
  <section aria-labelledby="skautis-title" class="flex flex-col gap-3.5">
    <h2 id="skautis-title" class="sr-only">skautIS</h2>
    <p class="m-0 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Děti a vedoucí se na web načítají ze skautISu. Synchronizaci spusť jednou za rok a pokaždé,
      když se ve skautISu něco změní. Nejdřív uvidíš, co se změní, a teprve pak to potvrdíš.
    </p>

    <div class="note-warm max-w-[70ch]" data-testid="skautis-rules">
      <b class="font-semibold">Koho web ze skautISu bere:</b>
      <ul class="m-0 mt-1 list-disc pl-5">
        <li>
          <b class="font-semibold">děti</b> — členové obou oddílů v kategorii vlče, světluška, skaut
          nebo skautka; oddíl dítěte je jeho oddíl ve skautISu,
        </li>
        <li>
          <b class="font-semibold">vedoucí</b> — kategorie rover a ranger, bez ohledu na věk (dětský
          účet nemají),
        </li>
        <li>
          ostatní kategorie (dospělý, benjamínek, ostatní) web nebere, jako by v oddíle nebyli.
        </li>
      </ul>
      Den schůzek dětí, domovský oddíl vedoucího a jeho roli nastavuješ tady v Administraci (děti,
      kontakty); synchronizace je nepřepisuje.
    </div>

    <p class="m-0 text-[15.5px] text-text" data-testid="last-sync">
      Naposledy synchronizováno: {{ lastSync ? formatDateTime(lastSync) : 'zatím nikdy' }}
    </p>

    <p v-if="state === 'loading'" class="m-0 font-hand text-2xl text-muted" role="status">
      načítám data ze skautISu…
    </p>

    <div
      v-if="state === 'done'"
      role="status"
      class="rounded-[14px] border-[1.5px] border-green bg-green-light px-4 py-3 text-[15.5px] text-ink"
    >
      {{ appliedText(result) }}
    </div>
    <p v-if="state === 'error'" role="alert" class="m-0 text-red">{{ error }}</p>

    <template v-if="(state === 'preview' || state === 'applying') && preview">
      <h3 class="m-0 mt-1 text-[20px] font-medium text-ink">Co se změní</h3>
      <p class="m-0 text-[14.5px] text-muted-2" data-testid="skautis-units">
        {{ unitText(preview.units) }}
      </p>
      <SkautisChanges
        title="Děti"
        :changes="preview.members"
        removed-note="zmizí z docházky a rodičům, jejich historie zůstane"
        data-testid="skautis-members"
      />
      <SkautisChanges
        title="Vedoucí"
        :changes="preview.people"
        removed-note="nebudou mezi organizátory ani v kontaktech pro rodiče"
        data-testid="skautis-people"
      />
      <p v-if="skippedText(preview.skipped)" class="m-0 text-[14.5px] text-muted-2">
        Nenačteno podle kategorie: {{ skippedText(preview.skipped) }}
      </p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          class="btn-primary px-6 py-3 text-[16px]"
          :disabled="state === 'applying'"
          @click="apply"
        >
          {{ state === 'applying' ? 'ukládám…' : 'použít změny' }}
        </button>
        <button type="button" class="btn-link" :disabled="state === 'applying'" @click="cancel">
          zrušit
        </button>
      </div>
    </template>

    <div v-else-if="state !== 'loading'">
      <a
        :href="loginUrl"
        class="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-cream px-4 py-[9px] text-[15px] text-ink no-underline hover:bg-gold-light hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          class="block size-[17px]"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 12 A8 8 0 1 1 17.5 6.2 M20 4 L20 8.5 L15.5 8.5" />
        </svg>
        Synchronizovat ze skautISu
      </a>
      <p class="m-0 mt-2 max-w-[70ch] text-[14.5px] text-muted-2">
        Přihlásíš se do skautISu svým účtem. Potřebuješ roli, která vidí na oba oddíly — např.
        vedoucí/admin každého z nich nebo střediska.
      </p>
    </div>
  </section>
</template>
