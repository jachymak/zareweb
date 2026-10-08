<script setup>
import { computed, ref } from 'vue'
import { troopTag } from '@/components/admin/accounts'
import { formatDate } from '@/components/waitlist/waitlistText'
import { displayPhone } from '@shared/contacts'
import { hasContacts, telHref } from './directoryText'

// One child (with its parents), leader or shared contact („ostatní“, with
// „upravit“) in the directory — SPEC §4.10. On a
// phone folded to the name (a tap opens it), on wider screens always open.
// While saving contacts one by one, it has „uložit“.
const props = defineProps({
  entry: { type: Object, required: true },
  canImport: { type: Boolean, default: false }, // admin: a link to the export import
  saving: { type: Boolean, default: false },
})
defineEmits(['save', 'edit'])

const open = ref(false)
// Under the name: full name and troop, „vedoucí“, or who a shared contact is.
const subtitle = computed(() => {
  const e = props.entry
  if (e.kind === 'child') return `${e.firstName} ${e.lastName} · ${troopTag(e.troop)}`
  if (e.kind === 'leader') return `${e.name} · vedoucí`
  return [e.description, 'ostatní'].filter(Boolean).join(' · ')
})
// Contact lines with something in them: [{ label, name, phones, emails }]
const lines = computed(() => {
  const e = props.entry
  const all =
    e.kind !== 'child'
      ? [
          {
            label: null,
            name: null,
            phones: [e.phone].filter(Boolean),
            emails: [e.email].filter(Boolean),
          },
        ]
      : [
          ...e.parents.map((p) => ({
            label: p.label ?? 'rodič',
            name: p.name,
            phones: [p.phone].filter(Boolean),
            emails: [p.email].filter(Boolean),
          })),
          { label: 'dítě', name: null, phones: e.own.phones, emails: e.own.emails },
        ]
  return all.filter((l) => l.phones.length || l.emails.length)
})
const empty = computed(() => !hasContacts(props.entry))
</script>

<template>
  <li
    class="flex gap-3 rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-3.5 py-2.5 sm:px-[18px] sm:py-3"
    data-testid="directory-row"
  >
    <div class="min-w-0 flex-1">
      <h3 class="m-0 text-[14.5px] font-normal">
        <button
          type="button"
          class="flex w-full cursor-pointer items-baseline gap-x-2 border-0 bg-transparent p-0 text-left sm:pointer-events-none"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
            <span class="font-hand text-[23px] leading-[1.1] font-bold text-ink">
              {{ entry.display }}
            </span>
            <span class="text-[#8a7b5e]">
              {{ subtitle }}
            </span>
          </span>
          <span class="flex-none text-green sm:hidden" aria-hidden="true">
            {{ open ? '▴' : '▾' }}
          </span>
        </button>
      </h3>

      <div :class="open ? '' : 'hidden sm:block'" data-testid="directory-details">
        <p v-if="empty" class="m-0 mt-1 text-[14.5px] text-muted-2">
          kontakty chybí<template v-if="canImport && entry.kind === 'child'">
            —
            <RouterLink :to="{ path: '/vedouci/administrace', query: { zalozka: 'skautis' } }"
              >nahraj export ze skautISu</RouterLink
            ></template
          >
        </p>
        <ul
          v-else
          class="m-0 mt-2 grid list-none gap-2.5 p-0 text-[15px] sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]"
        >
          <li
            v-for="(line, i) in lines"
            :key="i"
            class="min-w-0 border-l-[3px] pl-3"
            :class="line.label === 'dítě' ? 'border-green/40' : 'border-gold-light'"
            data-testid="directory-person"
          >
            <p v-if="line.label" class="m-0 text-[14px] text-muted-2">
              <b class="font-semibold tracking-wide text-brown uppercase">{{ line.label }}</b
              ><template v-if="line.name"> · {{ line.name }}</template>
            </p>
            <p class="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <a v-for="phone in line.phones" :key="phone" :href="telHref(phone)" class="text-ink">
                {{ displayPhone(phone) }}
              </a>
              <a
                v-for="email in line.emails"
                :key="email"
                :href="`mailto:${email}`"
                class="break-all"
              >
                {{ email }}
              </a>
            </p>
          </li>
        </ul>
        <p v-if="entry.birthDate" class="m-0 mt-2 text-[14px] text-muted-2">
          narozeniny {{ formatDate(entry.birthDate) }}
        </p>
        <p
          v-if="entry.kind === 'other'"
          class="m-0 mt-2 flex flex-wrap items-baseline gap-x-3 text-[14px] text-muted-2"
        >
          <span v-if="entry.createdByName">přidal(a) {{ entry.createdByName }}</span>
          <button
            v-if="!saving"
            type="button"
            class="btn-link py-0 text-[14px]"
            :aria-label="`upravit ${entry.display}`"
            @click="$emit('edit')"
          >
            upravit
          </button>
        </p>
      </div>
    </div>
    <button
      v-if="saving && !empty"
      type="button"
      class="btn-outline flex-none self-start px-3.5 py-1.5 text-[14.5px]"
      :aria-label="`uložit ${entry.display} do telefonu`"
      @click="$emit('save')"
    >
      uložit
    </button>
  </li>
</template>
