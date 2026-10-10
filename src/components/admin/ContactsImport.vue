<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { applyContactsImport, loadDirectoryData } from '@/services/directory'
import { getSkautisSettings } from '@/services/settings'
import { formatDate } from '@/components/waitlist/waitlistText'
import { displayPhone } from '@shared/contacts'
import { parseExport, planContactsImport } from '@shared/skautisExport'
import { troopTag } from './accounts'
import { readXlsx } from './readXlsx'
import { formatDateTime } from './skautisText'

// „Kontakty z exportu“ — SPEC §4.8 skautIS: parents' and children's own
// contacts and leaders' birthdays from a skautIS person export, read in the
// browser, previewed and then written.
const auth = useAuthStore()

const lastImport = ref(null)
const state = ref('idle') // idle | reading | preview | applying | done | error
const plan = ref(null)
const error = ref('')
const fileInput = ref(null)

async function loadLastImport() {
  try {
    lastImport.value = (await getSkautisSettings())?.lastContactsImportAt ?? null
  } catch (e) {
    console.error('Loading settings/skautis failed', e)
  }
}
onMounted(loadLastImport)

function fail(message) {
  error.value = message
  state.value = 'error'
}

async function read(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  state.value = 'reading'
  let rows
  try {
    rows = await readXlsx(file)
  } catch (e) {
    console.error('Reading the export failed', e)
    return fail('Tohle nevypadá jako export ze skautISu (soubor XLSX).')
  }
  const { people, missingColumns } = parseExport(rows)
  if (missingColumns.length) return fail(`V exportu chybí sloupce: ${missingColumns.join(', ')}.`)
  try {
    plan.value = planContactsImport({ people, ...(await loadDirectoryData()) })
    state.value = 'preview'
  } catch (e) {
    console.error('Contacts import preview failed', e)
    fail('Data z webu se nepodařilo načíst. Zkus to znovu.')
  }
}

async function apply() {
  state.value = 'applying'
  try {
    await applyContactsImport(plan.value, auth.user.uid)
    state.value = 'done'
    await loadLastImport()
  } catch (e) {
    console.error('Contacts import failed', e)
    fail('Uložení se nepovedlo. Zkus to znovu.')
  }
}

function cancel() {
  plan.value = null
  state.value = 'idle'
}

const nothingToSave = computed(
  () => !plan.value?.children.changed.length && !plan.value?.birthdays.changed.length,
)
const doneText = computed(() => {
  if (!plan.value) return ''
  const { children, birthdays } = plan.value
  return `Hotovo. Kontakty změněny u ${children.changed.length} dětí, narozeniny u ${birthdays.changed.length} vedoucích.`
})

// „otec Jan Novák 732 429 710, jan@…; dítě 777 …“
function contactsText(c) {
  if (!c) return 'žádné'
  const parts = [
    ...c.parents.map((p) =>
      [
        p.label,
        p.name,
        p.phone && displayPhone(p.phone),
        p.email,
        ...(p.noteEmails ?? []).map((e) => `${e} (z poznámky, bez hromadných e-mailů)`),
      ]
        .filter(Boolean)
        .join(' '),
    ),
    c.own.phones.length || c.own.emails.length
      ? [
          'dítě',
          ...c.own.phones.map(displayPhone),
          ...c.own.emails.map((e) =>
            (c.own.mailedEmails ?? []).includes(e) ? `${e} (chodí sem e-maily)` : e,
          ),
        ].join(' ')
      : null,
  ].filter(Boolean)
  return parts.join('; ') || 'žádné'
}
const childName = (m) => `${m.firstName} ${m.lastName}`
const personName = (p) => `${p.firstName} ${p.lastName}`.trim()
const box = 'rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3.5 sm:px-[18px]'
const row = 'rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-cream px-3.5 py-2 text-[14.5px]'
</script>

<template>
  <section aria-labelledby="contacts-import-title" class="flex flex-col gap-3.5">
    <h3 id="contacts-import-title" class="m-0 mt-4 text-[20px] font-medium text-ink">
      Kontakty z exportu
    </h3>
    <p class="m-0 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Kontakty na rodiče a vlastní čísla dětí synchronizace ze skautISu nenačte (skautIS je aplikaci
      nepovolil). Proto se nahrávají z exportu osob, který si ve skautISu stáhneš. Z exportu se
      vezmou i narozeniny vedoucích. Všechno se pak ukáže vedoucím v Kontaktech.
    </p>
    <details class="note-warm max-w-[70ch]">
      <summary class="cursor-pointer font-semibold">Jak export ve skautISu nastavit</summary>
      <ul class="m-0 mt-1 list-disc pl-5">
        <li>jednotky 116.22.220 a 116.22.222, bez podřízených jednotek,</li>
        <li>kategorie Vlče, Světluška, Skaut, Skautka, Rover, Ranger,</li>
        <li>
          sloupce Jméno, Příjmení, Přezdívka, Datum narození, Kategorie; z kontaktů E-mail (hlavní),
          E-mail (další), Mobil / telefon (hlavní), Mobil (další), Telefon (další); u rodičů (otec,
          matka, ostatní) jméno, příjmení, e-mail, telefon, poznámka a u ostatních i typ,
        </li>
        <li>
          e-mail rodiče, který nechce hromadné maily, patří jen do poznámky — web ho ukáže vedoucím,
          ale e-maily o akcích na něj neposílá (stejně jako konference).
        </li>
        <li>
          „Ostatní“ s typem „dítě“ web vezme jako kontakt dítěte, na který chodí e-maily (jako do
          konference) — rodičem ho nedělá.
        </li>
        <li>soubor nahraj tak, jak ho skautIS dá (XLSX), nic v něm neupravuj.</li>
      </ul>
    </details>

    <p class="m-0 text-[15.5px] text-text" data-testid="last-contacts-import">
      Naposledy nahráno: {{ lastImport ? formatDateTime(lastImport) : 'zatím nikdy' }}
    </p>

    <p v-if="state === 'reading'" class="m-0 font-hand text-2xl text-muted" role="status">
      čtu export…
    </p>
    <div
      v-if="state === 'done'"
      role="status"
      class="rounded-[14px] border-[1.5px] border-green bg-green-light px-4 py-3 text-[15.5px] text-ink"
    >
      {{ doneText }}
    </div>
    <p v-if="state === 'error'" role="alert" class="m-0 text-red">{{ error }}</p>

    <template v-if="(state === 'preview' || state === 'applying') && plan">
      <h4 class="m-0 mt-1 text-[18px] font-medium text-ink">Co se změní</h4>

      <section :class="box" data-testid="import-children">
        <h5 class="m-0 text-[17px] font-semibold text-ink">
          Kontakty dětí
          <span class="text-[14.5px] font-normal text-muted-2">
            · beze změny {{ plan.children.unchanged }}
          </span>
        </h5>
        <p v-if="!plan.children.changed.length" class="m-0 mt-2 text-[15px] text-muted">
          Nic se nemění.
        </p>
        <ul v-else class="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
          <li v-for="c in plan.children.changed" :key="c.id" :class="row" data-testid="import-row">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <b v-if="c.member.nickname" class="font-hand text-[20px] leading-none text-ink">
                {{ c.member.nickname }}
              </b>
              <span class="text-[#8a7b5e]">
                {{ childName(c.member) }} · {{ troopTag(c.member.troop) }}
              </span>
            </span>
            <span class="block break-words text-text">{{ contactsText(c.after) }}</span>
            <span v-if="c.before" class="block break-words text-muted-2">
              dřív: {{ contactsText(c.before) }}
            </span>
          </li>
        </ul>
      </section>

      <section :class="box" data-testid="import-birthdays">
        <h5 class="m-0 text-[17px] font-semibold text-ink">
          Narozeniny vedoucích
          <span class="text-[14.5px] font-normal text-muted-2">
            · beze změny {{ plan.birthdays.unchanged }}
          </span>
        </h5>
        <p v-if="!plan.birthdays.changed.length" class="m-0 mt-2 text-[15px] text-muted">
          Nic se nemění.
        </p>
        <p v-else class="m-0 mt-2 text-[15px] leading-relaxed text-text">
          <template v-for="(b, i) in plan.birthdays.changed" :key="b.id">
            {{ i ? ' · ' : '' }}{{ b.person.nickname || b.person.name }}
            {{ b.after ? formatDate(b.after) : '–' }}
          </template>
        </p>
      </section>

      <section
        v-if="plan.differences.length"
        :class="box"
        class="border-gold!"
        data-testid="import-differences"
      >
        <h5 class="m-0 text-[17px] font-semibold text-ink">Liší se od synchronizace</h5>
        <p class="m-0 mt-1 text-[14.5px] text-muted-2">
          Obojí je ze skautISu, takže jedno z toho je staré — synchronizuj znovu, případně stáhni
          nový export.
        </p>
        <ul class="m-0 mt-2 list-disc pl-5 text-[14.5px] text-text">
          <li v-for="(d, i) in plan.differences" :key="i">
            {{ d.name }} — {{ d.field }}: na webu {{ d.web }}, v exportu {{ d.export }}
          </li>
        </ul>
      </section>

      <section v-if="plan.notOnWeb.length" :class="box" data-testid="import-not-on-web">
        <h5 class="m-0 text-[17px] font-semibold text-ink">
          V exportu, ale ne na webu ({{ plan.notOnWeb.length }})
        </h5>
        <p class="m-0 mt-1 text-[14.5px] text-muted-2">
          Nejdřív synchronizuj ze skautISu. Jejich kontakty se teď neuloží.
        </p>
        <p class="m-0 mt-2 text-[14.5px] text-text">
          {{ plan.notOnWeb.map((p) => `${personName(p)} (${p.category || '?'})`).join(' · ') }}
        </p>
      </section>

      <section
        v-if="plan.notInExport.children.length || plan.notInExport.leaders.length"
        :class="box"
        data-testid="import-not-in-export"
      >
        <h5 class="m-0 text-[17px] font-semibold text-ink">Na webu, ale ne v exportu</h5>
        <p class="m-0 mt-1 text-[14.5px] text-muted-2">
          Jejich uložené kontakty zůstanou, jak jsou.
        </p>
        <p class="m-0 mt-2 text-[14.5px] text-text">
          {{
            [
              ...plan.notInExport.children.map((m) => childName(m)),
              ...plan.notInExport.leaders.map((p) => p.name),
            ].join(' · ')
          }}
        </p>
      </section>

      <p v-if="nothingToSave" role="alert" class="m-0 text-red" data-testid="import-nothing">
        Není co uložit — nikdo z exportu se na webu nenašel, nebo se nic nezměnilo.
        <template v-if="plan.notOnWeb.length">
          Nejdřív synchronizuj děti a vedoucí ze skautISu (nahoře) a pak export nahraj znovu.
        </template>
      </p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          v-if="!nothingToSave"
          type="button"
          class="btn-primary px-6 py-3 text-[16px]"
          :disabled="state === 'applying'"
          @click="apply"
        >
          {{ state === 'applying' ? 'ukládám…' : 'použít' }}
        </button>
        <button type="button" class="btn-link" :disabled="state === 'applying'" @click="cancel">
          {{ nothingToSave ? 'zavřít' : 'zrušit' }}
        </button>
      </div>
    </template>

    <div v-else-if="state !== 'reading'">
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="sr-only"
        data-testid="contacts-export-input"
        @change="read"
      />
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-cream px-4 py-[9px] text-[15px] text-ink hover:bg-gold-light"
        @click="fileInput.click()"
      >
        nahrát export (XLSX)
      </button>
    </div>
  </section>
</template>
