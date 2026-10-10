<script setup>
import { computed, ref } from 'vue'
import { CONTACT_GROUP_NAMES } from '@/constants/troops'
import LeaderCard from './LeaderCard.vue'
import PillSwitch from './PillSwitch.vue'
import SectionHeading from './SectionHeading.vue'

// „Vedoucí“ — contact cards by group (contactCard in @shared/contacts). The
// group's contact person comes first, highlighted (same card), so parents know whom to
// write to; a missing phone or e-mail is simply not shown.
const props = defineProps({
  contacts: { type: Array, required: true }, // [{ id, group, primary, photoUrl, nickname, name, roleTitle, phone, email }]
  initialGroup: { type: String, default: 'vlc' },
})

const GROUPS = Object.entries(CONTACT_GROUP_NAMES).map(([value, label]) => ({ value, label }))
const TILTS = [-1.6, 1.4, -1, 1.8, -1.3, 1.1]

const group = ref(props.initialGroup)
const visible = computed(() => props.contacts.filter((c) => c.group === group.value))
// the contact person first
const ordered = computed(() => [
  ...visible.value.filter((c) => c.primary),
  ...visible.value.filter((c) => !c.primary),
])
</script>

<template>
  <section aria-labelledby="leaders-title">
    <SectionHeading id="leaders-title" kicker="na koho se obrátit" title="Vedoucí">
      <PillSwitch v-model="group" :options="GROUPS" label="Skupina vedoucích" />
    </SectionHeading>
    <p v-if="!visible.length" class="m-0 text-[16px] text-muted">Tady zatím nikdo není.</p>
    <ul
      class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-[18px] p-0 pt-4"
    >
      <li
        v-for="(contact, i) in ordered"
        :key="contact.id"
        :class="
          contact.primary &&
          'relative rounded-2xl border-[1.5px] border-[#cfe0cf] bg-green-light p-2.5'
        "
        :data-testid="contact.primary ? 'primary-contact' : null"
      >
        <p
          v-if="contact.primary"
          class="absolute -top-[15px] right-3 m-0 rounded-full border-[1.5px] border-[#cfe0cf] bg-green-light px-2.5 text-[13.5px] leading-[24px] whitespace-nowrap text-muted"
        >
          <span class="font-hand text-[19px] font-bold text-green">kontaktní osoba</span>
        </p>
        <LeaderCard :contact="contact" :tilt="TILTS[i % TILTS.length]" />
      </li>
    </ul>
  </section>
</template>
