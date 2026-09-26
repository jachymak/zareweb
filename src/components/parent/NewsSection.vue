<script setup>
import { ref, useId } from 'vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import AudienceTag from './AudienceTag.vue'
import NewsLink from './NewsLink.vue'
import SectionHeading from './SectionHeading.vue'
import { formatTimestamp } from './parentText'

// „Aktuality“: the first item (pinned important, else newest) as a card,
// the rest as an accordion with one item open at a time.
defineProps({
  news: { type: Array, required: true },
})

const openId = ref(null)
const baseId = useId()
const toggle = (id) => (openId.value = openId.value === id ? null : id)
</script>

<template>
  <section aria-labelledby="news-title">
    <SectionHeading id="news-title" kicker="vzkazy od vedoucích" title="Aktuality" />

    <p v-if="!news.length" class="m-0 text-[16px] text-muted">Zatím tu nejsou žádné aktuality.</p>

    <template v-else>
      <HandDrawnBox
        stroke="var(--color-red)"
        class="mb-2 -rotate-[0.5deg] px-5 pt-5 pb-[22px] sm:px-6"
        data-testid="news-featured"
      >
        <article :aria-labelledby="`${baseId}-first`">
          <div class="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="font-hand text-[23px] font-bold text-red">
              {{ formatTimestamp(news[0].publishedAt) }}
            </span>
            <AudienceTag :audience="news[0].audience" />
            <span class="text-[14.5px] text-[#8a7b5e]">{{ news[0].authorName }}</span>
          </div>
          <h3 :id="`${baseId}-first`" class="m-0 mb-1.5 text-[19px] font-medium text-ink">
            {{ news[0].title }}
          </h3>
          <p
            class="m-0 max-w-[62ch] text-[16.5px] leading-[1.7] whitespace-pre-line text-pretty text-[#4b5749]"
          >
            {{ news[0].body }}
          </p>
          <NewsLink :item="news[0]" />
        </article>
      </HandDrawnBox>

      <div class="border-b border-[#e7dfcb]">
        <div v-for="item in news.slice(1)" :key="item.id" class="border-t border-[#e7dfcb]">
          <h3 class="m-0">
            <button
              type="button"
              :id="`${baseId}-${item.id}`"
              :aria-expanded="openId === item.id"
              :aria-controls="`${baseId}-${item.id}-body`"
              class="flex w-full cursor-pointer flex-wrap items-baseline gap-x-3.5 gap-y-0.5 border-0 bg-transparent px-0.5 py-[13px] text-left font-sans sm:flex-nowrap"
              @click="toggle(item.id)"
            >
              <span class="flex-none font-hand text-[21px] font-bold text-red">
                {{ formatTimestamp(item.publishedAt) }}
              </span>
              <AudienceTag :audience="item.audience" />
              <span
                class="order-last min-w-0 basis-full text-[17px] leading-[1.35] font-medium text-ink sm:order-none sm:flex-1 sm:basis-auto"
              >
                {{ item.title }}
              </span>
              <span class="ml-auto flex-none text-[14px] text-[#8a7b5e] sm:ml-0">
                {{ item.authorName }}
              </span>
              <span
                class="flex-none font-hand text-[25px] leading-none text-red"
                aria-hidden="true"
              >
                {{ openId === item.id ? '–' : '+' }}
              </span>
            </button>
          </h3>
          <div
            v-show="openId === item.id"
            :id="`${baseId}-${item.id}-body`"
            role="region"
            :aria-labelledby="`${baseId}-${item.id}`"
            class="px-0.5 pb-4"
          >
            <p
              class="m-0 max-w-[62ch] text-[16px] leading-[1.7] whitespace-pre-line text-pretty text-[#4b5749]"
            >
              {{ item.body }}
            </p>
            <NewsLink :item="item" />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
