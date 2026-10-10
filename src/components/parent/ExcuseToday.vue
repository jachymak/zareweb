<script setup>
import { computed, ref } from 'vue'
import { SAVE_ERROR, previewExcuseText } from './parentText'
import { nicknameOf } from '@shared/names'

// Excuse from today's meeting on a child card (SPEC §3.1): a button, an optional
// reason, then „omluveno“ with „zrušit“ until the day ends. The child still
// counts as absent; the leaders just see it was excused. In the leaders'
// preview a click only explains; there on another day (`sampleDay`) it is a
// sample, its tooltip says parents get it only on the meeting day. With no
// meeting today the parents see it greyed out, the tooltip (`inactive`) says why.
const props = defineProps({
  member: { type: Object, required: true },
  excuse: { type: Object, default: null }, // excuses doc, null = not excused
  saving: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  preview: { type: Boolean, default: false },
  sampleDay: { type: String, default: '' }, // „ve čtvrtek“ — preview on another day
  inactive: { type: String, default: '' }, // why it is greyed out (no meeting today)
})
const emit = defineEmits(['excuse', 'cancel'])

const open = ref(false)
const reason = ref('')
const notice = ref('')

function start() {
  if (props.preview) notice.value = previewExcuseText(nicknameOf(props.member), !!props.excuse)
  else open.value = true
}

function send() {
  emit('excuse', reason.value)
  open.value = false
  reason.value = ''
}

function cancel() {
  if (props.preview) notice.value = previewExcuseText(nicknameOf(props.member), true)
  else emit('cancel')
}

// Tooltip: why it is greyed out, or what the leaders' preview does.
const hint = computed(() => {
  if (props.inactive) return props.inactive
  if (props.sampleDay)
    return `ukázka — rodiče ho mají jen v den schůzky (${props.sampleDay}), když se koná`
  return props.preview ? 'v náhledu se nic neuloží' : undefined
})

const button =
  'min-h-9 cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[15px] whitespace-nowrap disabled:cursor-default'
</script>

<template>
  <div class="mt-3 border-t border-dashed border-[#d6ccb4] pt-3" data-testid="excuse">
    <div v-if="excuse" class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span
        class="rounded-full bg-paper px-2.5 py-0.5 text-[14px] font-medium text-[#7a5408] ring-1 ring-[#e2c47a] ring-inset"
        data-testid="excuse-state"
      >
        ✓ omluveno z dnešní schůzky
      </span>
      <span v-if="excuse.reason" class="text-[14px] text-[#8a7b5e]">{{ excuse.reason }}</span>
      <button
        type="button"
        :disabled="saving"
        class="cursor-pointer border-0 bg-transparent p-1 text-[14px] text-muted underline hover:text-red disabled:cursor-default"
        @click="cancel"
      >
        {{ saving ? 'ukládá se…' : 'zrušit' }}
      </button>
    </div>

    <form v-else-if="open" class="flex flex-wrap items-center gap-2" @submit.prevent="send">
      <input
        v-model="reason"
        aria-label="Důvod"
        placeholder="důvod (nepovinné)"
        maxlength="200"
        class="min-h-9 min-w-0 flex-[1_1_100%] rounded-[3px] border-[1.5px] border-[#c9bfa6] bg-cream px-2.5 text-[15px]"
      />
      <button type="submit" :class="button" class="border-gold bg-gold text-ink hover:bg-[#d9982a]">
        omluvit
      </button>
      <button
        type="button"
        :class="button"
        class="border-[#c9bfa6] bg-cream text-muted"
        @click="open = false"
      >
        zpět
      </button>
    </form>

    <!-- The note is a tooltip on a wrapper: a disabled button gets no hover. -->
    <span v-else class="inline-block" :title="hint" data-testid="excuse-hint">
      <button
        type="button"
        :disabled="saving || !!inactive"
        :class="button"
        class="border-gold bg-gold-light text-ink enabled:hover:bg-gold disabled:border-[#d6ccb4] disabled:bg-transparent disabled:text-muted-2"
        @click="start"
      >
        {{ saving ? 'ukládá se…' : 'omluvit z dnešní schůzky' }}
      </button>
    </span>

    <p aria-live="polite" class="m-0 empty:hidden">
      <span v-if="notice" class="note-warm mt-2.5 block">{{ notice }}</span>
    </p>
    <p v-if="error" role="alert" class="m-0 mt-2 text-[14.5px] text-red">{{ SAVE_ERROR }}</p>
  </div>
</template>
