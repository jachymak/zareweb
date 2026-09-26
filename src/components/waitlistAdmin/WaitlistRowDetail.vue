<script setup>
import { nextTick, ref } from 'vue'
import { deleteWaitlistEntry, updateLeaderNote } from '@/services/waitlist'
import NoteIcon from './NoteIcon.vue'
import {
  DELETE_FAILED,
  formatDate,
  gradeLong,
  NOTE_PLACEHOLDER,
  SAVE_FAILED,
} from './waitlistAdminText'

// Expanded row: whom they know, the parent's contact, the leaders' note (add /
// edit) and „Smazat zápis“ with a confirmation. On narrow screens also what
// the table columns show.
const props = defineProps({
  row: { type: Object, required: true },
  schoolYearLabel: { type: String, required: true },
})

const editing = ref(false)
const draft = ref('')
const confirming = ref(false)
const busy = ref(false)
const error = ref('')

const textarea = ref(null)
async function startEdit() {
  draft.value = props.row.note
  editing.value = true
  error.value = ''
  await nextTick()
  textarea.value?.focus()
}

async function run(action, failure) {
  busy.value = true
  error.value = ''
  try {
    await action()
    return true
  } catch (e) {
    console.error(failure, e)
    error.value = failure
    return false
  } finally {
    busy.value = false
  }
}

async function saveNote() {
  const note = draft.value.trim()
  if (
    note === props.row.note ||
    (await run(() => updateLeaderNote(props.row.id, note), SAVE_FAILED))
  ) {
    editing.value = false
  }
}

function remove() {
  // On success the live list drops the row (and this detail with it).
  run(() => deleteWaitlistEntry(props.row.id), DELETE_FAILED)
}

const pill =
  'flex h-9 cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-[13px] text-[14.5px] disabled:cursor-wait disabled:opacity-60'
const gender = { girl: 'narozena', boy: 'narozen' }
</script>

<template>
  <div class="flex flex-col gap-2 px-4 pt-0.5 pb-3.5 text-[15px] lg:pl-[296px]">
    <dl class="m-0 flex flex-col gap-1 text-ink lg:hidden">
      <div>
        <dt class="inline text-muted-2">Zapsáno:</dt>
        <dd class="inline m-0">
          {{ formatDate(row.signedUp) }}
          <template v-if="row.renewals">· zájem obnoven {{ row.renewals }}×</template>
        </dd>
      </div>
      <div>
        <dt class="inline text-muted-2">{{ gender[row.gender] ?? 'narozeno' }}:</dt>
        <dd class="inline m-0">
          {{ formatDate(row.birthDate) }} · {{ gradeLong(row.grade) }} ve školním roce
          {{ schoolYearLabel }}
        </dd>
      </div>
      <div>
        <dt class="inline text-muted-2">Rodič:</dt>
        <dd class="inline m-0">{{ row.parentName }}</dd>
      </div>
    </dl>
    <p v-if="row.knowsWhom" class="m-0 max-w-[70ch] leading-[1.55] text-ink">
      <span class="text-muted-2">Zná z oddílu: </span>{{ row.knowsWhom }}
    </p>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-1">
      <span class="text-muted-2">Kontakt na rodiče:</span>
      <a :href="`mailto:${row.email}`" class="py-1 break-all">{{ row.email }}</a>
      <a :href="`tel:${row.phone.replaceAll(' ', '')}`" class="py-1 whitespace-nowrap">{{
        row.phone
      }}</a>
    </div>

    <div v-if="editing" class="flex max-w-[640px] flex-col gap-2">
      <label :for="`note-${row.id}`" class="text-[13.5px] text-muted-2">
        Poznámka vedoucích <span class="text-faint">· vidí jen tým</span>
      </label>
      <textarea
        :id="`note-${row.id}`"
        ref="textarea"
        v-model="draft"
        rows="2"
        :placeholder="NOTE_PLACEHOLDER"
        class="resize-y rounded-[10px] border-[1.5px] border-gold bg-[#FFFBEA] px-3 py-[9px] text-[15px] leading-normal text-ink outline-none placeholder:text-faint"
      />
      <button
        type="button"
        :disabled="busy"
        class="cursor-pointer self-start rounded-full border-0 bg-green px-[18px] py-2 text-[14.5px] text-cream hover:bg-green-hover disabled:cursor-wait disabled:opacity-60"
        @click="saveNote"
      >
        Hotovo
      </button>
    </div>
    <div
      v-else-if="row.note"
      class="flex max-w-[640px] items-start gap-2.5 rounded-[10px] border-[1.5px] border-gold bg-[#FFF6D8] px-3 py-[9px]"
    >
      <NoteIcon class="size-5" />
      <p class="m-0 flex-1 text-[15px] leading-normal whitespace-pre-wrap text-ink">
        {{ row.note }}
      </p>
      <button
        type="button"
        title="Upravit poznámku"
        class="flex flex-none cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 py-0.5 text-[14px] text-[#8A5A2B]"
        @click="startEdit"
      >
        <svg
          viewBox="0 0 24 24"
          class="block size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5 L19 9 L9 19 L5 19 L5 15 Z M13 7 L17 11" />
        </svg>
        upravit
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <button
        v-if="!row.note && !editing"
        type="button"
        :class="pill"
        class="border-line bg-paper text-ink hover:border-trail"
        @click="startEdit"
      >
        <NoteIcon class="size-[18px]" />Přidat poznámku
      </button>
      <div
        v-if="confirming"
        role="alert"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] bg-red-light py-1 pr-1.5 pl-3.5"
      >
        <span class="text-[14.5px] text-[#7A2E1A]">
          Opravdu smazat {{ row.name }} z listiny? Nejde vrátit.
        </span>
        <button
          type="button"
          :disabled="busy"
          class="cursor-pointer rounded-full border-0 bg-[#B4462B] px-3.5 py-[7px] text-[14.5px] text-paper disabled:cursor-wait disabled:opacity-60"
          @click="remove"
        >
          Ano, smazat
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-full border-0 bg-paper px-3.5 py-[7px] text-[14.5px] text-ink"
          @click="confirming = false"
        >
          Zrušit
        </button>
      </div>
      <button
        v-else
        type="button"
        :class="pill"
        class="border-transparent bg-transparent text-[#9A3A22] hover:border-[#E0B7A8] hover:bg-[#FBEFEA]"
        @click="confirming = true"
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
          <path
            d="M5 7 L19 7 M10 7 L10 4.5 L14 4.5 L14 7 M7 7 L8 20 L16 20 L17 7 M10.5 11 L10.5 16.5 M13.5 11 L13.5 16.5"
          />
        </svg>
        Smazat zápis
      </button>
    </div>
    <p v-if="error" role="alert" class="m-0 text-[14.5px] text-red">{{ error }}</p>
  </div>
</template>
