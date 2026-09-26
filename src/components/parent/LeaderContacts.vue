<script setup>
import { computed, ref } from 'vue'
import PillSwitch from './PillSwitch.vue'
import SectionHeading from './SectionHeading.vue'

// „Vedoucí“ — contact cards by group. Details come from skautIS; a missing
// phone or e-mail is simply not shown.
const props = defineProps({
  contacts: { type: Array, required: true }, // [{ id, group, photoUrl, person }]
  initialGroup: { type: String, default: 'vlc' },
})

const GROUPS = [
  { value: 'vlc', label: 'vlčušky' },
  { value: 'ss', label: 'skauti a skautky' },
  { value: 'other', label: 'ostatní' },
]
const TILTS = [-1.6, 1.4, -1, 1.8, -1.3, 1.1]

const group = ref(props.initialGroup)
const visible = computed(() => props.contacts.filter((c) => c.group === group.value))

const telHref = (phone) => `tel:${phone.replace(/\s+/g, '')}`
</script>

<template>
  <section aria-labelledby="leaders-title">
    <SectionHeading id="leaders-title" kicker="na koho se obrátit" title="Vedoucí">
      <PillSwitch v-model="group" :options="GROUPS" label="Skupina vedoucích" />
    </SectionHeading>
    <p v-if="!visible.length" class="m-0 text-[16px] text-muted">Tady zatím nikdo není.</p>
    <ul
      class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-[18px] p-0"
    >
      <li v-for="(contact, i) in visible" :key="contact.id" class="flex items-start gap-[13px]">
        <div
          class="flex-none bg-paper px-1.5 pt-1.5 pb-[5px] shadow-[0_6px_14px_rgba(34,48,31,.1)]"
          :style="{ rotate: `${TILTS[i % TILTS.length]}deg` }"
        >
          <img
            v-if="contact.photoUrl"
            :src="contact.photoUrl"
            alt=""
            loading="lazy"
            class="block aspect-[3/4] w-[68px] object-cover"
          />
          <div v-else class="aspect-[3/4] w-[68px] bg-sand" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h3 class="m-0 font-hand text-[23px] leading-[1.15] font-bold text-ink">
            {{ contact.person.nickname || contact.person.name }}
          </h3>
          <p class="m-0 mb-[5px] text-[14.5px] text-muted">
            {{ contact.person.name
            }}<template v-if="contact.person.roleTitle"> · {{ contact.person.roleTitle }}</template>
          </p>
          <p v-if="contact.person.phone" class="m-0 text-[15px]">
            <a :href="telHref(contact.person.phone)" class="text-ink">{{ contact.person.phone }}</a>
          </p>
          <p v-if="contact.person.email" class="m-0 text-[15px] break-words">
            <a :href="`mailto:${contact.person.email}`">{{ contact.person.email }}</a>
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
