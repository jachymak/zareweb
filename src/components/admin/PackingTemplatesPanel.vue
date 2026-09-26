<script setup>
import { onMounted, ref } from 'vue'
import {
  createPackingTemplate,
  deletePackingTemplate,
  listPackingTemplates,
  updatePackingTemplate,
} from '@/services/packingTemplates'
import PackingTemplateCard from './PackingTemplateCard.vue'

// „Šablony s sebou“ — SPEC §4.8 Packing list templates. A poster copies the
// items of the chosen template, so editing or deleting one changes no poster.
defineEmits(['open-tab'])

const templates = ref(null)
const loadError = ref('')
const adding = ref(false)

const byName = (a, b) => a.name.localeCompare(b.name, 'cs')

async function load() {
  try {
    templates.value = (await listPackingTemplates()).sort(byName)
  } catch (e) {
    console.error('Loading packing templates failed', e)
    loadError.value = 'Šablony se nepodařilo načíst. Zkus stránku obnovit.'
  }
}
onMounted(load)

async function create(fields) {
  const id = await createPackingTemplate(fields)
  templates.value = [...templates.value, { id, ...fields }].sort(byName)
  adding.value = false
}

async function update(template, fields) {
  await updatePackingTemplate(template.id, fields)
  Object.assign(template, fields)
}

async function remove(template) {
  await deletePackingTemplate(template.id)
  templates.value = templates.value.filter((t) => t.id !== template.id)
}
</script>

<template>
  <section aria-labelledby="templates-title">
    <h2 id="templates-title" class="sr-only">Šablony s sebou</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Hotové seznamy věcí „s sebou“. V plakátku je vedoucí vybere a pak upraví — plakátek si věci
      zkopíruje, takže změna nebo smazání šablony už hotové plakátky nezmění.
    </p>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="!templates" class="font-hand text-2xl text-muted">načítám šablony…</p>

    <div v-else class="flex flex-col gap-2.5">
      <PackingTemplateCard v-if="adding" is-new @save="create" @cancel="adding = false" />
      <button
        v-else
        type="button"
        class="cursor-pointer self-start rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-4 py-1.5 font-hand text-[21px] font-bold text-green"
        @click="adding = true"
      >
        + nová šablona
      </button>

      <PackingTemplateCard
        v-for="t in templates"
        :key="t.id"
        :template="t"
        @save="(fields) => update(t, fields)"
        @delete="() => remove(t)"
      />
      <p v-if="!templates.length && !adding" class="m-0 py-2 text-[15.5px] text-muted">
        Zatím žádná šablona.
      </p>
    </div>
  </section>
</template>
