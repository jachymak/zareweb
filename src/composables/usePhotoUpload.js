import { computed, reactive, ref } from 'vue'
import { photoFileProblem, SHRINK_ABOVE_BYTES } from '@shared/photos'
import { newPhotoId, uploadPhoto } from '@/services/photos'
import { shrinkPhoto } from '@/components/photos/shrinkPhoto'

const CONCURRENCY = 3
const ATTEMPTS = 3 // per file before it's marked failed (then retryable by hand)

// Upload queue of an album's originals — SPEC §4.9. Files are checked first
// (JPEG / PNG / WebP up to 30 MB, no HEIC). When some are over 7 MB the batch
// waits in `pending` until the leader decides (`decideBig`): shrink them in
// the browser, upload them in full, or cancel the batch. At most three upload
// at once and failed ones are retried. `uploadedIds` are the photos the Cloud
// Function is (or was) processing.
export function usePhotoUpload(albumId) {
  const items = reactive([]) // { id, name, size, file, loaded, status: waiting|uploading|done|failed }
  const rejected = ref([]) // { name, problem }
  const pending = ref(null) // files waiting for the decision about big ones
  const uploadedIds = reactive(new Set())
  let active = 0

  const isBig = (file) => file.size > SHRINK_ABOVE_BYTES

  function add(files) {
    const problems = []
    const accepted = []
    for (const file of files) {
      const problem = photoFileProblem(file)
      if (problem) problems.push({ name: file.name, problem })
      else accepted.push(file)
    }
    rejected.value = problems
    // Dropped again while asking: one decision for all of them.
    if (pending.value) pending.value = [...pending.value, ...accepted]
    else if (accepted.some(isBig)) pending.value = accepted
    else enqueue(accepted, false)
  }

  // 'shrink' | 'full' | 'cancel' for the pending batch.
  function decideBig(choice) {
    const files = pending.value ?? []
    pending.value = null
    if (choice !== 'cancel') enqueue(files, choice === 'shrink')
  }

  const big = computed(() => {
    const files = (pending.value ?? []).filter(isBig)
    return { count: files.length, bytes: files.reduce((sum, f) => sum + f.size, 0) }
  })

  function enqueue(files, shrinkBig) {
    for (const file of files) {
      items.push({
        id: newPhotoId(albumId),
        name: file.name,
        size: file.size,
        file,
        shrink: shrinkBig && isBig(file),
        content: null, // what is uploaded, kept for retries
        loaded: 0,
        attempts: 0,
        status: 'waiting',
      })
    }
    pump()
  }

  // Shrunk (when asked and it helps) or as it is; read into memory first:
  // Safari (macOS) sometimes stops sending slices of a picked file ("bad
  // URL"), bytes avoid reading the file there.
  async function content(item) {
    const { file } = item
    item.content ??= (item.shrink && (await shrinkPhoto(file))) || {
      name: file.name,
      type: file.type,
      data: new Uint8Array(await file.arrayBuffer()),
    }
    item.size = item.content.data.length
    return item.content
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
      item.cancel = () => (item.status = 'canceled')
      const data = await content(item)
      if (item.status === 'canceled') return
      const upload = uploadPhoto(albumId, item.id, data, (loaded) => (item.loaded = loaded))
      item.cancel = upload.cancel
      await upload.done
      item.status = 'done'
      item.loaded = item.size
      item.file = item.content = null
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
      if (item.status === 'canceled') item.file = item.content = null
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
    pending.value = null
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
    pending,
    big,
    uploadedIds,
    progress,
    busy,
    failedItems,
    add,
    decideBig,
    retryFailed,
    cancel,
    clear,
  })
}
