<script setup>
import { computed, ref, watch } from 'vue'
import { EXCUSED_BY } from '@/components/leader/leaderText'
import { nicknameOf } from '@shared/names'

// Excuses of one meeting (SPEC §4.2): who is excused, by whom and why, with
// „zrušit“; „+ omluvit dítě“ adds one (e.g. a parent texted a leader).
const props = defineProps({
  attendance: { type: Object, required: true }, // reactive(useAttendance())
  date: { type: String, required: true },
  children: { type: Array, required: true }, // members of the meeting
})

const a = props.attendance
const excused = computed(() =>
  props.children
    .map((member) => ({ member, excuse: a.excuseOf(props.date, member.id) }))
    .filter((row) => row.excuse),
)
// Children that can still be excused: not there and not excused yet.
const candidates = computed(() =>
  props.children.filter((m) => !a.isPresent(props.date, m.id) && !a.excuseOf(props.date, m.id)),
)

const adding = ref(false)
const memberId = ref('')
const reason = ref('')
function reset() {
  adding.value = false
  memberId.value = ''
  reason.value = ''
}
watch(() => props.date, reset)

function add() {
  if (!memberId.value) return
  a.excuseChild(props.date, memberId.value, reason.value)
  reset()
}

const small =
  'cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[14.5px] disabled:cursor-default'
</script>

<template>
  <div class="mt-4 border-t border-[#e4d9be] pt-3" data-testid="excuses">
    <ul v-if="excused.length" class="m-0 mb-2 list-none p-0">
      <li
        v-for="{ member, excuse } in excused"
        :key="member.id"
        :aria-label="`omluvenka ${nicknameOf(member)}`"
        class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 text-[14.5px]"
      >
        <b class="font-hand text-[19px] font-bold text-ink">{{ nicknameOf(member) }}</b>
        <span class="text-[#8a7b5e]">
          omluvili {{ EXCUSED_BY[excuse.by]
          }}<template v-if="excuse.reason">: {{ excuse.reason }}</template
          ><template v-if="a.isPresent(date, member.id)"> · ale přišel(a)</template>
        </span>
        <button
          type="button"
          class="cursor-pointer border-0 bg-transparent p-1 text-[14px] text-muted underline hover:text-red"
          @click="a.unexcuseChild(date, member.id)"
        >
          zrušit
        </button>
      </li>
    </ul>

    <button
      v-if="!adding && candidates.length"
      type="button"
      class="cursor-pointer border-0 bg-transparent py-1 font-hand text-[19px] font-bold text-green hover:text-red"
      @click="adding = true"
    >
      + omluvit dítě
    </button>
    <form v-if="adding" class="flex flex-wrap items-center gap-2" @submit.prevent="add">
      <select
        v-model="memberId"
        aria-label="Dítě"
        required
        class="min-h-10 min-w-0 flex-[1_1_150px] rounded-[3px] border-[1.5px] border-[#c9bfa6] bg-cream px-2 text-[15px]"
      >
        <option value="" disabled>vyber dítě</option>
        <option v-for="m in candidates" :key="m.id" :value="m.id">{{ nicknameOf(m) }}</option>
      </select>
      <input
        v-model="reason"
        aria-label="Důvod"
        placeholder="důvod (nepovinné)"
        maxlength="200"
        class="min-h-10 min-w-0 flex-[2_1_180px] rounded-[3px] border-[1.5px] border-[#c9bfa6] bg-cream px-2.5 text-[15px]"
      />
      <button type="submit" :class="small" class="border-gold bg-gold-light text-ink">
        omluvit
      </button>
      <button
        type="button"
        :class="small"
        class="border-[#c9bfa6] bg-transparent text-muted"
        @click="reset"
      >
        zpět
      </button>
    </form>
  </div>
</template>
