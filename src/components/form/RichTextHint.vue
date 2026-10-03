<script setup>
import { ref, useId } from 'vue'

// „?“ next to the label of a field that takes <b>, <i> and <a href> (RichText.vue);
// opens a short explanation below the label. Rendered inside FormField's label row.
defineProps({
  note: { type: String, default: '' },
})

const open = ref(false)
const id = useId()

const EXAMPLES = [
  { code: '<b>tučně</b>', tag: 'b', result: 'tučně' },
  { code: '<i>kurzíva</i>', tag: 'i', result: 'kurzíva' },
  { code: '<a href="https://mapy.cz/…">mapa</a>', tag: 'a', result: 'mapa' },
]
</script>

<template>
  <button
    type="button"
    class="-my-2.5 grid size-11 cursor-pointer place-items-center border-0 bg-transparent p-0"
    :aria-expanded="open"
    :aria-controls="id"
    aria-label="Nápověda: tučné písmo, kurzíva, odkazy"
    @click="open = !open"
  >
    <span
      class="grid size-[22px] place-items-center rounded-full border-[1.5px] text-[13px] font-semibold"
      :class="
        open
          ? 'border-green bg-green text-cream'
          : 'border-line-soft text-muted hover:border-green hover:text-green'
      "
      aria-hidden="true"
      >?</span
    >
  </button>
  <div
    v-if="open"
    :id="id"
    class="mb-1 basis-full rounded-[10px] border border-line-soft bg-paper px-3.5 py-2.5 text-[14px] leading-normal text-text"
  >
    <p class="m-0 mb-1.5">Text jde zvýraznit jako v&nbsp;HTML:</p>
    <ul class="m-0 flex list-none flex-col gap-1 p-0">
      <li v-for="e in EXAMPLES" :key="e.tag" class="break-words">
        <code class="break-all text-ink">{{ e.code }}</code>
        →
        <a v-if="e.tag === 'a'" href="https://mapy.cz" target="_blank" rel="noopener">{{
          e.result
        }}</a>
        <component :is="e.tag" v-else>{{ e.result }}</component>
      </li>
    </ul>
    <p class="m-0 mt-1.5 text-muted">
      Adresy začínající https:// se proklikají samy. Jiné značky se ukážou jako obyčejný text.
    </p>
    <p v-if="note" class="m-0 mt-1.5 text-muted">{{ note }}</p>
  </div>
</template>
