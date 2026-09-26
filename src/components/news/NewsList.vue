<script setup>
import { computed } from 'vue'
import NewsListItem from './NewsListItem.vue'

// „Zveřejněné aktuality“, newest first; withdrawn ones below, greyed out.
const props = defineProps({
  news: { type: Array, required: true },
  editingId: { type: String, default: null },
})
defineEmits(['edit']) // edit(item)

const published = computed(() => props.news.filter((n) => !n.withdrawn))
const withdrawn = computed(() => props.news.filter((n) => n.withdrawn))
const heading = 'm-0 mb-2.5 text-[13px] tracking-[0.12em] text-[#8a7b5e] uppercase'
</script>

<template>
  <div>
    <section aria-labelledby="news-published">
      <h2 id="news-published" :class="heading">Zveřejněné aktuality</h2>
      <p v-if="!published.length" class="m-0 text-[16px] text-muted">Zatím tu nic není.</p>
      <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="item in published" :key="item.id">
          <NewsListItem :item="item" :editing="item.id === editingId" @edit="$emit('edit', item)" />
        </li>
      </ul>
    </section>
    <section v-if="withdrawn.length" aria-labelledby="news-withdrawn" class="mt-7">
      <h2 id="news-withdrawn" :class="heading">Stažené · rodiče je nevidí</h2>
      <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="item in withdrawn" :key="item.id">
          <NewsListItem :item="item" :editing="item.id === editingId" @edit="$emit('edit', item)" />
        </li>
      </ul>
    </section>
  </div>
</template>
