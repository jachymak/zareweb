<script setup>
import { computed, ref, watch } from 'vue'
import { publishNews, updateNews } from '@/services/news'
import FormField from '@/components/form/FormField.vue'
import HandDrawnBox from '@/components/HandDrawnBox.vue'
import { SAVE_ERROR } from '@/components/parent/parentText'
import { NEWS_AUDIENCE_OPTIONS } from './newsText'

// „Napsat rodičům“: a new news item, published right away, or an existing one
// loaded by „upravit“ (author and date stay).
const props = defineProps({
  item: { type: Object, default: null }, // null = new
  authorName: { type: String, required: true },
  status: { type: String, default: '' }, // confirmation of the last save
})
const emit = defineEmits(['saved', 'cancel', 'edited']) // saved('published' | 'saved'), edited = typing

const n = props.item
const title = ref(n?.title ?? '')
const body = ref(n?.body ?? '')
const audience = ref(n?.audience ?? 'all')
const linkLabel = ref(n?.linkLabel ?? '')
const linkUrl = ref(n?.linkUrl ?? '')
const important = ref(n?.important ?? false)

watch([title, body, audience, linkLabel, linkUrl, important], () => emit('edited'))

const submitted = ref(false)
const saving = ref(false)
const saveError = ref(false)

// „example.cz/x“ → „https://example.cz/x“; parents only see http(s) links.
const normalizedUrl = computed(() => {
  const url = linkUrl.value.trim()
  return url && !/^[a-z][a-z0-9+.-]*:/i.test(url) ? `https://${url}` : url
})

const errors = computed(() => ({
  title: title.value.trim() ? '' : 'Napiš titulek.',
  body: body.value.trim() ? '' : 'Napiš text vzkazu.',
  linkUrl:
    linkLabel.value.trim() && !normalizedUrl.value
      ? 'Doplň adresu odkazu.'
      : normalizedUrl.value && !/^https?:\/\/[^\s.]+\.\S+$/i.test(normalizedUrl.value)
        ? 'Tohle nevypadá jako webová adresa.'
        : '',
}))
const shown = (field) => (submitted.value ? errors.value[field] : '')

async function save() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  saving.value = true
  saveError.value = false
  const content = {
    title: title.value.trim(),
    body: body.value.trim(),
    audience: audience.value,
    linkLabel: normalizedUrl.value ? linkLabel.value.trim() : '',
    linkUrl: normalizedUrl.value,
    important: important.value,
  }
  try {
    if (n) {
      await updateNews(n.id, content)
      emit('saved', 'saved')
    } else {
      await publishNews(content, props.authorName)
      emit('saved', 'published')
    }
  } catch (err) {
    console.error('Saving the news failed', err)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <HandDrawnBox shape="tall" class="px-4 pt-5 pb-6 sm:px-[26px]">
    <form
      novalidate
      :aria-label="n ? 'Upravit aktualitu' : 'Napsat rodičům'"
      @submit.prevent="save"
    >
      <p class="kicker m-0 -mb-[3px]">{{ n ? 'úprava vzkazu' : 'nový vzkaz' }}</p>
      <h2 class="m-0 mb-[18px] text-[25px] font-medium tracking-[-0.03em] text-ink">
        {{ n ? 'Upravit aktualitu' : 'Napsat rodičům' }}
      </h2>

      <div class="flex flex-col gap-3.5">
        <FormField v-slot="{ id, describedBy }" label="Titulek" :error="shown('title')">
          <input
            :id="id"
            v-model="title"
            type="text"
            maxlength="120"
            placeholder="Členské příspěvky na školní rok"
            class="field-input"
            :aria-invalid="!!shown('title')"
            :aria-describedby="describedBy"
          />
        </FormField>
        <FormField v-slot="{ id, describedBy }" label="Text" :error="shown('body')">
          <textarea
            :id="id"
            v-model="body"
            rows="6"
            maxlength="3000"
            placeholder="Prosíme o zaplacení…"
            class="field-input resize-y leading-[1.6]"
            :aria-invalid="!!shown('body')"
            :aria-describedby="describedBy"
          />
        </FormField>
        <FormField v-slot="{ id }" label="Komu se zobrazí">
          <select :id="id" v-model="audience" class="field-input">
            <option v-for="o in NEWS_AUDIENCE_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </FormField>
        <FormField
          v-slot="{ describedBy }"
          label="Odkaz (nepovinné)"
          tag="fieldset"
          :error="shown('linkUrl')"
        >
          <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-2.5">
            <input
              v-model="linkLabel"
              type="text"
              maxlength="60"
              aria-label="Text odkazu"
              placeholder="platební údaje"
              class="field-input"
            />
            <input
              v-model="linkUrl"
              type="url"
              inputmode="url"
              maxlength="500"
              aria-label="Adresa odkazu"
              placeholder="https://…"
              class="field-input"
              :aria-invalid="!!shown('linkUrl')"
              :aria-describedby="describedBy"
            />
          </div>
        </FormField>
        <label class="flex cursor-pointer items-center gap-3 text-[15.5px] text-text">
          <input v-model="important" type="checkbox" class="size-6 shrink-0 accent-red" />
          označit jako důležité (zvýrazní se rodičům)
        </label>
      </div>

      <div
        class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-dashed border-line-soft pt-4"
      >
        <button
          type="submit"
          :disabled="saving"
          class="cursor-pointer rounded-full border-0 bg-green px-[26px] py-2.5 font-hand text-[24px] font-bold text-cream hover:bg-green-hover disabled:cursor-wait disabled:opacity-70"
        >
          {{ n ? 'uložit změny' : 'zveřejnit' }}
        </button>
        <button v-if="n" type="button" class="btn-link" @click="emit('cancel')">zrušit</button>
        <span role="status" class="font-hand text-[21px] text-brown">{{ status }}</span>
      </div>
      <p v-if="submitted && Object.values(errors).some(Boolean)" class="m-0 mt-2 text-sm text-red">
        Něco chybí — zkontroluj označená pole.
      </p>
      <p v-if="saveError" role="alert" class="m-0 mt-2 text-sm text-red">{{ SAVE_ERROR }}</p>
    </form>
  </HandDrawnBox>
</template>
