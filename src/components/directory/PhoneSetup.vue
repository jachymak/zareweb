<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  carddavUrl,
  createPhonePassword,
  setPhoneGroups,
  subscribePhoneContacts,
} from '@/services/directory'
import PillSwitch from '@/components/parent/PillSwitch.vue'
import { formatDateTime } from '@/components/admin/skautisText'
import { PHONE_GROUPS } from '@shared/directory'
import { ANDROID_INSTALL, ANDROID_STEPS, DAVX5_RELEASES, IPHONE_STEPS } from './directoryText'

// „Přidat do telefonu“ — SPEC §4.10: the groups for the phone address book
// (CardDAV), the phone password and how to set up an iPhone / Android.
const auth = useAuthStore()
const uid = auth.user.uid

const settings = ref(null)
const loadError = ref(false)
const stop = subscribePhoneContacts(
  uid,
  (data) => (settings.value = data),
  (e) => {
    console.error('Loading phoneContacts failed', e)
    loadError.value = true
  },
)
onUnmounted(stop)

const groups = computed(() => settings.value?.groups ?? [])
const saveError = ref(false)
// Once the phone is set up, the groups show as a summary with „upravit výběr“.
const editingGroups = ref(false)
const showGroups = computed(() => editingGroups.value || !settings.value?.passwordSetAt)
const groupsText = computed(
  () =>
    PHONE_GROUPS.filter((g) => groups.value.includes(g.key))
      .map((g) => g.label)
      .join(', ') || 'nic — adresář v telefonu je prázdný',
)
const saved = ref(false)
let savedTimer = null
onUnmounted(() => clearTimeout(savedTimer))

async function toggle(key) {
  const next = groups.value.includes(key)
    ? groups.value.filter((g) => g !== key)
    : PHONE_GROUPS.map((g) => g.key).filter((g) => g === key || groups.value.includes(g))
  saveError.value = false
  try {
    await setPhoneGroups(uid, next)
    saved.value = true
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => (saved.value = false), 2500)
  } catch (e) {
    console.error('Saving phone groups failed', e)
    saveError.value = true
  }
}

const password = ref(null) // { password, user } right after creating it
const guideOpen = ref(false) // step 3, opened once there is a password to type in
const creating = ref(false)
const passwordError = ref(false)
const confirmNew = ref(false)
async function newPassword() {
  creating.value = true
  passwordError.value = false
  try {
    password.value = await createPhonePassword()
    confirmNew.value = false
    guideOpen.value = true
  } catch (e) {
    console.error('Creating the phone password failed', e)
    passwordError.value = true
  } finally {
    creating.value = false
  }
}
const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(password.value.password)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // The password stays shown to copy by hand.
  }
}

const url = carddavUrl()
const server = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
const system = ref('iphone')
const SYSTEMS = [
  { value: 'iphone', label: 'iPhone' },
  { value: 'android', label: 'Android' },
]
const user = computed(() => password.value?.user ?? auth.profile?.email ?? auth.user.email)
</script>

<template>
  <div data-testid="phone-setup">
    <section
      class="rounded-[3px] border-[1.5px] border-green bg-paper px-4 py-4 sm:px-[22px]"
      aria-labelledby="phone-sync-title"
    >
      <h2 id="phone-sync-title" class="m-0 text-[20px] font-medium text-ink">
        Mít v telefonu všechny a pořád aktuální
      </h2>
      <p class="m-0 mt-1 max-w-[65ch] text-[15px] leading-normal text-muted">
        Telefon si kontakty bere z webu a sám je aktualizuje: noví přibudou, kdo odejde, zmizí.
      </p>
      <p class="m-0 mt-1 max-w-[65ch] text-[15px] leading-normal text-muted">
        Mají ⚜️ před jménem, aby nesplývaly s tvými.
      </p>

      <p v-if="loadError" role="alert" class="m-0 mt-3 text-red">
        Nastavení se nepodařilo načíst. Obnov stránku.
      </p>
      <template v-else-if="settings">
        <h3 class="m-0 mt-4 text-[16.5px] font-semibold text-ink">1. Co chceš mít v telefonu</h3>
        <template v-if="showGroups">
          <ul class="m-0 mt-2 flex list-none flex-col gap-1.5 p-0" data-testid="phone-groups">
            <li v-for="g in PHONE_GROUPS" :key="g.key">
              <label class="flex cursor-pointer items-center gap-2.5 py-0.5 text-[15.5px]">
                <input
                  type="checkbox"
                  class="size-5 accent-green"
                  :checked="groups.includes(g.key)"
                  @change="toggle(g.key)"
                />
                {{ g.label }}
              </label>
            </li>
          </ul>
          <p class="m-0 mt-2 max-w-[65ch] text-[14.5px] text-muted-2">
            Výběr můžeš kdykoli změnit — ukládá se hned a telefon si ho při další synchronizaci
            stáhne sám. Nové heslo ani nic jiného není potřeba.
          </p>
          <p class="m-0 mt-1 flex flex-wrap items-center gap-x-4 text-[14.5px]">
            <span v-if="saved" role="status" class="text-green" data-testid="groups-saved">
              ✓ uloženo
            </span>
            <button
              v-if="settings.passwordSetAt"
              type="button"
              class="btn-link"
              @click="editingGroups = false"
            >
              hotovo
            </button>
          </p>
        </template>
        <p v-else class="m-0 mt-2 text-[15px] text-text" data-testid="groups-summary">
          V telefonu máš: <b class="font-medium text-ink">{{ groupsText }}</b>
          <button type="button" class="btn-link ml-2" @click="editingGroups = true">
            upravit výběr
          </button>
        </p>
        <p v-if="saveError" role="alert" class="m-0 mt-1 text-red">
          Nepodařilo se uložit. Zkus to znovu.
        </p>

        <h3 class="m-0 mt-5 text-[16.5px] font-semibold text-ink">2. Heslo pro telefon</h3>
        <div v-if="password" class="note-warm mt-2" data-testid="phone-password">
          <p class="m-0">
            Heslo: <b class="font-mono text-[16px] text-ink select-all">{{ password.password }}</b>
            <button type="button" class="btn-link ml-2 py-0" @click="copy">
              {{ copied ? 'zkopírováno' : 'zkopírovat' }}
            </button>
          </p>
          <p class="m-0 mt-1">
            Ukážu ho jen teď. Když ho zapomeneš, vytvoř si nové (staré pak přestane fungovat).
          </p>
        </div>
        <p v-else-if="settings.passwordSetAt" class="m-0 mt-2 text-[15px] text-text">
          Heslo máš vytvořené {{ formatDateTime(settings.passwordSetAt) }}.
          <template v-if="!confirmNew">
            <button type="button" class="btn-link ml-1" @click="confirmNew = true">
              vytvořit nové heslo
            </button>
          </template>
          <span v-else class="mt-1 flex flex-wrap items-center gap-x-4">
            <span class="text-muted">Telefony se starým heslem přestanou kontakty načítat.</span>
            <button type="button" class="btn-link" :disabled="creating" @click="newPassword">
              {{ creating ? 'vytvářím…' : 'ano, nové heslo' }}
            </button>
            <button type="button" class="btn-link" @click="confirmNew = false">zrušit</button>
          </span>
        </p>
        <button
          v-else
          type="button"
          class="btn-outline mt-2 px-4 py-2 text-[15px]"
          :disabled="creating"
          @click="newPassword"
        >
          {{ creating ? 'vytvářím…' : 'vytvořit heslo pro telefon' }}
        </button>
        <p v-if="passwordError" role="alert" class="m-0 mt-1 text-red">
          Heslo se nepodařilo vytvořit. Zkus to znovu.
        </p>

        <details
          class="mt-5"
          :open="guideOpen"
          @toggle="guideOpen = $event.target.open"
          data-testid="phone-guide"
        >
          <summary class="cursor-pointer text-[16.5px] font-semibold text-ink">
            3. Nastav telefon
          </summary>
          <dl class="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
            <dt class="text-muted-2">{{ system === 'iphone' ? 'server' : 'adresa' }}</dt>
            <dd class="m-0 font-mono break-all text-ink select-all" data-testid="carddav-url">
              {{ system === 'iphone' ? server : url }}
            </dd>
            <dt class="text-muted-2">uživatel</dt>
            <dd class="m-0 font-mono break-all text-ink select-all">{{ user }}</dd>
            <dt class="text-muted-2">heslo</dt>
            <dd class="m-0 text-ink">to z kroku 2</dd>
          </dl>
          <PillSwitch v-model="system" :options="SYSTEMS" label="Telefon" class="mt-3" />
          <div class="max-w-[65ch] text-[15px] leading-normal" data-testid="phone-steps">
            <template v-if="system === 'android'">
              <p class="m-0 mt-3 font-semibold text-ink">
                Nejdřív nainstaluj aplikaci DAVx⁵ — jedním z těchto způsobů:
              </p>
              <div v-for="way in ANDROID_INSTALL" :key="way.title" class="mt-2">
                <p class="m-0 font-medium text-ink">
                  {{ way.title }}
                  <a
                    v-if="way.title.includes('GitHub')"
                    :href="DAVX5_RELEASES"
                    target="_blank"
                    rel="noopener"
                    class="ml-1 font-normal"
                    >otevřít stránku →</a
                  >
                </p>
                <ol class="m-0 mt-1 list-decimal space-y-1 pl-5">
                  <li v-for="(step, i) in way.steps" :key="i">{{ step }}</li>
                </ol>
              </div>
              <p class="m-0 mt-3 font-semibold text-ink">Pak ji nastav:</p>
            </template>
            <ol class="m-0 mt-2 list-decimal space-y-1 pl-5">
              <li v-for="(step, i) in system === 'iphone' ? IPHONE_STEPS : ANDROID_STEPS" :key="i">
                {{ step }}
              </li>
            </ol>
          </div>
        </details>
        <p class="m-0 mt-3 max-w-[65ch] text-[14.5px] text-muted-2">
          Kontakty v telefonu nejde měnit — úprava i smazání se při další synchronizaci vrátí. Koho
          chceš mít napořád, ulož si ho volbou „Uložit jednotlivě“.
        </p>
      </template>
      <p v-else class="m-0 mt-3 font-hand text-xl text-muted">načítám…</p>
    </section>
  </div>
</template>
