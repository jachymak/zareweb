<script setup>
import { computed, ref } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { childName, formatDate } from './accounts'

// „Děti bez účtu“ — active children no parent account is paired with, with
// their parents' contacts from skautIS, so the admin knows whom to ask to
// create an account; „pozvat“ (confirmed in a second step) e-mails them
// which child it is about and a link to the login page.
const props = defineProps({
  children: { type: Array, required: true }, // members
  parentContacts: { type: Object, required: true }, // { memberId: [{ name, email, phone }] }
  invitedAt: { type: Object, default: () => ({}) }, // { lower-case e-mail: Timestamp }
  accountEmails: { type: Set, default: () => new Set() }, // lower-case e-mails with an account
  invitingEmail: { type: String, default: null },
  inviteErrors: { type: Object, default: () => ({}) }, // { lower-case e-mail: message }
})
const emit = defineEmits(['invite'])

const key = (email) => email.trim().toLowerCase()

// The parent e-mail whose invitation waits for confirmation.
const confirming = ref(null)
function send(email) {
  confirming.value = null
  emit('invite', email)
}

const sorted = computed(() =>
  [...props.children].sort(
    (a, b) => a.troop.localeCompare(b.troop) || a.lastName.localeCompare(b.lastName, 'cs'),
  ),
)
</script>

<template>
  <div>
    <p class="m-0 mb-3 max-w-[70ch] text-[15px] leading-normal text-muted">
      Těmhle dětem zatím žádný rodič nezaložil účet (nebo ho ještě nemáš spárovaný), takže rodiče
      nevidí docházku ani nemůžou přihlašovat na akce. Kontakty jsou ze skautISu. „Pozvat“ pošle
      rodiči e-mail, o které dítě jde a že si má na webu založit účet.
    </p>
    <ul v-if="sorted.length" class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="m in sorted"
        :key="m.id"
        class="rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3 sm:px-[18px]"
        data-testid="unpaired-child"
      >
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <b class="font-hand text-[20px] font-bold text-ink">{{ m.nickname || m.firstName }}</b>
          <span class="text-[15px] text-[#8a7b5e]">{{ childName(m) }}</span>
          <AudienceTag :audience="m.troop" />
        </div>
        <ul
          v-if="parentContacts[m.id]?.length"
          class="m-0 mt-1.5 flex list-none flex-col gap-1 p-0 text-[15px]"
        >
          <li
            v-for="(p, i) in parentContacts[m.id]"
            :key="i"
            class="flex flex-wrap gap-x-3 gap-y-0.5 break-words"
          >
            <span class="text-text">{{ p.name }}</span>
            <a v-if="p.email" :href="`mailto:${p.email}`" class="break-all">{{ p.email }}</a>
            <a v-if="p.phone" :href="`tel:${p.phone.replace(/\s/g, '')}`" class="whitespace-nowrap">
              {{ p.phone }}
            </a>
            <template v-if="p.email">
              <span v-if="accountEmails.has(key(p.email))" class="text-[14.5px] text-brown">
                má už účet
              </span>
              <span v-else class="flex flex-wrap items-baseline gap-x-2" data-testid="invite">
                <span v-if="invitedAt[key(p.email)]" class="text-[14.5px] text-brown">
                  pozváno {{ formatDate(invitedAt[key(p.email)]) }}
                </span>
                <button
                  type="button"
                  class="btn-link"
                  :aria-label="`Pozvat ${p.email}`"
                  :disabled="invitingEmail === key(p.email)"
                  @click="confirming = key(p.email)"
                >
                  {{
                    invitingEmail === key(p.email)
                      ? 'posílám…'
                      : invitedAt[key(p.email)]
                        ? 'poslat znovu'
                        : 'pozvat'
                  }}
                </button>
              </span>
              <div
                v-if="confirming === key(p.email)"
                class="mt-1 w-full rounded-[10px] border-[1.5px] border-green bg-[#e9f1ea] px-4 py-3"
                role="alertdialog"
                :aria-label="`Poslat pozvánku na ${p.email}`"
              >
                <p class="m-0 mb-2 text-[15px] leading-normal">
                  Poslat pozvánku na
                  <b class="font-medium break-words">{{ p.email }}</b>
                  ({{ p.name }})?
                </p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button
                    type="button"
                    class="cursor-pointer rounded-full border-0 bg-green px-5 py-2 text-[15px] font-medium text-cream"
                    @click="send(p.email)"
                  >
                    Ano, poslat
                  </button>
                  <button type="button" class="btn-link" @click="confirming = null">zrušit</button>
                </div>
              </div>
              <span v-if="inviteErrors[key(p.email)]" role="alert" class="w-full text-red">
                {{ inviteErrors[key(p.email)] }}
              </span>
            </template>
          </li>
        </ul>
        <p v-else class="m-0 mt-1.5 text-[14.5px] text-muted italic">
          Kontakt na rodiče ve skautISu chybí.
        </p>
      </li>
    </ul>
    <p v-else class="m-0 py-4 text-[15.5px] text-green">Všechny děti mají rodičovský účet ✓</p>
  </div>
</template>
