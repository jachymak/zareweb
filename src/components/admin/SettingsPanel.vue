<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { campRequirements } from '@shared/attendance'
import { EMAIL_RE } from '@shared/waitlistRules'
import { TROOPS } from '@/constants/troops'
import { useSaveState } from '@/composables/useSaveState'
import { getAppSettings, updateAppSettings } from '@/services/settings'
import { campRequirementText } from '@/components/parent/parentText'
import CollapsibleSection from './CollapsibleSection.vue'
import SaveBar from './SaveBar.vue'

// „Nastavení“ — SPEC §4.8 Settings: the web admin shown to parents
// (settings/app.webAdmin) and the camp requirement of each troop
// (settings/app.campRequirements; each part can be switched off, null).
defineEmits(['open-tab'])

const PARTS = {
  trips: { label: 'Výprav aspoň', min: 0, max: 30, fallback: 4 },
  meetingPct: { label: 'Schůzek aspoň (%)', min: 0, max: 100, fallback: 60 },
}

const loading = ref(true)
const loadError = ref('')
// Per troop and part: { on, value } — the value is kept while switched off.
const form = reactive({})
const saved = ref(null)
const errors = ref({})
const opened = reactive({ webAdmin: false, vlc: false, ss: false }) // collapsed sections
// Whom parents write about their contacts (SPEC §3.1): { name, email } or null.
const webAdmin = reactive({ name: '', email: '' })
const savedWebAdmin = ref(null)
const currentWebAdmin = computed(() => {
  const name = webAdmin.name.trim()
  const email = webAdmin.email.trim()
  return name || email ? { name, email } : null
})
const webAdminText = computed(() =>
  currentWebAdmin.value
    ? [currentWebAdmin.value.name, currentWebAdmin.value.email].filter(Boolean).join(', ')
    : 'nikdo — rodičům se napíše, ať se ozvou vedoucím',
)
const campText = (code) => campRequirementText(current.value[code]) || 'bez podmínky na tábor'

function fill(requirements) {
  for (const { code } of TROOPS) {
    form[code] = Object.fromEntries(
      Object.entries(PARTS).map(([part, p]) => {
        const v = requirements[code][part]
        return [part, { on: v !== null, value: v ?? p.fallback }]
      }),
    )
  }
}

onMounted(async () => {
  try {
    const appSettings = await getAppSettings()
    const requirements = campRequirements(appSettings)
    fill(requirements)
    saved.value = requirements
    webAdmin.name = appSettings?.webAdmin?.name ?? ''
    webAdmin.email = appSettings?.webAdmin?.email ?? ''
    savedWebAdmin.value = currentWebAdmin.value
  } catch (e) {
    console.error('Loading settings failed', e)
    loadError.value = 'Nastavení se nepodařilo načíst. Zkus stránku obnovit.'
  } finally {
    loading.value = false
  }
})

// The form as stored: null for a part that isn't required.
const current = computed(() =>
  Object.fromEntries(
    TROOPS.map(({ code }) => [
      code,
      Object.fromEntries(
        Object.keys(PARTS).map((part) => {
          const f = form[code]?.[part]
          return [part, f?.on ? f.value : null]
        }),
      ),
    ]),
  ),
)
const dirty = computed(
  () =>
    JSON.stringify(current.value) !== JSON.stringify(saved.value) ||
    JSON.stringify(currentWebAdmin.value) !== JSON.stringify(savedWebAdmin.value),
)

function validate() {
  const e = {}
  for (const { code } of TROOPS) {
    for (const [part, { min, max }] of Object.entries(PARTS)) {
      const { on, value } = form[code][part]
      if (on && (!Number.isInteger(value) || value < min || value > max)) {
        e[`${code}.${part}`] = `Zadej celé číslo ${min}–${max}.`
      }
    }
  }
  const admin = currentWebAdmin.value
  if (admin && !EMAIL_RE.test(admin.email))
    e.webAdminEmail = 'Zadej e-mail, na který rodiče napíšou.'
  if (admin && !admin.name) e.webAdminName = 'Zadej jméno.'
  errors.value = e
  if (e.webAdminEmail || e.webAdminName) opened.webAdmin = true
  for (const { code } of TROOPS) {
    if (Object.keys(e).some((k) => k.startsWith(`${code}.`))) opened[code] = true
  }
  return !Object.keys(e).length
}

const saveState = useSaveState()

async function submit() {
  if (!validate()) return
  const requirements = current.value
  const admin = currentWebAdmin.value
  if (
    await saveState.save(() =>
      updateAppSettings({ campRequirements: requirements, webAdmin: admin }),
    )
  ) {
    saved.value = requirements
    savedWebAdmin.value = admin
  }
}
</script>

<template>
  <section aria-labelledby="settings-title">
    <h2 id="settings-title" class="sr-only">Nastavení</h2>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="loading" class="font-hand text-2xl text-muted">načítám…</p>

    <form v-else novalidate class="flex flex-col gap-3.5" @submit.prevent="submit">
      <div>
        <h3 class="m-0 mb-1 text-[19px] font-semibold text-ink">Správce webu</h3>
        <p class="m-0 max-w-[70ch] text-[15px] leading-normal text-muted">
          Rodiče u svých dětí vidí, jaké kontakty na ně máme a kam chodí e-maily. Když chtějí něco
          změnit, mají napsat tomuhle člověku — změny se dělají ve skautISu.
        </p>
      </div>
      <CollapsibleSection
        v-model:open="opened.webAdmin"
        title="Komu rodiče píšou"
        :summary="webAdminText"
        data-testid="web-admin"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-[7px]">
            <span class="text-[15px] font-medium text-ink">Jméno</span>
            <input
              v-model="webAdmin.name"
              class="field-input py-2.5"
              autocomplete="off"
              :aria-invalid="!!errors.webAdminName"
            />
            <span v-if="errors.webAdminName" class="text-sm text-red">
              {{ errors.webAdminName }}
            </span>
          </label>
          <label class="flex flex-col gap-[7px]">
            <span class="text-[15px] font-medium text-ink">E-mail</span>
            <input
              v-model="webAdmin.email"
              type="email"
              class="field-input py-2.5"
              autocomplete="off"
              :aria-invalid="!!errors.webAdminEmail"
            />
            <span v-if="errors.webAdminEmail" class="text-sm text-red">
              {{ errors.webAdminEmail }}
            </span>
          </label>
        </div>
      </CollapsibleSection>

      <div class="mt-3">
        <h3 class="m-0 mb-1 text-[19px] font-semibold text-ink">Podmínky na tábor</h3>
        <p class="m-0 max-w-[70ch] text-[15px] leading-normal text-muted">
          Kolik toho dítě musí za školní rok stihnout, aby mohlo na tábor. Kdo na to nemá, svítí v
          docházce červeně; rodiče podmínku vidí u svých dětí. Podmínku, kterou oddíl nevyžaduje,
          odškrtni.
        </p>
      </div>
      <div class="flex flex-col gap-2.5">
        <CollapsibleSection
          v-for="troop in TROOPS"
          :key="troop.code"
          v-model:open="opened[troop.code]"
          :title="troop.name"
          :summary="campText(troop.code)"
          :data-testid="`camp-${troop.code}`"
        >
          <div class="flex flex-col gap-3">
            <div v-for="(p, part) in PARTS" :key="part" class="flex flex-col gap-[7px]">
              <label
                class="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-ink"
              >
                <input
                  v-model="form[troop.code][part].on"
                  type="checkbox"
                  class="size-[18px] accent-green"
                />
                {{ p.label }}
              </label>
              <input
                v-if="form[troop.code][part].on"
                v-model.number="form[troop.code][part].value"
                type="number"
                inputmode="numeric"
                :min="p.min"
                :max="p.max"
                step="1"
                class="field-input max-w-[10rem] py-2.5"
                :aria-label="`${p.label} — ${troop.name}`"
                :aria-invalid="!!errors[`${troop.code}.${part}`]"
              />
              <span v-else class="text-[14.5px] text-muted-2 italic">nevyžaduje se</span>
              <span v-if="errors[`${troop.code}.${part}`]" class="text-sm text-red">
                {{ errors[`${troop.code}.${part}`] }}
              </span>
            </div>
          </div>
          <p class="m-0 mt-3 font-hand text-[19px] text-brown" data-testid="camp-text">
            {{ campText(troop.code) }}
          </p>
        </CollapsibleSection>
      </div>

      <SaveBar
        :saving="saveState.saving.value"
        :saved="saveState.saved.value"
        :dirty="dirty"
        :error="saveState.error.value"
      />
    </form>
  </section>
</template>
