<script setup>
import { computed, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import LeaderPageTitle from '@/components/leader/LeaderPageTitle.vue'
import RichText from '@/components/RichText.vue'
import { GUIDES, GUIDES_NOTE } from '@/content/guides'

// Guides — SPEC §4.11: short how-tos as an accordion, one open at a time;
// the open one is kept in the URL (?navod=id) so it can be linked.
const route = useRoute()
const router = useRouter()
const baseId = useId()

const openId = computed(() => route.query.navod ?? null)
const toggle = (id) =>
  router.replace({ query: { ...route.query, navod: openId.value === id ? undefined : id } })

const section = 'mx-auto max-w-[1000px] px-4 sm:px-6'
const text = 'm-0 max-w-[62ch] text-[16px] leading-[1.7] text-pretty text-[#4b5749]'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-6 pb-4">
      <LeaderPageTitle kicker="jak na to" title="Návody" />
      <p class="note-warm mt-5 mb-0 max-w-[70ch] text-[15.5px] leading-normal" role="note">
        <RichText :text="GUIDES_NOTE" />
        <RouterLink to="/vedouci/administrace?zalozka=skautis" class="ml-1 whitespace-nowrap">
          otevřít Administraci →
        </RouterLink>
      </p>

      <div class="mt-6 border-b border-[#e7dfcb]">
        <div
          v-for="guide in GUIDES"
          :key="guide.id"
          class="border-t border-[#e7dfcb]"
          :data-testid="`guide-${guide.id}`"
        >
          <h2 class="m-0">
            <button
              type="button"
              :id="`${baseId}-${guide.id}`"
              :aria-expanded="openId === guide.id"
              :aria-controls="`${baseId}-${guide.id}-body`"
              class="flex w-full cursor-pointer items-baseline gap-3.5 border-0 bg-transparent px-0.5 py-[13px] text-left font-sans"
              @click="toggle(guide.id)"
            >
              <span class="min-w-0 flex-1 text-[17px] leading-[1.35] font-medium text-ink">
                {{ guide.title }}
              </span>
              <span
                class="flex-none font-hand text-[25px] leading-none text-red"
                aria-hidden="true"
              >
                {{ openId === guide.id ? '–' : '+' }}
              </span>
            </button>
          </h2>
          <div
            v-show="openId === guide.id"
            :id="`${baseId}-${guide.id}-body`"
            role="region"
            :aria-labelledby="`${baseId}-${guide.id}`"
            class="px-0.5 pb-5"
          >
            <p v-if="guide.intro" :class="text" class="mb-3"><RichText :text="guide.intro" /></p>
            <ol :class="text" class="flex list-decimal flex-col gap-2 pl-6">
              <li v-for="(step, i) in guide.steps" :key="i" class="pl-1">
                <RichText :text="step" />
              </li>
            </ol>
            <p v-if="guide.note" :class="text" class="mt-3 text-[15px] text-muted">
              <RichText :text="guide.note" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
  <AreaFooter />
</template>
