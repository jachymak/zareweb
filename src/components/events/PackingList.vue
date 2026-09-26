<script setup>
import { ref } from 'vue'

// „S sebou“: start from a template (items are copied into the event), then
// remove items (×) or add new ones (Enter).
const items = defineModel('items', { type: Array, required: true })
const templateId = defineModel('templateId', { type: String, default: null })
const props = defineProps({
  templates: { type: Array, required: true }, // packingTemplates
})

const newItem = ref('')

function pickTemplate(id) {
  const template = props.templates.find((t) => t.id === id)
  if (
    template &&
    items.value.length &&
    !window.confirm('Nahradit současný seznam věcí hotovým seznamem?')
  ) {
    return
  }
  templateId.value = id || null
  if (template) items.value = [...template.items]
}

function add() {
  const item = newItem.value.trim()
  if (item && !items.value.includes(item)) items.value = [...items.value, item]
  newItem.value = ''
}
</script>

<template>
  <div>
    <label class="flex flex-col gap-[7px]">
      <span class="text-[15px] font-medium text-ink">S sebou — začni hotovým seznamem</span>
      <select
        class="field-input"
        :value="templateId ?? ''"
        @change="
          (e) => {
            pickTemplate(e.target.value)
            e.target.value = templateId ?? ''
          }
        "
      >
        <option value="">bez hotového seznamu</option>
        <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </label>
    <div class="mt-2.5 rounded-lg bg-[#f6efdc] px-3.5 pt-3 pb-3.5">
      <p class="m-0 mb-[9px] font-hand text-[20px] text-brown">
        {{ items.length ? `${items.length} věcí na plakátku` : 'zatím žádné věci' }}
      </p>
      <ul v-if="items.length" class="m-0 flex list-none flex-wrap gap-[7px] p-0">
        <li
          v-for="item in items"
          :key="item"
          class="inline-flex items-center gap-1 rounded-full border border-[#e2d9c2] bg-paper py-0.5 pr-0.5 pl-3 text-[14.5px] text-[#4b5749]"
        >
          {{ item }}
          <button
            type="button"
            :aria-label="`odebrat ${item}`"
            class="flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[17px] text-[#8a2f16] hover:bg-red-light"
            @click="items = items.filter((x) => x !== item)"
          >
            ×
          </button>
        </li>
      </ul>
      <input
        v-model="newItem"
        type="text"
        maxlength="80"
        placeholder="přidat věc a zmáčknout Enter"
        aria-label="Přidat věc"
        class="field-input mt-2.5 py-2! text-[15px]!"
        @keydown.enter.prevent="add"
        @blur="add"
      />
      <p class="m-0 mt-[9px] text-[13.5px] text-[#8a7b5e]">
        Hotové seznamy se upravují v Administraci — tady jen doladíš tuhle akci.
      </p>
    </div>
  </div>
</template>
