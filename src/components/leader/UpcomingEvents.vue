<script setup>
import AudienceTag from '@/components/parent/AudienceTag.vue'
import SectionHeading from '@/components/parent/SectionHeading.vue'
import { formatRange, organizerNames } from '@/components/parent/parentText'
import { eventEditorLink, tripLink } from './leaderText'

// Upcoming events with registration: how many eligible children signed up,
// the poster, and the name list with payments (SPEC §4.1).
defineProps({
  items: { type: Array, required: true }, // [{ event, organizers, signedUp, eligible }]
  troop: { type: String, required: true }, // attendance troop for events of everyone
})

const percent = ({ signedUp, eligible }) => (eligible ? Math.round((signedUp * 100) / eligible) : 0)
</script>

<template>
  <section aria-labelledby="upcoming-title">
    <SectionHeading id="upcoming-title" kicker="kdo se přihlásil" title="Nejbližší akce">
      <RouterLink to="/vedouci/akce" class="py-1 text-[15.5px]">
        přidat akci nebo plakátek →
      </RouterLink>
    </SectionHeading>

    <p v-if="!items.length" class="m-0 text-[16px] text-muted">
      Teď neběží přihlašování na žádnou akci.
    </p>
    <article
      v-for="item in items"
      :key="item.event.id"
      :aria-label="item.event.title"
      class="mb-[11px] rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3.5 sm:px-[18px]"
    >
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span class="min-w-[92px] font-hand text-[23px] leading-[1.1] font-bold text-ink">
          {{ formatRange(item.event.startDate, item.event.endDate) }}
        </span>
        <AudienceTag :audience="item.event.audience" />
        <span class="flex min-w-0 flex-[1_1_180px] flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span class="text-[18px] font-medium text-ink">{{ item.event.title }}</span>
          <span v-if="item.organizers.length" class="text-[14.5px] text-[#8a7b5e]">
            vede {{ organizerNames(item.organizers) }}
          </span>
        </span>
        <span
          class="font-hand text-[22px] font-bold whitespace-nowrap text-green"
          data-testid="signed-up"
          :title="`přihlášeno ${item.signedUp} z ${item.eligible} dětí, které můžou jet`"
        >
          {{ item.signedUp }} / {{ item.eligible }}
        </span>
        <RouterLink
          v-if="item.event.posterStatus === 'published'"
          :to="{ name: 'event-poster', params: { eventId: item.event.id } }"
          class="inline-block flex-none -rotate-[1.4deg] border-[1.5px] border-ink bg-gold-light px-3 py-1 font-hand text-[20px] font-bold text-ink no-underline hover:text-ink"
        >
          plakátek
        </RouterLink>
        <RouterLink
          v-else
          :to="eventEditorLink(item.event.id)"
          class="inline-block flex-none -rotate-[1.4deg] border-[1.5px] border-dashed border-red px-3 py-1 font-hand text-[19px] font-bold text-red no-underline"
        >
          vyplnit plakátek
        </RouterLink>
      </div>
      <div
        class="mt-[11px] flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-line-soft pt-2.5"
      >
        <span
          class="h-[9px] min-w-0 flex-[1_1_200px] overflow-hidden rounded-full bg-[#ede5d3]"
          role="progressbar"
          :aria-valuenow="item.signedUp"
          aria-valuemin="0"
          :aria-valuemax="item.eligible"
          aria-label="přihlášené děti"
        >
          <span class="block h-full bg-green" :style="{ width: `${percent(item)}%` }" />
        </span>
        <RouterLink
          :to="tripLink(item.event.audience === 'all' ? troop : item.event.audience, item.event.id)"
          class="py-1 text-[14.5px] whitespace-nowrap"
        >
          jmenný seznam a platby →
        </RouterLink>
      </div>
    </article>
  </section>
</template>
