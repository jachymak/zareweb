<script setup>
import { computed, ref } from 'vue'
import { troopTag } from '@/components/admin/accounts'
import { formatDate } from '@/components/waitlist/waitlistText'
import { displayPhone } from '@shared/contacts'
import { hasContacts, telHref } from './directoryText'

// One child (with its parents) or leader in the directory — SPEC §4.10. On a
// phone folded to the name (a tap opens it), on wider screens always open.
// While picking contacts to save, a checkbox selects it.
const props = defineProps({
  entry: { type: Object, required: true },
  canImport: { type: Boolean, default: false }, // admin: a link to the export import
  selecting: { type: Boolean, default: false },
})
const selected = defineModel('selected', { type: Boolean, default: false })

const open = ref(false)
const fullName = computed(() =>
  props.entry.kind === 'child'
    ? `${props.entry.firstName} ${props.entry.lastName}`
    : props.entry.name,
)
// Contact lines with something in them: [{ label, name, phones, emails }]
const lines = computed(() => {
  const e = props.entry
  const all =
    e.kind === 'leader'
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
    class="flex gap-3 rounded-[3px] border-[1.5px] bg-paper px-3.5 py-2.5 sm:px-[18px] sm:py-3"
    :class="selecting && selected ? 'border-green' : 'border-[#e2d9c2]'"
    data-testid="directory-row"
  >
    <input
      v-if="selecting"
      v-model="selected"
      type="checkbox"
      class="mt-1.5 size-5 flex-none accent-green"
      :disabled="empty"
      :aria-label="`vybrat ${entry.display}`"
    />
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
              {{ fullName }} · {{ entry.kind === 'leader' ? 'vedoucí' : troopTag(entry.troop) }}
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
      </div>
    </div>
  </li>
</template>
