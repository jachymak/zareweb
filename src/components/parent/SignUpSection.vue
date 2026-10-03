<script setup>
import { canJoin, registrationState } from '@shared/events'
import { useAuthStore } from '@/stores/auth'
import SectionHeading from './SectionHeading.vue'
import SignUpEvent from './SignUpEvent.vue'

// „Nejbližší akce“ — events with registration, sign-up per child (SPEC §3.1).
const props = defineProps({
  events: { type: Array, required: true },
  children: { type: Array, required: true }, // members
  today: { type: String, required: true },
  organizersOf: { type: Function, required: true },
  participantOf: { type: Function, required: true },
  saving: { type: Set, required: true }, // `eventId/memberId`
  errors: { type: Object, required: true }, // { eventId: true }
  preview: { type: Boolean, default: false }, // leaders' preview: nothing is saved
  posterQuery: { type: Object, default: () => ({}) },
})
defineEmits(['toggle'])

const auth = useAuthStore()

const childrenFor = (event) =>
  props.children
    .filter((m) => canJoin(event, m))
    .map((member) => {
      const participant = props.participantOf(event.id, member.id)
      return {
        member,
        participant,
        mine: !!participant?.signedUpBy && participant.signedUpBy === auth.user?.uid,
        saving: props.saving.has(`${event.id}/${member.id}`),
      }
    })
</script>

<template>
  <section aria-labelledby="signup-title">
    <SectionHeading id="signup-title" kicker="přihlašování otevřené" title="Nejbližší akce" />
    <p v-if="!events.length" class="m-0 text-[16px] text-muted">
      Teď se nedá přihlásit na žádnou akci.<template v-if="children.length">
        Až vedoucí přihlašování spustí, přijde vám e-mail.</template
      >
    </p>
    <SignUpEvent
      v-for="event in events"
      :key="event.id"
      :event="event"
      :state="registrationState(event, today)"
      :organizers="organizersOf(event)"
      :children="childrenFor(event)"
      :error="!!errors[event.id]"
      :preview="preview"
      :poster-query="posterQuery"
      :today="today"
      @toggle="(member) => $emit('toggle', event, member)"
    />
  </section>
</template>
