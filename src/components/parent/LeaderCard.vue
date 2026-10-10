<script setup>
import { nicknameOf } from '@shared/names'

// One leader's card in „Vedoucí“: photo, nickname, name · role, phone, e-mail.
const props = defineProps({
  contact: { type: Object, required: true }, // contactCard in @shared/contacts
  tilt: { type: Number, default: 0 },
})

// „Theodor Mikolajek · vedoucí oddílu“ (the name only when the heading is the nickname)
const subtitle = [nicknameOf(props.contact) !== props.contact.name && props.contact.name]
  .concat(props.contact.roleTitle)
  .filter(Boolean)
  .join(' · ')

const telHref = (phone) => `tel:${phone.replace(/\s+/g, '')}`
</script>

<template>
  <div class="flex items-start gap-[13px]">
    <div
      class="flex-none bg-paper px-1.5 pt-1.5 pb-[5px] shadow-[0_6px_14px_rgba(34,48,31,.1)]"
      :style="{ rotate: `${tilt}deg` }"
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
        {{ nicknameOf(contact) }}
      </h3>
      <p class="m-0 mb-[5px] text-[14.5px] text-muted">{{ subtitle }}</p>
      <p v-if="contact.phone" class="m-0 text-[15px]">
        <a :href="telHref(contact.phone)" class="text-ink">{{ contact.phone }}</a>
      </p>
      <p v-if="contact.email" class="m-0 text-[15px] break-words">
        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
      </p>
    </div>
  </div>
</template>
