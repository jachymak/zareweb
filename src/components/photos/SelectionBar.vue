<script setup>
import { ref, watch } from 'vue'
import { photoCount } from './photosText'

// Floating bar of the selected photos (leaders): set as cover, delete (with a
// confirmation), clear the selection.
const props = defineProps({
  count: { type: Number, required: true },
  deleting: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['cover', 'delete', 'clear'])

const confirming = ref(false)
watch(
  () => props.count,
  () => (confirming.value = false),
)
const btn =
  'cursor-pointer rounded-full border-0 px-3.5 py-2 text-[14.5px] font-medium whitespace-nowrap disabled:cursor-wait disabled:opacity-60'
</script>

<template>
  <div
    class="fixed inset-x-2 bottom-3 z-40 mx-auto flex max-w-[640px] flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[18px] bg-ink px-3 py-2.5 text-cream shadow-[0_10px_30px_rgba(0,0,0,.3)] sm:bottom-5 sm:rounded-full sm:px-4"
    role="toolbar"
    aria-label="Vybrané fotky"
    data-testid="selection-bar"
  >
    <button
      type="button"
      class="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[20px] text-cream"
      aria-label="zrušit výběr"
      @click="emit('clear')"
    >
      ×
    </button>
    <span class="mr-auto text-[15px] font-medium">vybráno {{ count }}</span>
    <template v-if="!confirming">
      <button
        v-if="count === 1"
        type="button"
        :class="btn"
        class="bg-cream/15 text-cream"
        @click="emit('cover')"
      >
        nastavit jako titulní
      </button>
      <button type="button" :class="btn" class="bg-red text-cream" @click="confirming = true">
        smazat
      </button>
    </template>
    <template v-else>
      <span class="text-[14.5px]">smazat {{ photoCount(count) }} i s originály?</span>
      <button
        type="button"
        :class="btn"
        class="bg-red text-cream"
        :disabled="deleting"
        @click="emit('delete')"
      >
        {{ deleting ? 'mažu…' : 'ano, smazat' }}
      </button>
      <button type="button" :class="btn" class="bg-cream/15 text-cream" @click="confirming = false">
        ne
      </button>
    </template>
    <p v-if="error" role="alert" class="m-0 basis-full text-[14px] text-[#ffb59f]">{{ error }}</p>
  </div>
</template>
