<script setup>
import { ref } from 'vue'
import { setNewsWithdrawn } from '@/services/news'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { formatTimestamp, SAVE_ERROR } from '@/components/parent/parentText'

// One published (or withdrawn) news item: date, audience, author, title,
// „upravit“ and „stáhnout“ (asks first) / „vrátit“.
const props = defineProps({
  item: { type: Object, required: true },
  editing: { type: Boolean, default: false }, // loaded in the form
})
const emit = defineEmits(['edit'])

const confirming = ref(false)
const busy = ref(false)
const error = ref(false)

async function setWithdrawn(withdrawn) {
  busy.value = true
  error.value = false
  try {
    await setNewsWithdrawn(props.item.id, withdrawn)
    confirming.value = false
  } catch (e) {
    console.error('Withdrawing the news failed', e)
    error.value = true
  } finally {
    busy.value = false
  }
}

const action =
  'cursor-pointer border-0 bg-transparent p-0 py-1 font-sans text-[14.5px] underline underline-offset-4 disabled:cursor-wait disabled:opacity-60'
</script>

<template>
  <article
    class="rounded-[3px] border-[1.5px] px-4 pt-[13px] pb-2.5"
    :class="[
      item.withdrawn
        ? 'border-dashed border-line-soft bg-transparent'
        : item.important
          ? 'border-[#d08a6a] bg-[#faede4]'
          : 'border-[#e2d9c2] bg-paper',
      editing && 'outline-2 outline-offset-2 outline-green',
    ]"
    :aria-label="item.title"
  >
    <div :class="item.withdrawn && 'opacity-60'">
      <div class="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span class="font-hand text-[21px] font-bold text-red">
          {{ formatTimestamp(item.publishedAt) }}
        </span>
        <AudienceTag :audience="item.audience" :muted="item.withdrawn" />
        <span v-if="item.withdrawn" class="font-hand text-[19px] text-brown">staženo</span>
        <span v-else-if="item.important" class="font-hand text-[19px] text-[#8a2f16]"
          >důležité</span
        >
        <span class="ml-auto text-[14px] text-[#8a7b5e]">{{ item.authorName }}</span>
      </div>
      <p class="m-0 mb-1 text-[17px] leading-[1.35] font-medium break-words text-ink">
        {{ item.title }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <template v-if="confirming">
        <span class="text-[14.5px] text-ink">Opravdu stáhnout? Rodiče ji přestanou vidět.</span>
        <button
          type="button"
          :disabled="busy"
          :class="action"
          class="text-[#8a2f16] decoration-[#d08a6a]"
          @click="setWithdrawn(true)"
        >
          ano, stáhnout
        </button>
        <button
          type="button"
          :class="action"
          class="text-green decoration-[#9ec0a8]"
          @click="confirming = false"
        >
          ne
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          :class="action"
          class="text-green decoration-[#9ec0a8]"
          @click="emit('edit')"
        >
          upravit
        </button>
        <button
          v-if="item.withdrawn"
          type="button"
          :disabled="busy"
          :class="action"
          class="text-green decoration-[#9ec0a8]"
          @click="setWithdrawn(false)"
        >
          vrátit
        </button>
        <button
          v-else
          type="button"
          :class="action"
          class="text-[#8a2f16] decoration-[#d08a6a]"
          @click="confirming = true"
        >
          stáhnout
        </button>
      </template>
    </div>
    <p v-if="error" role="alert" class="m-0 mt-1 text-sm text-red">{{ SAVE_ERROR }}</p>
  </article>
</template>
