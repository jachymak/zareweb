<script setup>
// Organizers from the leaders (skautisPeople): click to add or remove; the
// first one is the main organizer (contact on the poster).
const model = defineModel({ type: Array, required: true }) // skautisPeople ids, in order
defineProps({
  leaders: { type: Array, required: true },
  invalid: { type: Boolean, default: false },
  describedBy: { type: String, default: undefined },
})

function toggle(id) {
  model.value = model.value.includes(id)
    ? model.value.filter((x) => x !== id)
    : [...model.value, id]
}
</script>

<template>
  <div>
    <div
      role="group"
      aria-label="Organizátoři"
      :aria-describedby="describedBy"
      class="flex flex-wrap gap-1.5 rounded-xl border-[1.5px] bg-paper p-2"
      :class="invalid ? 'border-red' : 'border-line'"
    >
      <button
        v-for="leader in leaders"
        :key="leader.id"
        type="button"
        :aria-pressed="model.includes(leader.id)"
        :title="leader.name"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[14.5px]"
        :class="
          model.includes(leader.id)
            ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
            : 'border-[#d6ccb4] bg-transparent text-muted hover:border-line-strong'
        "
        @click="toggle(leader.id)"
      >
        <span
          v-if="model.includes(leader.id)"
          class="flex size-5 items-center justify-center rounded-full bg-green text-[12px] text-cream"
          aria-hidden="true"
        >
          {{ model.indexOf(leader.id) + 1 }}
        </span>
        {{ leader.nickname }}
      </button>
    </div>
    <p class="m-0 mt-1.5 text-[13.5px] text-[#8a7b5e]">
      <template v-if="model.length">
        hlavní organizátor:
        <b class="font-medium text-ink">{{ leaders.find((l) => l.id === model[0])?.nickname }}</b>
        — jeho kontakt bude na plakátku
      </template>
      <template v-else>první vybraný je hlavní organizátor</template>
    </p>
  </div>
</template>
