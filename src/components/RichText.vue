<script setup>
import { computed, h } from 'vue'
import { parseRichText } from '@shared/richText'

// A leader's text with <b>, <i> and <a href> rendered (SPEC §4.4); everything else
// stays text. Put it in an element with `whitespace-pre-line` to keep line breaks.
// The optional `text` slot renders the plain parts (e.g. marked placeholders).
const props = defineProps({
  text: { type: String, required: true },
})
const slots = defineSlots()

const nodes = computed(() => parseRichText(props.text))

const render = (list) =>
  list.map((n) => {
    if (typeof n === 'string') return slots.text ? slots.text({ text: n }) : n
    if (n.tag !== 'a') return h(n.tag, render(n.children))
    return h('a', { href: n.href, target: '_blank', rel: 'noopener' }, render(n.children))
  })
const Nodes = () => render(nodes.value)
</script>

<template>
  <Nodes />
</template>
