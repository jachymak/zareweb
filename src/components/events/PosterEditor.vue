<script setup>
import { computed, ref, watch } from 'vue'
import { getPoster, savePoster } from '@/services/events'
import FormField from '@/components/form/FormField.vue'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'
import PackingList from './PackingList.vue'

// Poster editor (SPEC §4.3): saved with „uložit“ together with the price and
// whether parents see it. Reports unsaved changes through `dirty`.
const props = defineProps({
  event: { type: Object, required: true },
  templates: { type: Array, required: true },
})
const dirty = defineModel('dirty', { type: Boolean, default: false })

const EMPTY = {
  intro: '',
  destination: '',
  mapUrl: '',
  meetAtPamatnik: '',
  meetAtMainStation: '',
  meetElsewhere: '',
  returnAtMainStation: '',
  returnAtPamatnik: '',
  returnElsewhere: '',
  food: '',
  packingTemplateId: null,
  packingItems: [],
}

const loading = ref(true)
const loadError = ref(false)
const form = ref({ ...EMPTY })
const price = ref('')
const publish = ref(false)
let saved = '' // snapshot of the saved state

const snapshot = () => JSON.stringify([form.value, price.value, publish.value])

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const content = await getPoster(props.event.id)
    form.value = { ...EMPTY, ...content, packingItems: [...(content?.packingItems ?? [])] }
    price.value = props.event.price == null ? '' : String(props.event.price)
    publish.value = props.event.posterStatus === 'published'
    saved = snapshot()
  } catch (e) {
    console.error('Loading the poster failed', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}
watch(() => props.event.id, load, { immediate: true })

watch([form, price, publish], () => (dirty.value = !loading.value && snapshot() !== saved), {
  deep: true,
})

const submitted = ref(false)
const errors = computed(() => ({
  mapUrl:
    !form.value.mapUrl || /^https?:\/\/\S+$/.test(form.value.mapUrl.trim())
      ? ''
      : 'Odkaz musí začínat https://',
  price: /^\d{0,6}$/.test(price.value.trim()) ? '' : 'Napiš částku v Kč, jen číslo.',
}))
const shown = (field) => (submitted.value ? errors.value[field] : '')

const saving = ref(false)
const saveError = ref(false)
const savedNote = ref('')

async function save() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  saving.value = true
  saveError.value = false
  const content = Object.fromEntries(
    Object.entries(form.value).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
  )
  try {
    await savePoster(props.event.id, {
      content,
      price: price.value.trim() === '' ? null : Number(price.value),
      publish: publish.value,
    })
    saved = snapshot()
    dirty.value = false
    submitted.value = false
    savedNote.value = publish.value ? 'uloženo — rodiče plakátek vidí' : 'uloženo jako rozepsané'
  } catch (e) {
    console.error('Saving the poster failed', e)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
watch(dirty, (d) => d && (savedNote.value = ''))

const grid = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-x-4 gap-y-3.5'
const heading = 'm-0 mb-2 text-[16px] font-semibold text-ink'
</script>

<template>
  <section aria-labelledby="poster-title">
    <h3 id="poster-title" class="m-0 mb-3 text-[19px] font-medium tracking-[-0.02em] text-ink">
      Plakátek
    </h3>
    <p v-if="loading" class="m-0 font-hand text-xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" class="m-0 text-red">{{ LOAD_ERROR }}</p>
    <form v-else novalidate aria-label="Plakátek" @submit.prevent="save">
      <FormField v-slot="{ id }" label="Obecné informace o výpravě" class="mb-3.5">
        <textarea
          :id="id"
          v-model="form.intro"
          rows="3"
          maxlength="2000"
          placeholder="Pojeďte s námi na expedici na sever!"
          class="field-input resize-y"
        />
      </FormField>
      <div :class="grid" class="mb-[18px]">
        <FormField v-slot="{ id }" label="Kam se jede?">
          <input
            :id="id"
            v-model="form.destination"
            type="text"
            placeholder="Liberec"
            class="field-input"
          />
        </FormField>
        <FormField v-slot="{ id, describedBy }" label="Odkaz na mapu" :error="shown('mapUrl')">
          <input
            :id="id"
            v-model="form.mapUrl"
            type="url"
            placeholder="https://mapy.cz/…"
            class="field-input"
            :aria-invalid="!!shown('mapUrl')"
            :aria-describedby="describedBy"
          />
        </FormField>
      </div>

      <p :class="heading">Sraz</p>
      <div :class="grid">
        <FormField v-slot="{ id }" label="Čas u Památníku">
          <input :id="id" v-model="form.meetAtPamatnik" type="time" class="field-input" />
        </FormField>
        <FormField v-slot="{ id }" label="Čas na Hlaváku">
          <input :id="id" v-model="form.meetAtMainStation" type="time" class="field-input" />
        </FormField>
      </div>
      <FormField v-slot="{ id }" label="Sraz jinde" class="mt-3.5 mb-5">
        <input
          :id="id"
          v-model="form.meetElsewhere"
          type="text"
          placeholder="16:40 na nádraží Praha-Podbaba"
          class="field-input"
        />
      </FormField>

      <p :class="heading">Návrat</p>
      <div :class="grid">
        <FormField v-slot="{ id }" label="Návrat na Hlavák">
          <input :id="id" v-model="form.returnAtMainStation" type="time" class="field-input" />
        </FormField>
        <FormField v-slot="{ id }" label="Návrat k Památníku">
          <input :id="id" v-model="form.returnAtPamatnik" type="time" class="field-input" />
        </FormField>
      </div>
      <FormField v-slot="{ id }" label="Návrat jinde" class="mt-3.5 mb-5">
        <input
          :id="id"
          v-model="form.returnElsewhere"
          type="text"
          placeholder="16:40 na nádraží Praha-Podbaba"
          class="field-input"
        />
      </FormField>

      <div :class="grid" class="mb-[18px]">
        <FormField v-slot="{ id, describedBy }" label="Peněz (Kč)" :error="shown('price')">
          <input
            :id="id"
            v-model="price"
            type="text"
            inputmode="numeric"
            placeholder="800"
            class="field-input"
            :aria-invalid="!!shown('price')"
            :aria-describedby="describedBy"
          />
        </FormField>
        <FormField v-slot="{ id }" label="Jídlo">
          <input
            :id="id"
            v-model="form.food"
            type="text"
            placeholder="VLZ na pátek"
            class="field-input"
          />
        </FormField>
      </div>

      <PackingList
        v-model:items="form.packingItems"
        v-model:template-id="form.packingTemplateId"
        :templates="templates"
      />

      <div
        class="mt-5 flex flex-wrap items-center gap-x-[18px] gap-y-3 border-t border-dashed border-line-soft pt-4"
      >
        <button
          type="submit"
          :disabled="saving"
          class="cursor-pointer rounded-full border-0 bg-green px-[26px] py-2.5 font-hand text-[24px] font-bold text-cream hover:bg-green-hover disabled:cursor-wait disabled:opacity-70"
        >
          uložit
        </button>
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-text">
          <input v-model="publish" type="checkbox" class="size-6 accent-green" />
          zveřejnit plakátek rodičům
        </label>
        <RouterLink
          :to="{ name: 'event-poster', params: { eventId: event.id } }"
          target="_blank"
          class="inline-block -rotate-[1.4deg] rounded-[2px] border-[1.5px] border-ink bg-gold-light px-4 py-1.5 font-hand text-[21px] font-bold text-ink no-underline hover:text-ink"
        >
          náhled plakátku
        </RouterLink>
        <span v-if="dirty" class="font-hand text-[21px] text-red" data-testid="poster-state">
          neuložené změny
        </span>
        <span
          v-else-if="savedNote"
          class="font-hand text-[21px] text-green"
          data-testid="poster-state"
        >
          {{ savedNote }}
        </span>
      </div>
      <p v-if="submitted && Object.values(errors).some(Boolean)" class="m-0 mt-2 text-sm text-red">
        Něco nesedí — zkontroluj označená pole.
      </p>
      <p v-if="saveError" role="alert" class="m-0 mt-2 text-sm text-red">{{ SAVE_ERROR }}</p>
      <p class="m-0 mt-2.5 text-[14px] text-[#8a7b5e]">
        {{
          publish
            ? 'Po uložení plakátek rodiče hned uvidí.'
            : 'Rozepsaný plakátek rodiče nevidí — zveřejníš ho, až bude hotový.'
        }}
        Náhled ukazuje uloženou verzi.
      </p>
    </form>
  </section>
</template>
