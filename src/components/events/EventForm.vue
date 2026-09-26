<script setup>
import { computed, ref } from 'vue'
import { createEvent, updateEvent } from '@/services/events'
import FormField from '@/components/form/FormField.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { SAVE_ERROR } from '@/components/parent/parentText'
import DateRangePicker from './DateRangePicker.vue'
import OrganizerPicker from './OrganizerPicker.vue'
import { AUDIENCE_OPTIONS } from './eventsText'

// New event, or the basic details of an existing one: title, audience,
// organizers, without poster (the camp) and the dates.
const props = defineProps({
  event: { type: Object, default: null }, // null = new event
  leaders: { type: Array, required: true },
  today: { type: String, required: true },
  defaultOrganizerId: { type: String, default: null }, // the signed-in leader
})
const emit = defineEmits(['saved', 'cancel']) // saved(eventId)

const e = props.event
const title = ref(e?.title ?? '')
const audience = ref(e?.audience ?? 'all')
const withoutPoster = ref(e ? e.posterStatus === 'none' : false)
const organizerIds = ref(
  e?.organizerIds
    ? [...e.organizerIds]
    : props.defaultOrganizerId
      ? [props.defaultOrganizerId]
      : [],
)
const startDate = ref(e?.startDate ?? null)
const endDate = ref(e?.endDate ?? null)

const submitted = ref(false)
const saving = ref(false)
const saveError = ref(false)

const errors = computed(() => ({
  title: title.value.trim() ? '' : 'Napiš název akce.',
  organizers:
    withoutPoster.value || organizerIds.value.length ? '' : 'Vyber aspoň jednoho organizátora.',
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
    organizerIds: organizerIds.value,
    startDate: startDate.value,
    endDate: endDate.value ?? startDate.value,
  }
  try {
    if (e) {
      // Switching the camp flag keeps an existing poster (draft / published).
      const posterStatus = withoutPoster.value
        ? 'none'
        : e.posterStatus === 'none'
          ? 'missing'
          : e.posterStatus
      await updateEvent(e.id, { ...fields, posterStatus })
      emit('saved', e.id)
    } else {
      emit('saved', await createEvent({ ...fields, withPoster: !withoutPoster.value }))
    }
  } catch (err) {
    console.error('Saving the event failed', err)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <HandDrawnBox shape="tall" class="px-4 pt-5 pb-6 sm:px-[26px]">
    <form novalidate :aria-label="e ? 'Upravit akci' : 'Nová akce'" @submit.prevent="save">
      <p class="kicker m-0 -mb-[3px]">{{ e ? 'úprava akce' : 'nová akce' }}</p>
      <h2 class="m-0 mb-[18px] text-[25px] font-medium tracking-[-0.03em] text-ink">
        {{ e ? e.title : 'Přidat akci do výpravníku' }}
      </h2>

      <div class="flex flex-wrap gap-x-[26px] gap-y-5">
        <div class="flex min-w-0 flex-[1_1_210px] flex-col gap-3.5">
          <FormField v-slot="{ id, describedBy }" label="Název akce" :error="shown('title')">
            <input
              :id="id"
              v-model="title"
              type="text"
              maxlength="120"
              placeholder="Výprava do Krkonoš"
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
          <FormField
            v-slot="{ describedBy }"
            label="Organizátoři"
            tag="fieldset"
            :error="shown('organizers')"
          >
            <OrganizerPicker
              v-model="organizerIds"
              :leaders="leaders"
              :invalid="!!shown('organizers')"
              :described-by="describedBy"
            />
          </FormField>
          <label class="flex cursor-pointer items-center gap-3 text-[15px] text-text">
            <input v-model="withoutPoster" type="checkbox" class="size-6 accent-green" />
            akce bez plakátku (např. tábor)
          </label>
          <p v-if="withoutPoster" class="m-0 -mt-2 text-[13.5px] text-[#8a7b5e]">
            Jen ve výpravníku — bez přihlašování, docházky a plateb na webu.
          </p>
        </div>

        <FormField label="Termín" tag="fieldset" :error="shown('dates')" class="flex-[1_1_240px]">
          <DateRangePicker
            v-model:start="startDate"
            v-model:end="endDate"
            :today="today"
            :invalid="!!shown('dates')"
          />
        </FormField>
      </div>

      <div
        class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-dashed border-line-soft pt-4"
      >
        <button
          type="submit"
          :disabled="saving"
          class="cursor-pointer rounded-full border-0 bg-green px-[26px] py-2.5 font-hand text-[24px] font-bold text-cream hover:bg-green-hover disabled:cursor-wait disabled:opacity-70"
        >
          {{ e ? 'uložit změny' : 'přidat akci' }}
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
