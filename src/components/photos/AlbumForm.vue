<script setup>
import { computed, ref } from 'vue'
import { createAlbum, updateAlbum } from '@/services/photos'
import FormField from '@/components/form/FormField.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import DateRangePicker from '@/components/events/DateRangePicker.vue'
import { AUDIENCE_OPTIONS } from '@/components/events/eventsText'
import { formatRange, SAVE_ERROR } from '@/components/parent/parentText'

// New album, or the details of an existing one. Picking the event fills in
// the title, dates and troop (still editable); parents then find the album
// at the event in the Výpravník.
const props = defineProps({
  album: { type: Object, default: null }, // null = new album
  events: { type: Array, required: true }, // events to pick from, newest first
  today: { type: String, required: true },
})
const emit = defineEmits(['saved', 'cancel']) // saved(albumId)

const a = props.album
const eventId = ref(a?.eventId ?? '')
const title = ref(a?.title ?? '')
const audience = ref(a?.audience ?? 'all')
const startDate = ref(a?.startDate ?? null)
const endDate = ref(a?.endDate ?? null)
const groupByDay = ref(a?.groupByDay !== false)
const multiDay = computed(
  () => !!startDate.value && !!endDate.value && endDate.value !== startDate.value,
)
const pickerKey = ref(0) // re-opens the calendar on the picked event's month

function pickEvent() {
  const event = props.events.find((e) => e.id === eventId.value)
  if (!event) return
  title.value = event.title
  audience.value = event.audience
  startDate.value = event.startDate
  endDate.value = event.endDate
  pickerKey.value++
}

const submitted = ref(false)
const saving = ref(false)
const saveError = ref(false)
const errors = computed(() => ({
  title: title.value.trim() ? '' : 'Napiš název alba.',
  dates: startDate.value ? '' : 'Vyber termín v kalendáři.',
}))
const shown = (field) => (submitted.value ? errors.value[field] : '')

async function save() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  saving.value = true
  saveError.value = false
  const fields = {
    title: title.value.trim(),
    audience: audience.value,
    eventId: eventId.value || null,
    startDate: startDate.value,
    endDate: endDate.value ?? startDate.value,
    groupByDay: groupByDay.value,
  }
  try {
    if (a) {
      await updateAlbum(a.id, fields)
      emit('saved', a.id)
    } else {
      emit('saved', await createAlbum(fields))
    }
  } catch (err) {
    console.error('Saving the album failed', err)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <HandDrawnBox shape="tall" class="px-4 pt-5 pb-6 sm:px-[26px]">
    <form novalidate :aria-label="a ? 'Upravit album' : 'Nové album'" @submit.prevent="save">
      <p class="kicker m-0 -mb-[3px]">{{ a ? 'úprava alba' : 'nové album' }}</p>
      <h2 class="m-0 mb-[18px] text-[25px] font-medium tracking-[-0.03em] text-ink">
        {{ a ? a.title : 'Založit album' }}
      </h2>

      <div class="flex flex-wrap gap-x-[26px] gap-y-5">
        <div class="flex min-w-0 flex-[1_1_240px] flex-col gap-3.5">
          <FormField v-slot="{ id }" label="Z které akce">
            <select :id="id" v-model="eventId" class="field-input" @change="pickEvent">
              <option value="">— bez akce (např. schůzky) —</option>
              <option v-for="e in events" :key="e.id" :value="e.id">
                {{ formatRange(e.startDate, e.endDate) }} {{ e.startDate.slice(0, 4) }} ·
                {{ e.title }}
              </option>
            </select>
          </FormField>
          <FormField v-slot="{ id, describedBy }" label="Název alba" :error="shown('title')">
            <input
              :id="id"
              v-model="title"
              type="text"
              maxlength="120"
              placeholder="Výprava na Blaník"
              class="field-input"
              :aria-invalid="!!shown('title')"
              :aria-describedby="describedBy"
            />
          </FormField>
          <FormField v-slot="{ id }" label="Pro koho">
            <select :id="id" v-model="audience" class="field-input">
              <option v-for="o in AUDIENCE_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </FormField>
          <p class="m-0 text-[13.5px] text-[#8a7b5e]">
            Rodiče vidí hlavně alba oddílu svých dětí; ostatní si můžou zobrazit.
            <template v-if="!a">Album bude skryté, dokud ho nezveřejníš.</template>
          </p>
        </div>

        <div class="flex min-w-0 flex-[1_1_240px] flex-col gap-3.5">
          <FormField label="Termín" tag="fieldset" :error="shown('dates')">
            <DateRangePicker
              :key="pickerKey"
              v-model:start="startDate"
              v-model:end="endDate"
              :today="today"
              :invalid="!!shown('dates')"
            />
          </FormField>
          <div v-if="multiDay">
            <label class="flex cursor-pointer items-center gap-3 text-[15px] text-text">
              <input v-model="groupByDay" type="checkbox" class="size-6 accent-green" />
              fotky rozdělit po dnech
            </label>
            <p class="m-0 mt-1 text-[13.5px] text-[#8a7b5e]">
              Každý den akce má vlastní nadpis („sobota 14. března“). Bez rozdělení jsou fotky v
              jedné řadě, pořadí je stejné.
            </p>
          </div>
        </div>
      </div>

      <div
        class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-dashed border-line-soft pt-4"
      >
        <button
          type="submit"
          :disabled="saving"
          class="cursor-pointer rounded-full border-0 bg-green px-[26px] py-2.5 font-hand text-[24px] font-bold text-cream hover:bg-green-hover disabled:cursor-wait disabled:opacity-70"
        >
          {{ a ? 'uložit změny' : 'založit album' }}
        </button>
        <button type="button" class="btn-link" @click="emit('cancel')">zrušit</button>
      </div>
      <p v-if="submitted && Object.values(errors).some(Boolean)" class="m-0 mt-2 text-sm text-red">
        Něco chybí — zkontroluj označená pole.
      </p>
      <p v-if="saveError" role="alert" class="m-0 mt-2 text-sm text-red">{{ SAVE_ERROR }}</p>
    </form>
  </HandDrawnBox>
</template>
