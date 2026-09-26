<script setup>
import { computed } from 'vue'
import { TROOPS } from '@/constants/troops'

// Bar above the parent pages in the leaders' preview (SPEC §4.7): which child's
// parent the page is shown as, and the way back to the leader area.
const props = defineProps({
  members: { type: Array, default: null }, // active children to pick from; null = no picker
  shown: { type: Array, default: () => [] }, // children the parent sees (child + siblings)
})
const model = defineModel({ type: String, default: '' })

const byName = (a, b) => (a.nickname || a.firstName).localeCompare(b.nickname || b.firstName, 'cs')
const groups = computed(() =>
  TROOPS.map((t) => ({
    label: t.name,
    members: (props.members ?? []).filter((m) => m.troop === t.code).sort(byName),
  })).filter((g) => g.members.length),
)

const label = (m) => `${m.nickname || m.firstName} (${m.firstName} ${m.lastName})`
const siblings = computed(() =>
  props.shown
    .filter((m) => m.id !== model.value)
    .map((m) => m.nickname || m.firstName)
    .join(', '),
)
</script>

<template>
  <div class="bg-green text-cream" data-testid="preview-bar">
    <div
      class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6"
    >
      <span class="font-hand text-[21px] leading-none font-bold">náhled pro rodiče</span>
      <label v-if="members" class="flex min-w-0 items-center gap-2 text-[15px]">
        <span class="shrink-0">rodič dítěte</span>
        <select
          v-model="model"
          class="min-h-9 max-w-[62vw] min-w-0 cursor-pointer rounded-md border border-cream/60 bg-cream px-2 py-1 text-[15px] text-ink sm:max-w-none"
        >
          <option value="" disabled>vyber dítě…</option>
          <optgroup v-for="g in groups" :key="g.label" :label="g.label">
            <option v-for="m in g.members" :key="m.id" :value="m.id">{{ label(m) }}</option>
          </optgroup>
        </select>
      </label>
      <RouterLink
        to="/vedouci"
        class="inline-block py-1 text-[15px] font-medium text-cream underline-offset-4 sm:ml-auto"
      >
        ← zpět do sekce pro vedoucí
      </RouterLink>
    </div>
    <p
      v-if="members && model"
      class="mx-auto m-0 max-w-[1120px] px-4 pb-2.5 text-[14px] text-cream/85 sm:px-6"
    >
      Stránka vypadá přesně jako u rodiče<template v-if="siblings">
        (rodič vidí i {{ siblings }})</template
      >. Přihlašování si můžete vyzkoušet, ale nic se neuloží.
    </p>
  </div>
</template>
