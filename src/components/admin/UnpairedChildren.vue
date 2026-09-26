<script setup>
import { computed } from 'vue'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { childName } from './accounts'

// „Děti bez účtu“ — active children no parent account is paired with, with
// their parents' contacts from skautIS, so the admin knows whom to ask to
// create an account.
const props = defineProps({
  children: { type: Array, required: true }, // members
  parentContacts: { type: Object, required: true }, // { memberId: [{ name, email, phone }] }
})

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
      nevidí docházku ani nemůžou přihlašovat na akce. Kontakty jsou ze skautISu.
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
