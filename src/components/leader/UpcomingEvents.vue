<script setup>
import AudienceTag from '@/components/parent/AudienceTag.vue'
import SectionHeading from '@/components/parent/SectionHeading.vue'
import {
  daysLeftText,
  daysUntil,
  formatDay,
  formatRange,
  organizerNames,
  plural,
} from '@/components/parent/parentText'
import { eventEditorLink, tripLink } from './leaderText'

// Upcoming events with registration: how many eligible children signed up and
// who, the deadline, the poster, and the name list with payments (SPEC §4.1).
const props = defineProps({
  items: { type: Array, required: true }, // [{ event, organizers, signedUp, signedUpNames, eligible }]
  troop: { type: String, required: true }, // attendance troop for events of everyone
  today: { type: String, required: true },
})

const SHOWN_NAMES = 6

const daysLeft = (event) => daysUntil(event.registrationDeadline, props.today)

// „Sojka, Liška, Bobr + 7 dalších“
function namesText(names) {
  if (!names.length) return 'zatím nikdo'
  const shown = names.slice(0, SHOWN_NAMES).join(', ')
  const rest = names.length - SHOWN_NAMES
  return rest > 0 ? `${shown} + ${rest} ${plural(rest, 'další', 'další', 'dalších')}` : shown
}
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
      <!-- On a phone: date, tag, count and poster on one line, the title below. -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4 sm:gap-y-2">
        <span
          class="font-hand text-[21px] leading-[1.1] font-bold text-ink sm:min-w-[92px] sm:text-[23px]"
        >
          {{ formatRange(item.event.startDate, item.event.endDate) }}
        </span>
        <AudienceTag :audience="item.event.audience" />
        <span
          class="order-last flex min-w-0 basis-full flex-wrap items-baseline gap-x-2.5 gap-y-0.5 sm:order-none sm:flex-[1_1_180px] sm:basis-auto"
        >
          <span class="text-[18px] font-medium text-ink">{{ item.event.title }}</span>
          <span v-if="item.organizers.length" class="hidden text-[14.5px] text-[#8a7b5e] sm:inline">
            vede {{ organizerNames(item.organizers) }}
          </span>
        </span>
        <span
          class="ml-auto font-hand text-[20px] font-bold whitespace-nowrap text-green sm:ml-0 sm:text-[22px]"
          data-testid="signed-up"
          :title="`přihlášeno ${item.signedUp} z ${item.eligible} dětí, které můžou jet`"
        >
          {{ item.signedUp }} / {{ item.eligible }}
        </span>
        <RouterLink
          v-if="item.event.posterStatus === 'published'"
          :to="{ name: 'event-poster', params: { eventId: item.event.id } }"
          class="inline-block flex-none -rotate-[1.4deg] border-[1.5px] border-ink bg-gold-light px-2.5 py-0.5 font-hand text-[18px] font-bold text-ink no-underline hover:text-ink sm:px-3 sm:py-1 sm:text-[20px]"
        >
          plakátek
        </RouterLink>
        <RouterLink
          v-else
          :to="eventEditorLink(item.event.id)"
          class="inline-block flex-none -rotate-[1.4deg] border-[1.5px] border-dashed border-red px-2.5 py-0.5 font-hand text-[17px] font-bold text-red no-underline sm:px-3 sm:py-1 sm:text-[19px]"
        >
          <span class="sm:hidden">+ plakátek</span>
          <span class="hidden sm:inline">vyplnit plakátek</span>
        </RouterLink>
      </div>
      <div
        class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed border-line-soft pt-2.5"
      >
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            class="rounded-full px-2.5 py-0.5 text-[14px] whitespace-nowrap"
            :class="daysLeft(item.event) < 0 ? 'bg-[#efe9da] text-muted' : 'bg-gold-light text-ink'"
            data-testid="deadline"
          >
            {{
              daysLeft(item.event) < 0
                ? 'přihlašování skončilo'
                : `přihlášky do ${formatDay(item.event.registrationDeadline)}`
            }}
          </span>
          <span
            v-if="daysLeft(item.event) >= 0"
            class="font-hand text-[19px] leading-none font-bold whitespace-nowrap"
            :class="daysLeft(item.event) <= 2 ? 'text-red' : 'text-brown'"
          >
            {{ daysLeftText(item.event.registrationDeadline, today) }}
          </span>
        </span>
        <span class="min-w-0 flex-[1_1_160px] text-[14.5px]">
          <span class="text-[#8a7b5e]">přihlášení: </span>
          <span
            :class="item.signedUpNames.length ? 'font-medium text-ink' : 'text-[#8a7b5e]'"
            data-testid="signed-up-names"
            :title="item.signedUpNames.join(', ') || undefined"
          >
            {{ namesText(item.signedUpNames) }}
          </span>
        </span>
        <RouterLink
          :to="tripLink(item.event.audience === 'all' ? troop : item.event.audience, item.event.id)"
          class="py-1 text-[14.5px] whitespace-nowrap sm:ml-auto"
        >
          <span class="hidden sm:inline">jmenný </span>seznam a platby →
        </RouterLink>
      </div>
    </article>
  </section>
</template>
