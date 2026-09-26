import { nextTick, onMounted, ref, watch } from 'vue'

// Keeps the selected item (aria-pressed) of a horizontally scrollable strip in view.
export function useScrollToSelected(selection) {
  const strip = ref(null)
  const reveal = async () => {
    await nextTick()
    strip.value
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
  onMounted(reveal)
  watch(selection, reveal)
  return strip
}
