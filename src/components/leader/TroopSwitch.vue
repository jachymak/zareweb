<script setup>
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { AUDIENCES } from '@/constants/troops'

// Which troop the leader pages show — „Oddíl“ above a two-way switch, each
// option with its troop tag. Sits top right on the page.
const model = defineModel({ type: String, required: true })
</script>

<template>
  <div class="sm:text-right">
    <p
      id="troop-switch-label"
      class="m-0 mb-1.5 text-[12.5px] tracking-[.1em] text-[#8a7b5e] uppercase"
    >
      Oddíl
    </p>
    <div
      role="group"
      aria-labelledby="troop-switch-label"
      class="flex w-fit max-w-full overflow-hidden rounded-full border-[1.5px] border-ink sm:ml-auto"
    >
      <button
        v-for="code in ['vlc', 'ss']"
        :key="code"
        type="button"
        :aria-pressed="model === code"
        :aria-label="AUDIENCES[code].name"
        class="flex cursor-pointer items-center gap-2 border-0 py-1.5 pr-4 pl-2 text-[15px] font-medium whitespace-nowrap"
        :class="model === code ? 'bg-ink text-cream' : 'bg-transparent text-text hover:bg-sand'"
        @click="model = code"
      >
        <AudienceTag :audience="code" />
        {{ AUDIENCES[code].name }}
      </button>
    </div>
  </div>
</template>
