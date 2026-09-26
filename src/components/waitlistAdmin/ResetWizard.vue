<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { resetWaitlist } from '@/services/waitlist'
import { getEmailSettings } from '@/services/settings'
import { renewalEmailTemplate } from '@shared/renewalEmail'
import { formatSchoolYear, recruitmentYears } from '@shared/schoolYear'
import AdmittedPicker from './AdmittedPicker.vue'
import RenewalEmailPreview from './RenewalEmailPreview.vue'
import { emailsLabel, RESET_STEPS } from './waitlistAdminText'

// „Resetovat listinu na další rok“ — SPEC §4.6: how it works → admitted
// children → e-mail preview and confirmation → sending (resetWaitlist).
const props = defineProps({
  rows: { type: Array, required: true }, // the whole active list
  today: { type: String, required: true },
})
const emit = defineEmits(['close', 'done'])

const step = ref(1)
const admitted = ref(new Set())
const confirming = ref(false)
const result = ref(null)
const failed = ref(false)
const sending = computed(() => step.value === 4 && !result.value && !failed.value)

const recruitmentYear = formatSchoolYear(recruitmentYears(props.today, props.today).doneYear)
const toEmail = computed(() => props.rows.filter((r) => !admitted.value.has(r.id)))

// Text editable in Administration later; the default until then.
const template = ref(renewalEmailTemplate(null))
onMounted(async () => {
  try {
    template.value = renewalEmailTemplate((await getEmailSettings())?.waitlistRenewal)
  } catch (e) {
    console.error('Loading the e-mail template failed', e)
  }
})

async function send() {
  confirming.value = false
  step.value = 4
  failed.value = false
  try {
    result.value = await resetWaitlist([...admitted.value])
    emit('done', result.value)
  } catch (e) {
    console.error('Waiting-list reset failed', e)
    failed.value = true
  }
}

function close() {
  if (!sending.value) emit('close')
}

// Modal: focus inside, Escape closes, the page behind doesn't scroll.
const dialog = ref(null)
const onKey = (e) => e.key === 'Escape' && close()
onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  dialog.value?.focus()
})
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})

const stepStyle = (n) => {
  const current = Math.min(step.value, 3)
  return {
    dot:
      n < current
        ? 'bg-green text-cream'
        : n === current
          ? 'bg-ink text-cream'
          : 'bg-sand text-brown',
    text: n === current ? 'text-ink' : 'text-muted-2',
  }
}
const numeral = 'font-hand text-[24px] leading-none font-bold text-gold'
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/42 px-4 py-[5vh]"
    @click.self="close"
  >
    <div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-title"
      tabindex="-1"
      class="w-full max-w-[660px] rounded-[20px] bg-cream px-[clamp(18px,4vw,30px)] pt-6 pb-[26px] shadow-[0_24px_60px_rgba(34,48,31,.3)] outline-none"
    >
      <div class="mb-[18px] flex items-start gap-4">
        <div class="flex-1">
          <p class="m-0 -mb-0.5 font-hand text-[23px] text-red">roční obnova</p>
          <h2
            id="reset-title"
            class="m-0 text-[26px] leading-tight font-medium tracking-[-0.6px] text-ink"
          >
            Reset listiny na další rok
          </h2>
        </div>
        <button
          v-if="!sending"
          type="button"
          aria-label="Zavřít"
          class="cursor-pointer border-0 bg-transparent p-2 text-[22px] leading-none text-muted-2"
          @click="close"
        >
          ✕
        </button>
      </div>
      <ol
        class="m-0 mb-5 flex list-none flex-wrap gap-x-5 gap-y-2 border-b-[1.5px] border-dashed border-line-soft p-0 pb-3.5"
      >
        <li v-for="(name, i) in RESET_STEPS" :key="name" class="flex items-center gap-2">
          <span
            class="grid size-[26px] place-items-center rounded-full text-[13.5px] font-semibold"
            :class="stepStyle(i + 1).dot"
            >{{ i + 1 }}</span
          >
          <span
            class="text-[14px]"
            :class="stepStyle(i + 1).text"
            :aria-current="Math.min(step, 3) === i + 1 ? 'step' : undefined"
            >{{ name }}</span
          >
        </li>
      </ol>

      <div v-if="step === 1" class="flex flex-col gap-3 text-[16px] leading-[1.6]">
        <p class="m-0">
          Reset udělejte jednou ročně, až budete mít vybrané nováčky. Stane se tohle:
        </p>
        <div class="grid grid-cols-[28px_1fr] gap-x-2 gap-y-2.5">
          <span :class="numeral">1</span>
          <span>Nabrané děti, které označíte v dalším kroku, z listiny zmizí.</span>
          <span :class="numeral">2</span>
          <span
            >Všechny ostatní děti z listiny zmizí a jejich rodičům přijde e-mail s odkazem. Kdo na
            odkaz klikne, vrátí se na své původní místo v pořadí.</span
          >
          <span :class="numeral">3</span>
          <span
            >Na veřejném webu se ukáže, že nováčky na školní rok {{ recruitmentYear }} už máme
            nabrané.</span
          >
        </div>
        <p class="m-0 text-[14.5px] text-muted-2">
          Díky tomu na listině zůstanou jen ti, kdo o oddíl pořád stojí. Z minulého resetu se smažou
          úplně děti, jejichž rodiče na e-mail neodpověděli, i tehdy nabrané děti.
        </p>
      </div>

      <AdmittedPicker v-else-if="step === 2" v-model="admitted" :rows="rows" />

      <div v-else-if="step === 3" class="flex flex-col gap-3.5">
        <RenewalEmailPreview
          :template="template"
          :child-name="toEmail[0]?.name ?? 'jméno dítěte'"
        />
        <p class="m-0 text-[13.5px] text-muted-2">
          Text e-mailu jde změnit jen v administraci systému.
        </p>
        <div class="grid grid-cols-2 gap-2.5">
          <div class="rounded-xl bg-paper px-3 py-2.5">
            <p class="m-0 font-hand text-[30px] leading-none font-bold text-ink">
              {{ toEmail.length }}
            </p>
            <p class="m-0 mt-0.5 text-[13.5px] text-muted-2">e-mailů rodičům</p>
          </div>
          <div class="rounded-xl bg-paper px-3 py-2.5">
            <p class="m-0 font-hand text-[30px] leading-none font-bold text-ink">
              {{ admitted.size }}
            </p>
            <p class="m-0 mt-0.5 text-[13.5px] text-muted-2">nabraných odchází</p>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col gap-3 pt-2.5 pb-1" role="status">
        <p class="m-0 font-hand text-[28px] font-bold" :class="failed ? 'text-red' : 'text-green'">
          {{ failed ? 'Nepovedlo se' : result ? 'Odesláno' : 'Odesílám e-maily…' }}
        </p>
        <span class="block h-2.5 overflow-hidden rounded-[5px] bg-sand" aria-hidden="true">
          <span
            class="block h-full rounded-[5px] bg-green"
            :class="
              sending
                ? 'w-1/3 animate-[sending_1.2s_ease-in-out_infinite]'
                : result
                  ? 'w-full'
                  : 'w-0'
            "
          />
        </span>
        <p v-if="result" class="m-0 text-[15px] text-[#4B5749]">
          odesláno {{ result.emailedCount }} z {{ result.emailedCount }}
        </p>
        <p
          v-if="result"
          class="m-0 mt-1.5 rounded-xl bg-green-light px-3.5 py-3 text-[16px] leading-[1.6] text-ink"
        >
          Listina je aktualizovaná. Děti se budou vracet na svá původní místa, jak rodiče potvrdí
          zájem.
        </p>
        <p v-if="failed" role="alert" class="m-0 text-[15.5px] leading-normal text-red">
          Reset se nepodařilo dokončit. Zavřete okno a podívejte se, co na listině zůstalo — pak to
          zkuste znovu, případně napište správci.
        </p>
      </div>

      <div class="mt-[22px] flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          v-if="step === 2 || step === 3"
          type="button"
          class="cursor-pointer border-0 bg-transparent px-0 py-2 text-[15.5px] text-green"
          @click="(step--, (confirming = false))"
        >
          ← zpět
        </button>
        <div
          v-if="step === 3 && confirming"
          role="alert"
          class="flex flex-[1_1_100%] flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[14px] bg-red-light px-3.5 py-3"
        >
          <span class="flex-[1_1_260px] text-[15.5px] text-[#7A2E1A]">
            Opravdu odeslat {{ emailsLabel(toEmail.length) }} a vyprázdnit listinu? Tohle nejde vzít
            zpět.
          </span>
          <button
            type="button"
            class="cursor-pointer rounded-full border-0 bg-paper px-4 py-[9px] text-[15px] text-ink"
            @click="confirming = false"
          >
            Ještě ne
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-full border-0 bg-[#B4462B] px-[18px] py-[9px] text-[15px] font-medium text-paper"
            @click="send"
          >
            Ano, odeslat
          </button>
        </div>
        <button
          v-if="step < 3 || (step === 3 && !confirming) || (step === 4 && !sending)"
          type="button"
          class="ml-auto cursor-pointer rounded-full border-0 px-6 py-3 text-[16px] font-medium text-cream"
          :class="step === 3 ? 'bg-red hover:bg-[#a53d22]' : 'bg-green hover:bg-green-hover'"
          @click="step === 3 ? (confirming = true) : step === 4 ? $emit('close') : step++"
        >
          {{
            step === 1
              ? 'Začít'
              : step === 2
                ? 'Pokračovat na e-mail'
                : step === 3
                  ? `Odeslat ${emailsLabel(toEmail.length)}`
                  : failed
                    ? 'Zavřít'
                    : 'Hotovo'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes sending {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(300%);
  }
}
</style>
