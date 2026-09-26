<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { canJoin } from '@shared/events'
import { setSignedUp, subscribeParticipants } from '@/services/events'
import AudienceTag from '@/components/parent/AudienceTag.vue'
import { LOAD_ERROR, SAVE_ERROR } from '@/components/parent/parentText'

// Who is signed up: every child who can join, with a toggle. Leaders can sign
// children up or off at any time, also after the deadline (SPEC §4.3).
const props = defineProps({
  event: { type: Object, required: true },
  members: { type: Array, required: true }, // active children, by nickname
})

const participants = ref({}) // memberId → doc
const loadError = ref(false)
const saveError = ref(false)
let unsubscribe = null

watch(
  () => props.event.id,
  (eventId) => {
    unsubscribe?.()
    participants.value = {}
    unsubscribe = subscribeParticipants(
      eventId,
      (list) => (participants.value = Object.fromEntries(list.map((p) => [p.id, p]))),
      (e) => {
        console.error('Loading sign-ups failed', e)
        loadError.value = true
      },
    )
  },
  { immediate: true },
)
onUnmounted(() => unsubscribe?.())

const eligible = computed(() => props.members.filter((m) => canJoin(props.event, m)))
const isSignedUp = (m) => !!participants.value[m.id]?.signedUp
const count = computed(() => eligible.value.filter(isSignedUp).length)

async function toggle(member) {
  saveError.value = false
  try {
    await setSignedUp(props.event.id, member.id, !isSignedUp(member))
  } catch (e) {
    console.error('Saving the sign-up failed', e)
    saveError.value = true
  }
}
</script>

<template>
  <section aria-labelledby="signups-title">
    <div class="mb-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h3 id="signups-title" class="m-0 text-[19px] font-medium tracking-[-0.02em] text-ink">
        Kdo je přihlášený
      </h3>
      <span class="font-hand text-[22px] font-bold text-green" data-testid="signup-count">
        {{ count }} z {{ eligible.length }}
      </span>
    </div>
    <p class="m-0 mb-3 text-[14px] text-[#8a7b5e]">
      Kliknutím dítě přihlásíš nebo odhlásíš — i po uzávěrce, třeba když se rodiče ozvou
      organizátorovi.
    </p>
    <p v-if="loadError" role="alert" class="m-0 text-red">{{ LOAD_ERROR }}</p>
    <p v-else-if="!eligible.length" class="m-0 text-[15px] text-muted">
      Na tuhle akci nemůže jet žádné dítě.
    </p>
    <div v-else class="flex flex-wrap gap-2" role="group" aria-label="Přihlášky">
      <button
        v-for="m in eligible"
        :key="m.id"
        type="button"
        :aria-pressed="isSignedUp(m)"
        :aria-label="m.nickname || m.firstName"
        :title="`${m.firstName} ${m.lastName}`"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[15px]"
        :class="
          isSignedUp(m)
            ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
            : 'border-[#d6ccb4] bg-cream text-muted'
        "
        @click="toggle(m)"
      >
        <span v-if="isSignedUp(m)" aria-hidden="true">✓</span>
        {{ m.nickname || m.firstName }}
        <AudienceTag
          v-if="event.audience === 'all'"
          :audience="m.troop"
          class="text-[15px]! px-1.5! py-0.5!"
        />
      </button>
    </div>
    <p v-if="saveError" role="alert" class="m-0 mt-2 text-sm text-red">{{ SAVE_ERROR }}</p>
  </section>
</template>
