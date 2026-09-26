<script setup>
import { onMounted, ref } from 'vue'
import { getEmailSettings } from '@/services/settings'
import EmailTemplateForm from './EmailTemplateForm.vue'

// „E-maily k akcím“ — SPEC §4.8: e-mails to parents of the children who can
// join, when leaders start the registration or publish the poster (sent once
// per event by the onEventUpdated function; only logged until SMTP exists).
defineEmits(['open-tab'])

const SAMPLES = {
  dite: 'Sojka a Bobr',
  akce: 'Výprava na Blaník',
  termin: '12.–14. 3. 2027',
  uzaverka: '5. 3. 2027',
  prihlasovani: 'Přihlásit můžete na webu oddílu do 5. 3. 2027: odkaz na přihlašování',
  odkaz: 'odkaz',
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
  <section aria-labelledby="event-emails-title">
    <h2 id="event-emails-title" class="sr-only">E-maily k akcím</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Web je posílá sám rodičům dětí, které můžou na akci jet (na rodičovské účty i na kontakty ze
      skautISu, na každou adresu jednou). Ke každé akci přijde každý z nich nejvýš jednou.
    </p>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="loading" class="font-hand text-2xl text-muted">načítám…</p>

    <div v-else class="flex flex-col gap-3.5">
      <EmailTemplateForm
        email-key="registrationOpened"
        :stored="stored.registrationOpened"
        title="Spuštěné přihlašování"
        description="Přijde, když vedoucí u akce spustí přihlašování (pokud zároveň nezveřejní plakátek — pak přijde jen e-mail o plakátku)."
        :samples="SAMPLES"
      />
      <EmailTemplateForm
        email-key="posterPublished"
        :stored="stored.posterPublished"
        title="Zveřejněný plakátek"
        description="Přijde, když vedoucí poprvé zveřejní plakátek. Když na akci běží přihlašování, připomene ho ({prihlasovani}); jinak se ten odstavec vynechá."
        :samples="SAMPLES"
      />
    </div>
  </section>
</template>
