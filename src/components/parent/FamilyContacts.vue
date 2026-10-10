<script setup>
import { computed, onMounted, ref, useId } from 'vue'
import { getChildContacts } from '@/services/members'
import { displayPhone } from '@shared/contacts'
import { parentEmails } from '@shared/skautisExport'
import { nicknameOf } from '@shared/names'

// The family's contacts from skautIS under the children cards (SPEC §3.1): one
// line where the troop's e-mails go (the parents' main e-mails and a child's
// own one the parents want mailed too — the web's e-mails and the conference), „kontakty +“ opens all of them. E-mails from a
// parent's note in skautIS are shown unmarked. Changes go through the web admin.
const props = defineProps({
  members: { type: Array, required: true },
  webAdmin: { type: Object, default: null }, // { name, email }
})

const id = useId()
const open = ref(false)
const contacts = ref(null) // [{ member, parents, own }]

onMounted(async () => {
  try {
    const list = await Promise.all(props.members.map((m) => getChildContacts(m.id)))
    contacts.value = props.members.map((member, i) => ({ member, ...list[i] }))
  } catch (e) {
    console.error('Loading the family contacts failed', e)
  }
})

const unique = (list) => [...new Map(list.map((x) => [x.toLowerCase(), x])).values()]
const mailed = computed(() =>
  unique(
    contacts.value.flatMap((c) => [
      ...c.parents.map((p) => p.email).filter(Boolean),
      ...c.own.mailedEmails,
    ]),
  ),
)
const isMailedOwn = (c, email) =>
  c.own.mailedEmails.some((m) => m.toLowerCase() === email.toLowerCase())
// A child without any parent e-mail in skautIS: the web's e-mails go to the account.
const toAccount = computed(() =>
  contacts.value.some((c) => !c.parents.some((p) => parentEmails(p).length)),
)

// Children with the same parents share one list (the usual case): [{ names, lines }],
// a line: { title, phones, emails: [{ value, mailed }] }.
const groups = computed(() => {
  const byParents = new Map()
  for (const c of contacts.value) {
    const key = JSON.stringify(c.parents)
    if (!byParents.has(key)) byParents.set(key, { parents: c.parents, children: [] })
    byParents.get(key).children.push(c)
  }
  return [...byParents.values()].map(({ parents, children }) => ({
    names: children.map((c) => nicknameOf(c.member)).join(', '),
    lines: [
      ...parents.map((p) => ({
        title: [p.label ?? 'rodič', p.name].filter(Boolean).join(' · '),
        phones: [p.phone].filter(Boolean),
        emails: parentEmails(p).map((value) => ({ value, mailed: value === p.email })),
      })),
      ...children.map((c) => ({
        title: `dítě · ${nicknameOf(c.member)}`,
        phones: c.own.phones,
        emails: c.own.emails.map((value) => ({ value, mailed: isMailedOwn(c, value) })),
      })),
    ].filter((l) => l.phones.length || l.emails.length),
  }))
})

const mailto = computed(
  () => `mailto:${props.webAdmin.email}?subject=${encodeURIComponent('Kontakty na web Záře')}`,
)
</script>

<template>
  <div
    v-if="contacts"
    class="mt-2 text-[15px] leading-normal text-muted"
    data-testid="family-contacts"
  >
    <p class="m-0 flex flex-wrap items-center gap-x-3">
      <span data-testid="mailed-to">
        e-maily od nás chodí na
        <template v-for="(email, i) in mailed" :key="email">
          <template v-if="i">, </template
          ><b class="font-medium break-words text-text">{{ email }}</b>
        </template>
        <template v-if="toAccount">{{ mailed.length ? ' a na ' : ' ' }}e-mail vašeho účtu</template>
      </span>
      <button
        type="button"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[15px] text-green"
        :aria-expanded="open"
        :aria-controls="`${id}-body`"
        @click="open = !open"
      >
        kontakty
        <span class="font-hand text-[23px] leading-none text-red" aria-hidden="true">
          {{ open ? '–' : '+' }}
        </span>
      </button>
    </p>
    <div
      v-show="open"
      :id="`${id}-body`"
      role="region"
      aria-label="Kontakty na vás"
      class="mt-1 max-w-[560px] rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3 text-[14.5px] sm:px-[18px]"
    >
      <div v-for="group in groups" :key="group.names" class="mb-3">
        <p v-if="groups.length > 1" class="m-0 mb-1 font-hand text-[20px] text-brown">
          {{ group.names }}
        </p>
        <ul v-if="group.lines.length" class="m-0 flex list-none flex-col gap-2.5 p-0">
          <li v-for="line in group.lines" :key="line.title">
            <span class="block font-medium text-ink">{{ line.title }}</span>
            <span v-for="phone in line.phones" :key="phone" class="block text-text">
              {{ displayPhone(phone) }}
            </span>
            <span
              v-for="email in line.emails"
              :key="email.value"
              class="flex flex-wrap items-center gap-x-2 gap-y-0.5"
            >
              <span class="break-words text-text">{{ email.value }}</span>
              <span
                v-if="email.mailed"
                class="rounded-full bg-cream px-2 py-px text-[13px] whitespace-nowrap text-green ring-1 ring-[#9cc0a8] ring-inset"
                data-testid="mailed"
              >
                ✉ chodí sem e-maily
              </span>
            </span>
          </li>
        </ul>
        <p v-else class="m-0">Kontakty na vás ve skautISu zatím nemáme.</p>
      </div>
      <p class="m-0">
        E-maily z webu i z oddílové konference chodí na adresy označené ✉. Chcete něco změnit?
        <template v-if="webAdmin?.email">
          Napište správci webu ({{ webAdmin.name }},
          <a :href="mailto" class="break-words">{{ webAdmin.email }}</a
          >), upraví to ve skautISu.
        </template>
        <template v-else>Napište nám, upravíme to ve skautISu.</template>
      </p>
    </div>
  </div>
</template>
