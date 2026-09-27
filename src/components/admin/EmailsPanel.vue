<script setup>
import { onMounted, ref } from 'vue'
import { getEmailSettings } from '@/services/settings'
import EmailTemplateForm from './EmailTemplateForm.vue'

// „E-maily“ — SPEC §4.8: texts of the automated e-mails about events (sent
// once per event by onEventUpdated to parents of the children who can join)
// and about accounts (onUserWritten, when the admin approves an account).
// Only logged until SMTP exists. Waiting-list e-mails are in „čekací listina“.
defineEmits(['open-tab'])

const EVENT_SAMPLES = {
  dite: 'Sojka a Bobr',
  akce: 'Výprava na Blaník',
  termin: '12.–14. 3. 2027',
  uzaverka: '5. 3. 2027',
  prihlasovani: 'Přihlásit můžete na webu oddílu do 5. 3. 2027: odkaz na přihlašování',
  odkaz: 'odkaz',
}
const ACCOUNT_SAMPLES = {
  deti: 'Přiřadili jsme k němu: Sojka (vlčušky) a Bobr (skauti a skautky).',
  dite: 'Sojka a Bobr',
  odkaz: 'odkaz na web',
}

const loading = ref(true)
const loadError = ref('')
const stored = ref({})

onMounted(async () => {
  try {
    stored.value = (await getEmailSettings()) ?? {}
  } catch (e) {
    console.error('Loading e-mail texts failed', e)
    loadError.value = 'Texty se nepodařilo načíst. Zkus stránku obnovit.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="loading" class="font-hand text-2xl text-muted">načítám…</p>

    <div v-else class="flex flex-col gap-8">
      <section aria-labelledby="event-emails-title">
        <h2 id="event-emails-title" class="m-0 mb-1 text-[19px] font-semibold text-ink">K akcím</h2>
        <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
          Web je posílá sám rodičům dětí, které můžou na akci jet (na rodičovské účty i na kontakty
          ze skautISu, na každou adresu jednou). Ke každé akci přijde každý z nich nejvýš jednou.
        </p>
        <div class="flex flex-col gap-3.5">
          <EmailTemplateForm
            email-key="registrationOpened"
            :stored="stored.registrationOpened"
            title="Spuštěné přihlašování"
            description="Přijde, když vedoucí u akce spustí přihlašování (pokud zároveň nezveřejní plakátek — pak přijde jen e-mail o plakátku)."
            :samples="EVENT_SAMPLES"
          />
          <EmailTemplateForm
            email-key="posterPublished"
            :stored="stored.posterPublished"
            title="Zveřejněný plakátek"
            description="Přijde, když vedoucí poprvé zveřejní plakátek. Když na akci běží přihlašování, připomene ho ({prihlasovani}); jinak se ten odstavec vynechá."
            :samples="EVENT_SAMPLES"
          />
        </div>
      </section>

      <section aria-labelledby="account-emails-title">
        <h2 id="account-emails-title" class="m-0 mb-1 text-[19px] font-semibold text-ink">
          K účtům
        </h2>
        <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
          O novém účtu, který čeká na schválení, přijde e-mail správcům — jakmile má poznámku, kdo
          to je. Ten text se neupravuje.
        </p>
        <div class="flex flex-col gap-3.5">
          <EmailTemplateForm
            email-key="accountApproved"
            :stored="stored.accountApproved"
            title="Schválený účet"
            description="Přijde, když účet poprvé schválíš — jako rodiče (s vybranými dětmi) nebo jako vedoucího. Rodičům vypíše přiřazené děti ({deti}); vedoucím se ten odstavec vynechá."
            :samples="ACCOUNT_SAMPLES"
          />
          <EmailTemplateForm
            email-key="parentInvitation"
            :stored="stored.parentInvitation"
            title="Pozvánka pro rodiče"
            description="Přijde rodiči, kterého pozveš z „děti bez účtu“ v záložce účty a párování. {dite} jsou jeho děti podle skautISu; odkaz vede na přihlášení na webu, kde si účet založí."
            :samples="ACCOUNT_SAMPLES"
          />
        </div>
      </section>
    </div>
  </div>
</template>
