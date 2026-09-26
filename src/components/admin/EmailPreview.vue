<script setup>
import { computed } from 'vue'
import { EMAIL_FROM } from '@shared/emails'

// An automated e-mail as parents get it, with the placeholders marked where
// they are filled in (sample value, the description in a tooltip).
const props = defineProps({
  template: { type: Object, required: true }, // { subject, body }
  placeholders: { type: Object, required: true }, // { name: description } (EMAILS[key])
  samples: { type: Object, default: () => ({}) }, // { name: sample value }
})

const PART = /(\{\p{L}+\})/u

// Text → text and placeholder parts.
const parts = (text) =>
  text
    .split(PART)
    .filter(Boolean)
    .map((part) => {
      const name = part.slice(1, -1)
      return PART.test(part) && name in props.placeholders
        ? { fill: props.samples[name] ?? props.placeholders[name], tip: props.placeholders[name] }
        : { text: part }
    })

// Paragraphs → lines → parts.
const paragraphs = computed(() =>
  props.template.body
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => p.split('\n').map(parts)),
)
const subject = computed(() => parts(props.template.subject))
</script>

<template>
  <div class="overflow-hidden rounded-xl border-[1.5px] border-line-soft bg-paper">
    <dl
      class="m-0 grid grid-cols-[70px_1fr] gap-x-2.5 gap-y-1.5 border-b border-sand px-4 py-3 text-[14.5px]"
    >
      <dt class="text-muted-2">Od</dt>
      <dd class="m-0 break-words text-ink">{{ EMAIL_FROM }}</dd>
      <dt class="text-muted-2">Předmět</dt>
      <dd class="m-0 font-semibold break-words text-ink" data-testid="preview-subject">
        <template v-for="(part, k) in subject" :key="k">
          <span
            v-if="part.fill"
            :title="part.tip"
            class="rounded-[5px] bg-gold-light px-1.5 py-px"
            >{{ part.fill }}</span
          >
          <template v-else>{{ part.text }}</template>
        </template>
      </dd>
    </dl>
    <div class="flex flex-col gap-3 px-[18px] pt-4 pb-[18px] text-[15.5px] leading-[1.65] text-ink">
      <p v-for="(lines, i) in paragraphs" :key="i" class="m-0 break-words">
        <template v-for="(line, j) in lines" :key="j">
          <br v-if="j" />
          <template v-for="(part, k) in line" :key="k">
            <span
              v-if="part.fill"
              :title="part.tip"
              class="rounded-[5px] bg-gold-light px-1.5 py-px"
              >{{ part.fill }}</span
            >
            <template v-else>{{ part.text }}</template>
          </template>
        </template>
      </p>
    </div>
  </div>
</template>
