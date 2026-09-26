<script setup>
import { computed, ref } from 'vue'
import { useSaveState } from '@/composables/useSaveState'
import FormField from '@/components/form/FormField.vue'
import { plural } from '@/components/parent/parentText'
import CollapsibleSection from './CollapsibleSection.vue'
import SaveBar from './SaveBar.vue'

// One packing list template: name and items (one per line). Collapsed to a bar
// with the name and items until opened; a new template starts open.
const props = defineProps({
  template: { type: Object, default: null }, // { id, name, items }
  isNew: { type: Boolean, default: false },
  // Declared as props (bound with @save / @delete) so the card can await the writes.
  onSave: { type: Function, required: true }, // (fields) => Promise
  onDelete: { type: Function, default: null }, // () => Promise
})
defineEmits(['cancel'])

const open = ref(props.isNew)
const name = ref(props.template?.name ?? '')
const itemsText = ref((props.template?.items ?? []).join('\n'))
const errors = ref({})
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const items = computed(() =>
  itemsText.value
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean),
)
const dirty = computed(
  () =>
    name.value.trim() !== (props.template?.name ?? '') ||
    items.value.join('\n') !== (props.template?.items ?? []).join('\n'),
)

const { saving, saved, error, save } = useSaveState()

// „6 věcí · spacák, přezůvky, …“ (as saved)
const summary = computed(() => {
  const list = props.template?.items ?? []
  if (!list.length) return ''
  return `${list.length} ${plural(list.length, 'věc', 'věci', 'věcí')} · ${list.join(', ')}`
})

async function submit() {
  errors.value = {
    ...(name.value.trim() ? {} : { name: 'Vyplň název.' }),
    ...(items.value.length ? {} : { items: 'Napiš aspoň jednu věc.' }),
  }
  if (Object.keys(errors.value).length) return
  if (await save(() => props.onSave({ name: name.value.trim(), items: items.value }))) {
    itemsText.value = items.value.join('\n')
  }
}

async function remove() {
  deleting.value = true
  deleteError.value = ''
  try {
    await props.onDelete()
  } catch (e) {
    console.error('Deleting the template failed', e)
    deleteError.value = 'Nepovedlo se to smazat. Zkus to znovu.'
    deleting.value = false
  }
}
</script>

<template>
  <CollapsibleSection
    v-model:open="open"
    tag="form"
    novalidate
    :title="isNew ? 'Nová šablona' : template.name"
    :summary="summary"
    data-testid="template"
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-3.5">
      <FormField v-slot="{ id, describedBy }" label="Název" :error="errors.name">
        <input
          :id="id"
          v-model="name"
          type="text"
          maxlength="60"
          placeholder="např. Jednodenní výprava"
          class="field-input py-2.5"
          :aria-invalid="!!errors.name"
          :aria-describedby="describedBy"
        />
      </FormField>
      <FormField
        v-slot="{ id, describedBy }"
        label="Věci — každá na nový řádek"
        :error="errors.items"
      >
        <textarea
          :id="id"
          v-model="itemsText"
          rows="8"
          class="field-input resize-y py-2.5 leading-[1.6]"
          :aria-invalid="!!errors.items"
          :aria-describedby="describedBy"
        />
      </FormField>

      <SaveBar :saving="saving" :saved="saved" :dirty="!isNew && dirty" :error="error">
        <button v-if="isNew" type="button" class="btn-link" @click="$emit('cancel')">zrušit</button>
        <button
          v-else-if="!confirmingDelete"
          type="button"
          class="btn-link text-red! hover:text-ink!"
          @click="confirmingDelete = true"
        >
          smazat šablonu
        </button>
      </SaveBar>

      <div
        v-if="confirmingDelete"
        class="rounded-[10px] border-[1.5px] border-red bg-red-light/60 px-4 py-3"
        role="alertdialog"
        :aria-label="`Smazat šablonu ${template.name}`"
      >
        <p class="m-0 mb-2 text-[15px] leading-normal">
          Šablona „{{ template.name }}“ se smaže. Hotové plakátky zůstanou, jak jsou.
        </p>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            class="cursor-pointer rounded-full border-0 bg-red px-5 py-2 text-[15px] font-medium text-cream disabled:cursor-wait disabled:opacity-70"
            :disabled="deleting"
            @click="remove"
          >
            Ano, smazat
          </button>
          <button type="button" class="btn-link" @click="confirmingDelete = false">zrušit</button>
        </div>
        <p v-if="deleteError" role="alert" class="m-0 mt-2 text-[15px] text-red">
          {{ deleteError }}
        </p>
      </div>
    </div>
  </CollapsibleSection>
</template>
