<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import logoSipka from '@/assets/logos/logo-sipka.png'
import signpost150 from '@/assets/public/rozcestnik-3-150.webp'
import signpost300 from '@/assets/public/rozcestnik-3-300.webp'

// Footer of the signed-in areas: group and středisko (the public site is a
// sign-out away), under a trail to a signpost drawing. The same in the parent
// and the leader area.

const wrap = useTemplateRef('wrap')
const row = useTemplateRef('row')
const signpost = useTemplateRef('signpost')
const d = ref('')

const TOP = 44 // height of the trail's run across the top
const TURN_GAP = 90 // from the end of the footer row's first line to the turn
const MIN_LOW_RUN = 140 // shorter than this, the trail heads straight for the signpost

// The trail runs across above the footer row, setting it apart from the page.
// Right after the row's first line it turns down and winds on at the row's
// level to the foot of the signpost (where the grass meets the rocks, 20 %
// across and 82 % down the drawing). With no room for that low run, it drops
// to the signpost straight from the top.
function route() {
  if (!wrap.value || !row.value || !signpost.value) return
  const box = wrap.value.getBoundingClientRect()
  const sign = signpost.value.getBoundingClientRect()
  const x0 = parseFloat(getComputedStyle(wrap.value).paddingLeft)
  const ex = sign.left - box.left + sign.width * 0.2
  const ey = sign.top - box.top + sign.height * 0.82
  const f = (n) => n.toFixed(1)

  const items = [...row.value.children].map((el) => el.getBoundingClientRect())
  const first = items[0]
  const lineEnd = Math.max(
    ...items.filter((r) => r.top < first.bottom && r.bottom > first.top).map((r) => r.right),
  )
  const tx = lineEnd - box.left + TURN_GAP

  // A gentle wave from x0 to `to` along the top.
  const wave = (to) => {
    const k = to - x0
    return `M${f(x0)} ${TOP} C${f(x0 + k * 0.25)} ${TOP - 12} ${f(x0 + k * 0.5)} ${TOP + 12} ${f(x0 + k * 0.72)} ${TOP} S${f(to - 20)} ${TOP - 4} ${f(to)} ${TOP + 2}`
  }

  if (ex - tx >= MIN_LOW_RUN) {
    // A long, loose S down from the top to the row's level, then a gentle wind.
    const low = ey + 2
    const down = tx + 50
    const span = ex - down
    const mid = down + span * 0.5
    d.value =
      wave(tx - 120) +
      ` C${f(tx - 50)} ${TOP + 4} ${f(tx - 20)} ${f(low)} ${f(down)} ${f(low)}` +
      ` S${f(mid - span * 0.2)} ${f(low + 8)} ${f(mid)} ${f(low + 2)}` +
      ` S${f(ex - span * 0.15)} ${f(ey + 6)} ${f(ex)} ${f(ey)}`
  } else {
    const turn = Math.max(x0 + 60, ex - 110)
    d.value =
      wave(turn) + ` C${f(turn + 40)} ${TOP + 6} ${f(ex - 26)} ${f(ey - 34)} ${f(ex)} ${f(ey)}`
  }
}

let observer
let frame = 0
function scheduleRoute() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(route)
}

onMounted(() => {
  observer = new ResizeObserver(scheduleRoute)
  observer.observe(wrap.value)
  observer.observe(row.value)
  document.fonts?.ready.then(scheduleRoute)
  scheduleRoute()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <footer class="mt-[46px]">
    <div ref="wrap" class="relative mx-auto max-w-[960px] px-4 sm:px-6">
      <div aria-hidden="true">
        <svg
          class="pointer-events-none absolute inset-0 block size-full overflow-visible"
          fill="none"
          stroke="var(--color-trail)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-dasharray="2 12"
        >
          <path :d="d" />
        </svg>
        <img
          ref="signpost"
          :src="signpost150"
          :srcset="`${signpost150} 150w, ${signpost300} 300w`"
          sizes="(min-width: 640px) 140px, 100px"
          alt=""
          width="1040"
          height="1200"
          class="absolute -top-[5px] right-4 block h-auto w-[100px] sm:-top-[22px] sm:right-6 sm:w-[140px]"
        />
      </div>
      <div
        ref="row"
        class="flex flex-wrap items-center gap-x-7 gap-y-4 pt-[70px] pr-[108px] pb-10 sm:pt-[84px] sm:pr-[190px]"
      >
        <p class="m-0 font-hand text-[26px] text-ink">Skautský oddíl Záře</p>
        <a
          href="https://stredisko-sipka.skauting.cz"
          title="Junák — český skaut, středisko Šipka Praha, z. s."
          class="block flex-none"
        >
          <img :src="logoSipka" alt="Středisko Šipka Praha" class="block size-[42px]" />
        </a>
        <p class="m-0 text-[14.5px] text-muted-2">
          Junák — český skaut,<br />středisko Šipka Praha, z. s.
        </p>
      </div>
    </div>
  </footer>
</template>
