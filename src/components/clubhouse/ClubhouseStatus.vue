<script setup>
import { computed } from 'vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { HUMIDITY_LIMIT, MANUAL_HOURS, formatRemaining, formatTemperature } from './clubhouseText'

// Readings and the mode: automat (schedule) or manuál for a chosen number of
// hours. The outline is green in automat, red in manuál.
const props = defineProps({
  clubhouse: { type: Object, required: true },
  now: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
})
const emit = defineEmits(['auto', 'manual'])

const manual = computed(() => props.clubhouse.mode === 'manual')
const humid = computed(() => props.clubhouse.readings.humidity > HUMIDITY_LIMIT)
const remaining = computed(() => formatRemaining(new Date(props.clubhouse.manualUntil) - props.now))

const label = 'm-0 text-[12.5px] tracking-[.1em] text-[#8a7b5e] uppercase'
const reading = 'm-0 font-hand text-[34px] leading-none font-bold'
const modeButton = 'cursor-pointer border-0 px-[18px] py-2 text-[15px] font-medium'
</script>

<template>
  <HandDrawnBox :stroke="manual ? 'var(--color-red)' : 'var(--color-green)'">
    <div class="px-5 pt-5 pb-[22px] sm:px-6">
      <div class="flex flex-wrap items-end gap-x-8 gap-y-[18px]">
        <div>
          <p :class="label" class="mb-0.5">Teploměr</p>
          <p :class="reading" class="text-ink">
            {{ formatTemperature(clubhouse.readings.temperature) }}
          </p>
        </div>
        <div>
          <p :class="label" class="mb-0.5">Vlhkost</p>
          <p :class="[reading, humid ? 'text-red' : 'text-ink']">
            {{ clubhouse.readings.humidity }} %
          </p>
        </div>
        <div class="sm:ml-auto">
          <p :class="label" class="mb-1.5">Režim</p>
          <div
            class="flex w-fit overflow-hidden rounded-full border-2 border-ink"
            role="group"
            aria-label="Režim klubovny"
          >
            <button
              type="button"
              :aria-pressed="!manual"
              :class="[modeButton, manual ? 'bg-transparent text-text' : 'bg-ink text-cream']"
              @click="manual && emit('auto')"
            >
              automat
            </button>
            <button
              type="button"
              :aria-pressed="manual"
              :class="[modeButton, manual ? 'bg-red text-white' : 'bg-transparent text-text']"
              @click="!manual && emit('manual', clubhouse.manualHours)"
            >
              manuál
            </button>
          </div>
        </div>
      </div>

      <div
        class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-line-soft pt-3.5"
      >
        <template v-if="!manual">
          <span class="font-hand text-[23px] leading-tight text-green">
            Jede podle rozvrhu — topí před schůzkou, mezi schůzkami útlum.
          </span>
          <span class="text-[15px] text-muted sm:ml-auto">
            rozvrh se nastavuje v
            <RouterLink v-if="isAdmin" to="/vedouci/administrace">Administraci</RouterLink>
            <template v-else>Administraci</template>
          </span>
        </template>
        <template v-else>
          <span class="font-hand text-[23px] leading-tight text-red" aria-live="polite">
            manuál běží ještě {{ remaining }}
          </span>
          <span class="flex flex-wrap gap-[7px]" role="group" aria-label="Délka manuálu">
            <button
              v-for="hours in MANUAL_HOURS"
              :key="hours"
              type="button"
              :aria-pressed="clubhouse.manualHours === hours"
              class="cursor-pointer rounded-full border-[1.5px] px-[13px] py-1.5 text-[14px] text-ink"
              :class="
                clubhouse.manualHours === hours
                  ? 'border-ink bg-gold-light'
                  : 'border-[#d6ccb4] bg-transparent'
              "
              @click="emit('manual', hours)"
            >
              {{ hours }} h
            </button>
          </span>
          <button
            type="button"
            class="cursor-pointer rounded-full border-[1.5px] border-green bg-[#e9f1ea] px-[15px] py-[7px] text-[14.5px] text-[#1f5138] sm:ml-auto"
            @click="emit('auto')"
          >
            vrátit na automat
          </button>
        </template>
      </div>
    </div>
  </HandDrawnBox>
</template>
