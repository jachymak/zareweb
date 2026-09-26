<script setup>
import { computed } from 'vue'
import { RENEWAL_EMAIL_FROM } from '@shared/renewalEmail'

// Reset step 3: the renewal e-mail as parents get it, with the child's name
// and the link marked where they are filled in.
const props = defineProps({
  template: { type: Object, required: true }, // { subject, body }
  childName: { type: String, required: true },
})

// Paragraphs → lines → text and placeholder parts.
const paragraphs = computed(() =>
  props.template.body.split(/\n\s*\n/).map((p) =>
    p.split('\n').map((line) =>
      line
        .split(/(\{dite\}|\{odkaz\})/)
        .filter(Boolean)
        .map((part) =>
          part === '{dite}'
            ? { fill: props.childName, tip: 'Doplní se jméno dítěte' }
            : part === '{odkaz}'
              ? { fill: 'odkaz na potvrzení', tip: 'Doplní se odkaz pro obnovu zájmu' }
              : { text: part },
        ),
    ),
  ),
)
</script>

<template>
  <div class="overflow-hidden rounded-xl border-[1.5px] border-line-soft bg-paper">
    <dl
      class="m-0 grid grid-cols-[70px_1fr] gap-x-2.5 gap-y-1.5 border-b border-sand px-4 py-3 text-[14.5px]"
    >
      <dt class="text-muted-2">Od</dt>
      <dd class="m-0 break-words text-ink">{{ RENEWAL_EMAIL_FROM }}</dd>
      <dt class="text-muted-2">Předmět</dt>
      <dd class="m-0 font-semibold text-ink">{{ template.subject }}</dd>
    </dl>
    <div class="flex flex-col gap-3 px-[18px] pt-4 pb-[18px] text-[15.5px] leading-[1.65] text-ink">
      <p v-for="(lines, i) in paragraphs" :key="i" class="m-0">
        <template v-for="(parts, j) in lines" :key="j">
          <br v-if="j" />
          <template v-for="(part, k) in parts" :key="k">
            <span
              v-if="part.fill"
              :title="part.tip"
              class="rounded-[5px] bg-gold-light px-1.5 py-px whitespace-nowrap"
              >{{ part.fill }}</span
            >
            <template v-else>{{ part.text }}</template>
          </template>
        </template>
      </p>
    </div>
  </div>
</template>
