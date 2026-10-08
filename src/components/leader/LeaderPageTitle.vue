<script setup>
import AudienceTag from '@/components/parent/AudienceTag.vue'
import TroopSwitch from './TroopSwitch.vue'

// Top of a leader page: back link, kicker and title; with `troop` the troop
// switch top right — on a phone only the troop tag next to the title (the troop
// is chosen on the leader home).
defineProps({
  kicker: { type: String, required: true },
  title: { type: String, required: true },
})
const troop = defineModel('troop', { type: String, default: null })
</script>

<template>
  <div class="flex flex-wrap items-start gap-x-5 gap-y-3">
    <div class="mr-auto">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1">
          ← zpět na vedoucovskou stránku
        </RouterLink>
      </p>
      <p class="kicker m-0 -mb-0.5">{{ kicker }}</p>
      <h1
        class="m-0 flex items-center gap-2.5 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]"
      >
        {{ title }}
        <AudienceTag v-if="troop" :audience="troop" class="sm:hidden" />
      </h1>
    </div>
    <TroopSwitch v-if="troop" v-model="troop" class="hidden sm:block" />
  </div>
</template>
