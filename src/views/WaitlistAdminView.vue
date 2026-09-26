<script setup>
import { computed, ref, watch } from 'vue'
import { formatSchoolYear } from '@shared/schoolYear'
import { useWaitlistAdmin } from '@/composables/useWaitlistAdmin'
import { useAuthStore } from '@/stores/auth'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import { LOAD_ERROR } from '@/components/parent/parentText'
import ResetWizard from '@/components/waitlistAdmin/ResetWizard.vue'
import WaitlistFilters from '@/components/waitlistAdmin/WaitlistFilters.vue'
import WaitlistStats from '@/components/waitlistAdmin/WaitlistStats.vue'
import WaitlistTable from '@/components/waitlistAdmin/WaitlistTable.vue'
import {
  EMPTY_FILTERS,
  filterRows,
  hasFilters,
  nextSort,
  sortRows,
  toCsv,
} from '@/components/waitlistAdmin/waitlistRows'
import {
  CSV_COLUMNS,
  EMPTY_LIST,
  formatDate,
  NO_MATCH,
  resetDoneText,
} from '@/components/waitlistAdmin/waitlistAdminText'

// Waiting list management — SPEC §4.6: stats, filters, the sortable table
// with notes and deleting, CSV export and the annual reset (admins only;
// leaders see when it last happened).
const w = useWaitlistAdmin()
const isAdmin = computed(() => useAuthStore().role === 'admin')

const filters = ref({ ...EMPTY_FILTERS })
const sort = ref({ key: 'signedUp', dir: 1 })
const openId = ref(null)
watch(filters, () => (openId.value = null))

const shown = computed(() => sortRows(filterRows(w.rows.value, filters.value), sort.value))
const noteCount = computed(() => w.rows.value.filter((r) => r.note).length)
const maxWaitedMonths = computed(() => Math.max(0, ...w.rows.value.map((r) => r.waitedMonths)))
const schoolYearLabel = computed(() => formatSchoolYear(w.schoolYear.value))

function downloadCsv() {
  const blob = new Blob([toCsv(shown.value, CSV_COLUMNS)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `cekaci-listina-${w.today}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const wizardOpen = ref(false)
const lastResult = ref(null)
function resetDone(result) {
  lastResult.value = result
  w.resetDone(result.date)
}

const section = 'mx-auto max-w-[1180px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main :aria-busy="w.loading.value">
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1"
          >← zpět na vedoucovskou stránku</RouterLink
        >
      </p>
      <div class="mb-[22px] flex flex-wrap items-end justify-between gap-x-[30px] gap-y-4">
        <div>
          <p class="kicker m-0 -mb-0.5">zápisy z veřejného webu</p>
          <h1 class="m-0 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
            Čekací listina
          </h1>
        </div>
        <div
          class="flex flex-wrap items-center gap-3.5 rounded-[14px] border-[1.5px] border-dashed border-line-strong py-2.5 pr-3 pl-4"
        >
          <div class="flex flex-col">
            <span class="font-hand text-[20px] leading-[1.1] font-bold text-brown"
              >jednou za rok</span
            >
            <span class="text-[13px] text-muted-2" data-testid="last-reset">
              {{ isAdmin ? 'naposledy' : 'listina naposledy resetována' }}
              {{ w.lastReset.value ? formatDate(w.lastReset.value) : 'zatím nikdy' }}
            </span>
          </div>
          <button
            v-if="isAdmin"
            type="button"
            :disabled="w.loading.value || w.loadError.value"
            class="flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-ink bg-cream px-4 py-[9px] text-[15px] text-ink hover:bg-gold-light disabled:cursor-default disabled:opacity-50"
            @click="wizardOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              class="block size-[17px]"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12 A8 8 0 1 0 6.5 6.2 M4 4 L4 8.5 L8.5 8.5" />
            </svg>
            Resetovat listinu na další rok
          </button>
        </div>
      </div>

      <div
        v-if="lastResult && !wizardOpen"
        role="status"
        class="mb-[22px] rounded-[14px] border-[1.5px] border-green bg-green-light px-4 py-3 text-[15.5px] text-ink"
      >
        {{ resetDoneText(lastResult) }}
      </div>
    </div>

    <p v-if="w.loading.value" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="w.loadError.value" role="alert" :class="section" class="text-red">
      {{ LOAD_ERROR }}
    </p>
    <div v-else :class="section" class="pb-10">
      <WaitlistStats :stats="w.stats.value" class="mb-[30px]" />
      <WaitlistFilters
        v-model="filters"
        class="mb-3.5"
        :school-year-label="schoolYearLabel"
        :note-count="noteCount"
        :shown="shown.length"
        :total="w.rows.value.length"
        :filtered="hasFilters(filters)"
        @csv="downloadCsv"
        @clear="filters = { ...EMPTY_FILTERS }"
      />
      <WaitlistTable
        v-model:open-id="openId"
        :rows="shown"
        :sort="sort"
        :max-waited-months="maxWaitedMonths"
        :school-year-label="schoolYearLabel"
        :empty-text="w.rows.value.length ? NO_MATCH : EMPTY_LIST"
        @sort="sort = nextSort(sort, $event)"
      />
    </div>
  </main>
  <AreaFooter>
    <p class="m-0 text-[15px] sm:ml-auto">
      <RouterLink to="/vedouci" class="inline-block py-1"
        >zpět na vedoucovskou stránku →</RouterLink
      >
    </p>
  </AreaFooter>
  <ResetWizard
    v-if="isAdmin && wizardOpen"
    :rows="w.rows.value"
    :today="w.today"
    @close="wizardOpen = false"
    @done="resetDone"
  />
</template>
