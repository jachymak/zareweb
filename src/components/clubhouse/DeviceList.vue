<script setup>
import { computed } from 'vue'
import DeviceRow from './DeviceRow.vue'
import { DEVICES, TARGET_MAX, TARGET_MIN, climateState } from './clubhouseText'

// „Zařízení“ — air-conditioning with the target temperature, then the on/off
// devices. Read-only in automat.
const props = defineProps({
  devices: { type: Object, required: true },
  temperature: { type: Number, required: true },
  locked: { type: Boolean, required: true },
})
const emit = defineEmits(['change'])

const climate = computed(() => props.devices.climate)
const climateNow = computed(() => climateState(climate.value, props.temperature))

function step(delta) {
  const target = Math.min(TARGET_MAX, Math.max(TARGET_MIN, climate.value.target + delta))
  if (target !== climate.value.target) emit('change', 'climate', { target })
}

const stepButton =
  'flex size-[38px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#c9bfa6] bg-[#f2eee1] text-[21px] leading-none text-ink disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <section aria-labelledby="devices-title">
    <div class="mb-3.5 flex flex-wrap items-end gap-x-4 gap-y-2">
      <div>
        <p class="kicker m-0 -mb-0.5">{{ locked ? 'řídí je rozvrh' : 'teď je ovládáš ty' }}</p>
        <h2 id="devices-title" class="m-0 text-[26px] font-medium tracking-[-0.03em] text-ink">
          Zařízení
        </h2>
      </div>
      <div class="mt-3.5 h-px min-w-10 flex-1 bg-line-soft" />
      <span
        class="flex-none rounded-full px-3 py-[5px] text-[13px] tracking-[.06em] uppercase"
        :class="locked ? 'bg-[#f2eee1] text-[#4b5749]' : 'bg-[#faede4] text-[#8a2f16]'"
      >
        {{ locked ? 'v automatu jen pro čtení' : 'manuál — změny se hned projeví' }}
      </span>
    </div>

    <div class="rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-[18px] pt-1 pb-2">
      <DeviceRow
        name="Klimatizace — vytápění"
        detail="jedna jednotka pro celou klubovnu"
        :state="climateNow.text"
        :active="climateNow.active"
        :on="climate.on"
        :locked="locked"
        @toggle="emit('change', 'climate', { on: !climate.on })"
      >
        <span class="flex items-center gap-2.5" role="group" aria-label="Cílová teplota">
          <button
            type="button"
            :class="stepButton"
            :disabled="locked || climate.target <= TARGET_MIN"
            aria-label="o stupeň méně"
            @click="step(-1)"
          >
            –
          </button>
          <span
            class="min-w-[88px] text-center font-hand text-[28px] leading-none font-bold"
            :class="locked ? 'text-brown' : 'text-ink'"
            aria-live="polite"
          >
            {{ climate.target }} °C
          </span>
          <button
            type="button"
            :class="stepButton"
            :disabled="locked || climate.target >= TARGET_MAX"
            aria-label="o stupeň více"
            @click="step(1)"
          >
            +
          </button>
        </span>
      </DeviceRow>
      <DeviceRow
        v-for="device in DEVICES"
        :key="device.id"
        :name="device.name"
        :detail="device.detail"
        :state="devices[device.id].on ? 'běží' : 'stojí'"
        :active="devices[device.id].on"
        :on="devices[device.id].on"
        :locked="locked"
        @toggle="emit('change', device.id, { on: !devices[device.id].on })"
      />
      <p class="mx-0.5 mt-3 mb-1.5 font-hand text-[20px] leading-tight text-brown">
        {{
          locked
            ? 'Chceš něco přepnout (třeba na víkendovou brigádu)? Zapni manuál a nastav, na kolik hodin.'
            : 'Po vypršení manuálu se všechno vrátí pod rozvrh.'
        }}
      </p>
    </div>
  </section>
</template>
