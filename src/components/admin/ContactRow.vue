<script setup>
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { CONTACT_GROUP_NAMES } from '@/constants/troops'
import { contactPhotoBlob } from './contactPhoto'
import { nicknameOf } from '@shared/names'

// One contact in Administration → kontakty. A skautIS contact shows the
// leader's details read-only (with warnings for what is missing in skautIS);
// its role title comes from skautIS and can be overwritten. A manual contact
// („ostatní“ only) has all fields editable. The photo is resized here and
// uploaded by the panel on save. The fields are edited in place — `contact`
// is an entry of the panel's draft.
const props = defineProps({
  contact: { type: Object, required: true },
  person: { type: Object, default: null }, // skautisPeople doc of a linked contact
  errors: { type: Object, default: () => ({}) }, // { name?, reach? } of a manual contact
  first: { type: Boolean, default: false },
  last: { type: Boolean, default: false },
})
defineEmits(['up', 'down', 'remove', 'group'])

const id = useId()
const manual = computed(() => !props.contact.personId)
const heading = computed(() =>
  manual.value ? nicknameOf(props.contact) || 'Nový kontakt' : nicknameOf(props.person) || '?',
)
const skautisRole = computed(() => props.person?.roleTitle ?? '')

// Role title: pre-filled from skautIS; the same text is kept as no override,
// so later changes in skautIS show up (an emptied field too, once saved).
const roleText = computed({
  get: () => props.contact.roleTitle ?? (manual.value ? '' : skautisRole.value),
  set: (value) => {
    props.contact.roleTitle = !manual.value && value.trim() === skautisRole.value ? null : value
  },
})
const roleOverridden = computed(() => !manual.value && props.contact.roleTitle != null)

// ---- photo ----

const photoInput = ref(null)
const photoError = ref('')
const preview = ref(null) // object URL of a picked, not yet uploaded photo
watch(
  () => props.contact.photoBlob,
  (blob) => {
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = blob ? URL.createObjectURL(blob) : null
  },
  { immediate: true },
)
onUnmounted(() => preview.value && URL.revokeObjectURL(preview.value))
const photoSrc = computed(() => preview.value ?? props.contact.photoUrl)

async function pickPhoto(event) {
  const [file] = event.target.files
  event.target.value = ''
  if (!file) return
  photoError.value = ''
  const { blob, error } = await contactPhotoBlob(file)
  if (error) return (photoError.value = error)
  props.contact.photoBlob = blob
}

function removePhoto() {
  props.contact.photoBlob = null
  props.contact.photoUrl = null
  props.contact.photoPath = null
  photoError.value = ''
}
</script>

<template>
  <li
    class="flex flex-col gap-3 border-t border-[#e7dfcb] py-4 sm:flex-row sm:gap-4"
    data-testid="contact"
  >
    <!-- photo as on the parents' card -->
    <div class="flex flex-none items-start gap-3 sm:w-[112px] sm:flex-col sm:items-center">
      <div
        class="flex-none -rotate-[1.2deg] bg-paper px-1.5 pt-1.5 pb-[5px] shadow-[0_6px_14px_rgba(34,48,31,.1)]"
      >
        <img
          v-if="photoSrc"
          :src="photoSrc"
          :alt="`Fotka ${heading}`"
          class="block aspect-[3/4] w-[68px] object-cover"
          data-testid="contact-photo"
        />
        <div v-else class="aspect-[3/4] w-[68px] bg-sand" aria-hidden="true" />
      </div>
      <div class="flex flex-col items-start sm:items-center">
        <input
          :id="`${id}-photo`"
          ref="photoInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          data-testid="contact-photo-input"
          @change="pickPhoto"
        />
        <button type="button" class="btn-link text-[14.5px]" @click="photoInput.click()">
          {{ photoSrc ? 'změnit fotku' : 'nahrát fotku' }}
        </button>
        <button
          v-if="photoSrc"
          type="button"
          class="btn-link py-0.5 text-[14.5px] text-red! hover:text-ink!"
          @click="removePhoto"
        >
          odebrat fotku
        </button>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2.5">
      <p v-if="photoError" role="alert" class="m-0 text-sm text-red">{{ photoError }}</p>

      <!-- skautIS contact: details read-only -->
      <div v-if="!manual">
        <h3 class="m-0 font-hand text-[23px] leading-[1.15] font-bold text-ink">{{ heading }}</h3>
        <template v-if="person">
          <p class="m-0 text-[14.5px] text-muted">{{ person.name }}</p>
          <p class="m-0 text-[15px] break-words">
            <span v-if="person.phone">{{ person.phone }}</span>
            <span v-else class="text-red">doplň telefon ve skautISu</span>
            ·
            <span v-if="person.email">{{ person.email }}</span>
            <span v-else class="text-red">doplň e-mail ve skautISu</span>
          </p>
          <p v-if="!person.active" class="note-warm m-0 mt-1.5">
            Už není ve skautISu — rodiče ho nevidí. Kontakt můžeš odebrat.
          </p>
        </template>
        <p v-else class="note-warm m-0 mt-1.5">
          Tenhle vedoucí ve skautISu není — rodiče ho nevidí. Kontakt můžeš odebrat.
        </p>
      </div>

      <!-- manual contact: all fields -->
      <template v-else>
        <p class="m-0 text-[13.5px] text-brown">ruční kontakt — není ve skautISu</p>
        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label class="flex min-w-0 flex-col gap-1">
            <span class="text-[14.5px] font-medium text-ink">Přezdívka</span>
            <input
              v-model="contact.nickname"
              type="text"
              maxlength="40"
              class="field-input py-2"
              :aria-invalid="!!errors.name"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-1">
            <span class="text-[14.5px] font-medium text-ink">Jméno</span>
            <input
              v-model="contact.name"
              type="text"
              maxlength="80"
              class="field-input py-2"
              :aria-invalid="!!errors.name"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-1">
            <span class="text-[14.5px] font-medium text-ink">Telefon</span>
            <input
              v-model="contact.phone"
              type="tel"
              maxlength="30"
              class="field-input py-2"
              :aria-invalid="!!errors.reach"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-1">
            <span class="text-[14.5px] font-medium text-ink">E-mail</span>
            <input
              v-model="contact.email"
              type="email"
              maxlength="120"
              class="field-input py-2"
              :aria-invalid="!!errors.reach"
            />
          </label>
        </div>
        <p v-if="errors.name" class="m-0 text-sm text-red">{{ errors.name }}</p>
        <p v-if="errors.reach" class="m-0 text-sm text-red">{{ errors.reach }}</p>
      </template>

      <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label class="flex min-w-0 flex-col gap-1">
          <span class="text-[14.5px] font-medium text-ink">Role</span>
          <input
            v-model="roleText"
            type="text"
            maxlength="80"
            placeholder="např. rádce Bobrů"
            class="field-input py-2"
          />
          <span v-if="roleOverridden" class="text-[13.5px] text-muted-2">
            ve skautISu: {{ skautisRole || 'bez role' }} ·
            <button
              type="button"
              class="btn-link py-0 text-[13.5px]"
              @click="contact.roleTitle = null"
            >
              vrátit
            </button>
          </span>
        </label>
        <label class="flex min-w-0 flex-col gap-1">
          <span class="text-[14.5px] font-medium text-ink">Skupina</span>
          <select
            :value="contact.group"
            :disabled="manual"
            class="field-input py-2 disabled:opacity-70"
            @change="$emit('group', $event.target.value)"
          >
            <option v-for="(name, code) in CONTACT_GROUP_NAMES" :key="code" :value="code">
              {{ name }}
            </option>
          </select>
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          class="btn-link disabled:cursor-default disabled:text-faint disabled:no-underline"
          :disabled="first"
          :aria-label="`${heading} výš`"
          @click="$emit('up')"
        >
          ↑ výš
        </button>
        <button
          type="button"
          class="btn-link disabled:cursor-default disabled:text-faint disabled:no-underline"
          :disabled="last"
          :aria-label="`${heading} níž`"
          @click="$emit('down')"
        >
          ↓ níž
        </button>
        <button
          type="button"
          class="btn-link text-red! hover:text-ink!"
          :aria-label="`Odebrat kontakt ${heading}`"
          @click="$emit('remove')"
        >
          odebrat kontakt
        </button>
      </div>
    </div>
  </li>
</template>
