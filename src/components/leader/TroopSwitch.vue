<script setup>
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { AUDIENCES } from '@/constants/troops'

// Which troop the leader pages show: the troop tags „vlč“ / „s&s“ as toggles.
const model = defineModel({ type: String, required: true })
</script>

<template>
  <div role="group" aria-label="Oddíl" class="flex items-center gap-1">
    <button
      v-for="code in ['vlc', 'ss']"
      :key="code"
      type="button"
      :aria-pressed="model === code"
      :aria-label="AUDIENCES[code].name"
      class="cursor-pointer rounded-full border-0 bg-transparent p-0.5 transition-transform hover:-translate-y-px"
      @click="model = code"
    >
      <AudienceTag :audience="code" :muted="model !== code" />
    </button>
  </div>
</template>
