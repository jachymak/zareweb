<script setup>
import { computed } from 'vue'

// Whether the autosaved changes are really saved (useAttendance saveState):
// „ukládá se samo“ before the first change, „ukládám…“, „✓ uloženo v 17:42“
// once the server confirmed it, or a warning while a change waits for the
// connection or failed. `floating`: a pill at the bottom of the screen on a
// phone, so it is in view while ticking children further down.
const props = defineProps({
  state: { type: String, required: true }, // 'idle' | 'saving' | 'saved' | 'waiting' | 'error'
  savedAt: { type: Date, default: null },
  floating: { type: Boolean, default: false },
})

const time = computed(() =>
  props.savedAt?.toLocaleTimeString('cs-CZ', { hour: 'numeric', minute: '2-digit' }),
)
const TEXT = {
  idle: () => 'ukládá se samo',
  saving: () => 'ukládám…',
  saved: () => `✓ uloženo v ${time.value}`,
  waiting: () => 'čeká na internet — zatím neuloženo',
  error: () => 'neuloženo — zkus to znovu',
}
const COLOR = {
  idle: 'text-brown',
  saving: 'text-muted',
  saved: 'text-green',
  waiting: 'text-red',
  error: 'text-red',
}
</script>

<template>
  <div
    v-if="floating"
    v-show="state !== 'idle'"
    class="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center sm:hidden"
  >
    <span
      aria-hidden="true"
      class="rounded-full border-[1.5px] bg-paper px-4 py-1.5 font-hand text-[19px] font-bold shadow-[0_2px_8px_rgba(34,48,31,0.18)]"
      :class="[COLOR[state], state === 'saved' ? 'border-green' : 'border-current']"
    >
      {{ TEXT[state]() }}
    </span>
  </div>
  <span
    v-else
    role="status"
    class="font-hand text-[20px]"
    :class="[COLOR[state], state === 'idle' ? '' : 'font-bold']"
    data-testid="save-status"
  >
    {{ TEXT[state]() }}
  </span>
</template>
