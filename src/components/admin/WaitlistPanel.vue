<script setup>
import { onMounted, ref } from 'vue'
import { useWaitlistAdmin } from '@/composables/useWaitlistAdmin'
import { getEmailSettings } from '@/services/settings'
import ResetExplanation from '@/components/waitlistAdmin/ResetExplanation.vue'
import ResetWizard from '@/components/waitlistAdmin/ResetWizard.vue'
import { formatDate, resetDoneText } from '@/components/waitlistAdmin/waitlistAdminText'
import CollapsibleSection from './CollapsibleSection.vue'
import EmailTemplateForm from './EmailTemplateForm.vue'
import WaitlistAgesForm from './WaitlistAgesForm.vue'

// „Čekací listina“ — SPEC §4.8: the annual reset (SPEC §4.6), the texts of
// the renewal and confirmation e-mails and the age limits. Leaders see the
// list itself on /vedouci/cekaci-listina.
defineEmits(['open-tab'])

const w = useWaitlistAdmin()
const wizardOpen = ref(false)
const lastResult = ref(null)
function resetDone(result) {
  lastResult.value = result
  w.resetDone(result.date)
}

const emailsLoaded = ref(false)
const emailsError = ref('')
const stored = ref({})
onMounted(async () => {
  try {
    stored.value = (await getEmailSettings()) ?? {}
  } catch (e) {
    console.error('Loading e-mail texts failed', e)
    emailsError.value = 'Texty e-mailů se nepodařilo načíst. Zkus stránku obnovit.'
  } finally {
    emailsLoaded.value = true
  }
})
</script>

<template>
  <section aria-labelledby="waitlist-title" class="flex flex-col gap-3.5">
    <h2 id="waitlist-title" class="sr-only">Čekací listina</h2>
    <p class="m-0 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Samotnou listinu vidí všichni vedoucí na stránce
      <RouterLink to="/vedouci/cekaci-listina">Čekací listina</RouterLink>. Tady je roční reset a
      nastavení.
    </p>

    <CollapsibleSection
      title="Reset listiny na další rok"
      :summary="`naposledy ${w.lastReset.value ? formatDate(w.lastReset.value) : 'zatím nikdy'}`"
      data-testid="reset"
    >
      <ResetExplanation />
      <div
        v-if="lastResult && !wizardOpen"
        role="status"
        class="mt-3.5 rounded-[14px] border-[1.5px] border-green bg-green-light px-4 py-3 text-[15.5px] text-ink"
      >
        {{ resetDoneText(lastResult) }}
      </div>
      <p v-if="w.loadError.value" role="alert" class="m-0 mt-3.5 text-red">
        Čekací listinu se nepodařilo načíst. Zkus stránku obnovit.
      </p>
      <button
        type="button"
        :disabled="w.loading.value || w.loadError.value"
        class="mt-4 flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-ink bg-cream px-4 py-[9px] text-[15px] text-ink hover:bg-gold-light disabled:cursor-default disabled:opacity-50"
        @click="wizardOpen = true"
      >
        <svg
          viewBox="0 0 24 24"
          class="block size-[17px]"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12 A8 8 0 1 0 6.5 6.2 M4 4 L4 8.5 L8.5 8.5" />
        </svg>
        Resetovat listinu na další rok
      </button>
    </CollapsibleSection>

    <p v-if="emailsError" role="alert" class="m-0 text-red">{{ emailsError }}</p>
    <template v-else-if="emailsLoaded">
      <EmailTemplateForm
        email-key="waitlistRenewal"
        :stored="stored.waitlistRenewal"
        title="E-mail při resetu — obnovení zájmu"
        description="Přijde při resetu rodičům dětí, které se do oddílu nedostaly. Bez odkazu rodiče zájem nepotvrdí."
        :samples="{ dite: 'Jan Novák', odkaz: 'odkaz na potvrzení' }"
      />
      <EmailTemplateForm
        email-key="waitlistConfirmation"
        :stored="stored.waitlistConfirmation"
        title="Potvrzení zápisu"
        description="Přijde každému, kdo na webu vyplní zápis na čekací listinu."
        :samples="{ dite: 'Jan Novák' }"
      />
    </template>

    <WaitlistAgesForm />

    <ResetWizard
      v-if="wizardOpen"
      :rows="w.rows.value"
      @close="wizardOpen = false"
      @done="resetDone"
    />
  </section>
</template>
