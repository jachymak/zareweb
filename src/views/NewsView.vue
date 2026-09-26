<script setup>
import { ref } from 'vue'
import { useNewsPage } from '@/composables/useNewsPage'
import AreaFooter from '@/components/AreaFooter.vue'
import LeaderHeader from '@/components/leader/LeaderHeader.vue'
import NewsForm from '@/components/news/NewsForm.vue'
import NewsList from '@/components/news/NewsList.vue'
import { PUBLISHED, SAVED } from '@/components/news/newsText'
import { LOAD_ERROR } from '@/components/parent/parentText'

// News for parents — SPEC §4.4: the form „Napsat rodičům“ (new, or an item
// loaded by „upravit“) and the list of published and withdrawn news.
const { loading, loadError, news, authorName } = useNewsPage()

const editing = ref(null) // news item loaded in the form
const formKey = ref(0) // bumped to empty the form after publishing
const status = ref('')

const form = ref(null)
function edit(item) {
  editing.value = item
  status.value = ''
  // On narrow screens the form is above the list.
  const top = form.value?.getBoundingClientRect().top
  if (top !== undefined && top < 0) form.value.scrollIntoView({ behavior: 'smooth' })
}
function saved(kind) {
  editing.value = null
  formKey.value++
  status.value = kind === 'published' ? PUBLISHED : SAVED
}
function cancel() {
  editing.value = null
  status.value = ''
}

const section = 'mx-auto max-w-[1000px] px-4 sm:px-6'
</script>

<template>
  <LeaderHeader />
  <main>
    <div :class="section" class="pt-6">
      <p class="m-0 mb-2 text-[15px]">
        <RouterLink to="/vedouci" class="inline-block py-1"
          >← zpět na vedoucovskou stránku</RouterLink
        >
      </p>
      <p class="kicker m-0 -mb-0.5">co mají rodiče vědět</p>
      <h1 class="m-0 mb-5 text-[28px] font-medium tracking-[-0.04em] text-ink sm:text-[38px]">
        Aktuality
      </h1>
    </div>

    <p v-if="loading" :class="section" class="font-hand text-2xl text-muted">načítám…</p>
    <p v-else-if="loadError" role="alert" :class="section" class="text-red">{{ LOAD_ERROR }}</p>
    <div v-else :class="section" class="flex flex-wrap items-start gap-x-10 gap-y-7">
      <div ref="form" class="min-w-0 flex-[1_1_400px] scroll-mt-20">
        <NewsForm
          :key="editing ? `edit-${editing.id}` : `new-${formKey}`"
          :item="editing"
          :author-name="authorName"
          :status="status"
          @saved="saved"
          @cancel="cancel"
          @edited="status = ''"
        />
      </div>
      <NewsList
        class="min-w-0 flex-[1_1_320px]"
        :news="news"
        :editing-id="editing?.id ?? null"
        @edit="edit"
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
</template>
