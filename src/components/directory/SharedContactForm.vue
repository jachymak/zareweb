<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLeaderTroopStore } from '@/stores/leaderTroop'
import { addSharedContact, deleteSharedContact, updateSharedContact } from '@/services/directory'
import { sharedContactErrors } from '@shared/directory'
import { nicknameOf } from '@shared/names'

// Adding or editing a contact of „ostatní“ (SPEC §4.10) — shared by all
// leaders, any of them may change or delete it.
const props = defineProps({
  contact: { type: Object, default: null }, // a directory entry of kind 'other'; null = new
})
const emit = defineEmits(['saved', 'cancel'])

const auth = useAuthStore()
const leaderTroop = useLeaderTroopStore()

const form = ref({
  name: props.contact?.name ?? '',
  description: props.contact?.description ?? '',
  phone: props.contact?.phone ?? '',
  email: props.contact?.email ?? '',
})
const tried = ref(false)
const errors = computed(() => (tried.value ? sharedContactErrors(form.value) : {}))
const saving = ref(false)
const failed = ref(false)
const confirmDelete = ref(false)

async function author() {
  await leaderTroop.init().catch(() => null)
  return {
    uid: auth.user.uid,
    name: nicknameOf(leaderTroop.person) || auth.profile?.displayName || auth.user.email,
  }
}

async function run(action) {
  saving.value = true
  failed.value = false
  try {
    await action()
    emit('saved')
  } catch (e) {
    console.error('Saving a shared contact failed', e)
    failed.value = true
  } finally {
    saving.value = false
  }
}

function save() {
  tried.value = true
  if (Object.keys(sharedContactErrors(form.value)).length) return
  run(async () =>
    props.contact
      ? updateSharedContact(props.contact.id, form.value, await author())
      : addSharedContact(form.value, await author()),
  )
}
const remove = () => run(() => deleteSharedContact(props.contact.id))

const label = 'mb-1 block text-[14.5px] font-medium text-ink'
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-[3px] border-[1.5px] border-green bg-paper px-4 py-4 sm:px-[22px]"
    novalidate
    data-testid="shared-contact-form"
    @submit.prevent="save"
  >
    <h2 class="m-0 text-[19px] font-medium text-ink">
      {{ contact ? 'Upravit kontakt' : 'Nový kontakt pro všechny vedoucí' }}
    </h2>
    <div class="grid gap-3 sm:grid-cols-2">
      <label>
        <span :class="label">Jméno</span>
        <input
          v-model="form.name"
          class="field-input py-[10px]"
          :aria-invalid="Boolean(errors.name)"
          autocomplete="off"
        />
        <span v-if="errors.name" class="mt-1 block text-[14px] text-red">{{ errors.name }}</span>
      </label>
      <label>
        <span :class="label">Kdo to je</span>
        <input
          v-model="form.description"
          class="field-input py-[10px]"
          placeholder="např. starosta, Nová Ves u tábora"
          autocomplete="off"
        />
      </label>
      <label>
        <span :class="label">Telefon</span>
        <input
          v-model="form.phone"
          type="tel"
          class="field-input py-[10px]"
          :aria-invalid="Boolean(errors.reach)"
          autocomplete="off"
        />
      </label>
      <label>
        <span :class="label">E-mail</span>
        <input
          v-model="form.email"
          type="email"
          class="field-input py-[10px]"
          :aria-invalid="Boolean(errors.reach)"
          autocomplete="off"
        />
      </label>
    </div>
    <p v-if="errors.reach" class="m-0 text-[14px] text-red">{{ errors.reach }}</p>
    <p class="m-0 text-[14px] text-muted-2">
      Kontakt uvidí všichni vedoucí a kdokoli z nich ho může upravit.
    </p>
    <p v-if="failed" role="alert" class="m-0 text-red">Nepodařilo se uložit. Zkus to znovu.</p>
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <button type="submit" class="btn-primary px-6 py-2.5 text-[16px]" :disabled="saving">
        {{ saving ? 'ukládám…' : 'uložit' }}
      </button>
      <button type="button" class="btn-link" @click="emit('cancel')">zrušit</button>
      <template v-if="contact">
        <button
          v-if="!confirmDelete"
          type="button"
          class="btn-link ml-auto text-red"
          @click="confirmDelete = true"
        >
          smazat kontakt
        </button>
        <span v-else class="ml-auto flex flex-wrap items-center gap-x-3 text-[15px]">
          Smazat {{ contact.name }} pro všechny?
          <button type="button" class="btn-link text-red" :disabled="saving" @click="remove">
            ano, smazat
          </button>
          <button type="button" class="btn-link" @click="confirmDelete = false">ne</button>
        </span>
      </template>
    </div>
  </form>
</template>
