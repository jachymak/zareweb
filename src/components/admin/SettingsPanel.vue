<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { campRequirements } from '@shared/attendance'
import { TROOPS } from '@/constants/troops'
import { useSaveState } from '@/composables/useSaveState'
import { getAppSettings, updateAppSettings } from '@/services/settings'
import { campRequirementText } from '@/components/parent/parentText'
import CollapsibleSection from './CollapsibleSection.vue'
import SaveBar from './SaveBar.vue'

// „Nastavení“ — SPEC §4.8 Settings: the camp requirement of each troop
// (settings/app.campRequirements). Each part can be switched off (null).
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
const opened = reactive({ vlc: false, ss: false }) // collapsed sections
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
    const requirements = campRequirements(await getAppSettings())
    fill(requirements)
    saved.value = requirements
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
const dirty = computed(() => JSON.stringify(current.value) !== JSON.stringify(saved.value))

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
  errors.value = e
  for (const { code } of TROOPS) {
    if (Object.keys(e).some((k) => k.startsWith(`${code}.`))) opened[code] = true
  }
  return !Object.keys(e).length
}

const saveState = useSaveState()

async function submit() {
  if (!validate()) return
  const requirements = current.value
  if (await saveState.save(() => updateAppSettings({ campRequirements: requirements }))) {
    saved.value = requirements
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
