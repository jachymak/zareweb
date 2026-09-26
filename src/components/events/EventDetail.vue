<script setup>
import { ref, watch } from 'vue'
import { deleteEvent, setCancelled } from '@/services/events'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatRange, organizerNames, SAVE_ERROR } from '@/components/parent/parentText'
import EventChips from './EventChips.vue'
import EventSignUps from './EventSignUps.vue'
import PosterEditor from './PosterEditor.vue'
import RegistrationSettings from './RegistrationSettings.vue'

// Selected event: actions (edit, cancel / restore, delete), registration,
// the poster editor and who is signed up. The camp has only the actions.
const props = defineProps({
  event: { type: Object, required: true },
  organizers: { type: Array, required: true },
  members: { type: Array, required: true },
  templates: { type: Array, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['edit'])
const dirty = defineModel('dirty', { type: Boolean, default: false })

const confirmDelete = ref(false)
const busy = ref(false)
const actionError = ref(false)
watch(
  () => props.event.id,
  () => {
    confirmDelete.value = false
    actionError.value = false
  },
)

async function run(action) {
  busy.value = true
  actionError.value = false
  try {
    await action()
  } catch (e) {
    console.error('Changing the event failed', e)
    actionError.value = true
  } finally {
    busy.value = false
  }
}

const toggleCancelled = () => run(() => setCancelled(props.event.id, !props.event.cancelled))
// The page closes the event once it disappears from the list.
const remove = () => run(() => deleteEvent(props.event.id))

const action =
  'cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[14.5px] disabled:cursor-wait disabled:opacity-70'
</script>

<template>
  <HandDrawnBox shape="tall" class="px-4 pt-5 pb-6 sm:px-[26px]">
    <article :aria-label="event.title">
      <div class="mb-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
        <p class="m-0 font-hand text-[24px] text-red">
          {{ formatRange(event.startDate, event.endDate) }}
        </p>
        <AudienceTag :audience="event.audience" />
        <EventChips :event="event" :today="today" />
      </div>
      <h2
        class="m-0 text-[25px] font-medium tracking-[-0.03em] text-ink"
        :class="event.cancelled && 'line-through decoration-red'"
      >
        {{ event.title }}
      </h2>
      <p v-if="organizers.length" class="m-0 mt-0.5 text-[15px] text-muted">
        vede {{ organizerNames(organizers) }}
      </p>

      <div class="mt-3 mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <button
          type="button"
          :class="action"
          class="border-ink bg-transparent text-ink"
          @click="emit('edit')"
        >
          upravit údaje akce
        </button>
        <button
          type="button"
          :class="action"
          :disabled="busy"
          class="border-[#d08a6a] bg-transparent text-[#8a2f16]"
          @click="toggleCancelled"
        >
          {{ event.cancelled ? 'obnovit akci' : 'zrušit akci' }}
        </button>
        <button
          v-if="!confirmDelete"
          type="button"
          :class="action"
          class="border-transparent bg-transparent text-muted underline"
          @click="confirmDelete = true"
        >
          smazat akci
        </button>
        <span
          v-else
          role="group"
          aria-label="Potvrzení smazání"
          class="flex flex-wrap items-center gap-2 rounded-lg bg-red-light px-3 py-1.5 text-[14.5px] text-[#8a2f16]"
        >
          Akce zmizí z výpravníku i z docházky (přihlášky a platby zůstanou uložené).
          <button
            type="button"
            :class="action"
            :disabled="busy"
            class="border-red bg-red text-cream"
            @click="remove"
          >
            opravdu smazat
          </button>
          <button type="button" class="btn-link" @click="confirmDelete = false">nechat být</button>
        </span>
      </div>
      <p v-if="event.cancelled" class="note-warm m-0 mb-4">
        Akce je zrušená — rodiče ji ve výpravníku vidí přeškrtnutou.
      </p>
      <p v-if="actionError" role="alert" class="m-0 mb-3 text-sm text-red">{{ SAVE_ERROR }}</p>

      <template v-if="event.posterStatus === 'none'">
        <p class="m-0 text-[15px] text-muted">
          Akce bez plakátku (tábor) je jen ve výpravníku — přihlášky a informace jdou rodičům
          e-mailem.
        </p>
      </template>
      <div v-else class="flex flex-col gap-6">
        <RegistrationSettings :event="event" :today="today" />
        <PosterEditor v-model:dirty="dirty" :event="event" :templates="templates" />
        <EventSignUps v-if="event.registrationOpen" :event="event" :members="members" />
      </div>
    </article>
  </HandDrawnBox>
</template>
