import { computed, reactive, ref } from 'vue'
import { photoFileProblem } from '@shared/photos'
import { newPhotoId, uploadPhoto } from '@/services/photos'

const CONCURRENCY = 3
const ATTEMPTS = 3 // per file before it's marked failed (then retryable by hand)

// Upload queue of an album's originals — SPEC §4.9. Files are checked first
// (JPEG / PNG / WebP up to 30 MB, no HEIC); at most three upload at once and
// failed ones are retried. `uploadedIds` are the photos the Cloud Function
// is (or was) processing.
export function usePhotoUpload(albumId) {
  const items = reactive([]) // { id, name, size, file, loaded, status: waiting|uploading|done|failed }
  const rejected = ref([]) // { name, problem }
  const uploadedIds = reactive(new Set())
  let active = 0

  function add(files) {
    const problems = []
    for (const file of files) {
      const problem = photoFileProblem(file)
      if (problem) problems.push({ name: file.name, problem })
      else {
        items.push({
          id: newPhotoId(albumId),
          name: file.name,
          size: file.size,
          file,
          loaded: 0,
          attempts: 0,
          status: 'waiting',
        })
      }
    }
    rejected.value = problems
    pump()
  }

  function pump() {
    while (active < CONCURRENCY) {
      const next = items.find((i) => i.status === 'waiting')
      if (!next) return
      start(next)
    }
  }

  async function start(item) {
    active++
    item.status = 'uploading'
    item.attempts++
    try {
      const upload = uploadPhoto(albumId, item.id, item.file, (loaded) => (item.loaded = loaded))
      item.cancel = upload.cancel
      await upload.done
      item.status = 'done'
      item.loaded = item.size
      item.file = null
      uploadedIds.add(item.id)
    } catch (e) {
      item.loaded = 0
      if (e.code === 'storage/canceled') item.status = 'canceled'
      else if (item.attempts < ATTEMPTS) {
        console.warn(`Upload of ${item.name} failed, retrying`, e)
        await new Promise((r) => setTimeout(r, 1500 * item.attempts))
        item.status = 'waiting'
      } else {
        console.error(`Upload of ${item.name} failed`, e)
        item.status = 'failed'
      }
    } finally {
      item.cancel = null
      active--
      pump()
    }
  }

  function retryFailed() {
    for (const item of items) {
      if (item.status === 'failed') Object.assign(item, { status: 'waiting', attempts: 0 })
    }
    pump()
  }

  // Stops what hasn't been uploaded yet; uploaded photos stay.
  function cancel() {
    for (const item of items) {
      if (item.status === 'waiting' || item.status === 'failed') item.status = 'canceled'
      else if (item.status === 'uploading') item.cancel?.()
    }
  }

  // Forgets the finished batch (keeps `uploadedIds` for the processing note).
  function clear() {
    items.splice(0, items.length)
    rejected.value = []
  }

  const count = (status) => items.filter((i) => i.status === status).length
  const batch = computed(() => items.filter((i) => i.status !== 'canceled'))
  const progress = computed(() => {
    const total = batch.value.reduce((sum, i) => sum + i.size, 0)
    const loaded = batch.value.reduce((sum, i) => sum + i.loaded, 0)
    return {
      total: batch.value.length,
      done: count('done'),
      failed: count('failed'),
      fraction: total ? loaded / total : 0,
    }
  })
  const busy = computed(() => items.some((i) => i.status === 'waiting' || i.status === 'uploading'))
  const failedItems = computed(() => items.filter((i) => i.status === 'failed'))

  // reactive() so that templates read `upload.busy`, `upload.progress.done` directly.
  return reactive({
    items,
    rejected,
    uploadedIds,
    progress,
    busy,
    failedItems,
    add,
    retryFailed,
    cancel,
    clear,
  })
}
