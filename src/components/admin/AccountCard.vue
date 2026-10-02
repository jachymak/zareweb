<script setup>
import { computed, ref, watch } from 'vue'
import PersonChip from './PersonChip.vue'
import PersonPicker from './PersonPicker.vue'
import { ROLE_LABELS, formatDate, personName, troopTag } from './accounts'

// One account in „účty a párování“ — SPEC §4.8. Emits the admin's actions;
// the parent component writes them. Children (or a skautIS leader) picked for
// a pending account are only chosen here; „schválit jako rodiče“ pairs them
// all and approves the account in one write, so the approval e-mail lists them
// all; „schválit jako vedoucího“ links the leader the same way.
const props = defineProps({
  account: { type: Object, required: true },
  children: { type: Array, default: () => [] }, // paired members
  suggestions: { type: Array, default: () => [] }, // [{ member, reasons }]
  candidates: { type: Array, default: () => [] }, // members that can be paired
  leader: { type: Object, default: null }, // linked skautisPeople doc
  leaderSuggestions: { type: Array, default: () => [] }, // [{ person, reasons }]
  leaderCandidates: { type: Array, default: () => [] }, // leaders that can be linked
  self: { type: Boolean, default: false }, // the signed-in admin's own account
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits([
  'pair',
  'approve',
  'unpair',
  'link-leader',
  'approve-leader',
  'set-role',
  'revoke',
  'reactivate',
  'delete',
])

const role = computed(() => props.account.role ?? 'pending')
const isLeader = computed(() => ['leader', 'admin'].includes(role.value))
const canPair = computed(() => ['pending', 'parent'].includes(role.value))
const canLink = computed(() => role.value === 'pending' || isLeader.value)

const picking = ref(null) // 'child' | 'leader'

// Children — or one leader — chosen for a pending account, not saved until
// approval. Choosing one kind drops the other.
const chosen = ref([])
const chosenLeader = ref(null)
watch(role, (r) => r !== 'pending' && ((chosen.value = []), (chosenLeader.value = null)))
const isChosen = (m) => chosen.value.some((c) => c.id === m.id)
const openCandidates = computed(() => props.candidates.filter((m) => !isChosen(m)))
const shownLeader = computed(() => props.leader ?? chosenLeader.value)

// Children and leaders the account probably belongs to, in one list.
const openSuggestions = computed(() => [
  ...(canPair.value ? props.suggestions : [])
    .filter((s) => !isChosen(s.member))
    .map(({ member, reasons }) => ({ person: member, reasons, leader: false })),
  ...(canLink.value && !shownLeader.value ? props.leaderSuggestions : []).map((s) => ({
    ...s,
    reasons: ['vedoucí', ...s.reasons],
    leader: true,
  })),
])

function pick(member) {
  if (role.value !== 'pending') return emit('pair', member)
  chosenLeader.value = null
  if (!isChosen(member)) chosen.value = [...chosen.value, member]
}
function pickLeader(person) {
  if (role.value !== 'pending') return emit('link-leader', person)
  chosen.value = []
  chosenLeader.value = person
}
const confirmingDelete = ref(false)

const BADGE = {
  pending: 'bg-[#faede4] text-[#8a2f16]',
  parent: 'bg-[#e9f1ea] text-[#1f5138]',
  leader: 'bg-[#e9f1ea] text-[#1f5138]',
  admin: 'bg-[#e9f1ea] text-[#1f5138]',
  none: 'bg-[#f2eee1] text-muted',
}
</script>

<template>
  <article
    class="rounded-[3px] border-[1.5px] border-[#e2d9c2] bg-paper px-4 py-3.5 sm:px-[18px]"
    :aria-label="account.email"
    :aria-busy="busy"
    data-testid="account"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <h3 class="m-0 min-w-0 flex-[1_1_200px] text-[16.5px] font-normal break-words text-ink">
        {{ account.email }}
        <span v-if="self" class="text-[14px] text-brown">(ty)</span>
      </h3>
      <span
        class="flex-none rounded-full px-2.5 py-1 text-[12.5px] tracking-[.06em] uppercase"
        :class="BADGE[role]"
      >
        {{ ROLE_LABELS[role] }}
      </span>
    </div>
    <p class="m-0 mt-0.5 text-[14.5px] text-brown">
      {{ account.displayName || 'bez jména' }}
      <template v-if="account.createdAt"> · založen {{ formatDate(account.createdAt) }}</template>
    </p>

    <p
      v-if="account.note && !isLeader"
      class="m-0 mt-2 border-l-[3px] border-gold-light pl-3 text-[15px] leading-normal break-words whitespace-pre-line text-text"
      data-testid="note"
    >
      {{ account.note }}
    </p>
    <p v-else-if="role === 'pending'" class="m-0 mt-2 text-[14.5px] text-muted italic">
      Poznámku zatím nenapsal/a.
    </p>

    <!-- children, skautIS leader -->
    <div
      v-if="canPair || canLink || children.length"
      data-testid="children"
      class="mt-3 flex flex-wrap items-center gap-2"
    >
      <PersonChip
        v-for="m in children"
        :key="m.id"
        :person="m"
        :disabled="busy"
        @remove="$emit('unpair', m)"
      />
      <PersonChip
        v-for="m in chosen"
        :key="m.id"
        :person="m"
        :disabled="busy"
        @remove="chosen = chosen.filter((c) => c.id !== m.id)"
      />
      <PersonChip
        v-if="shownLeader"
        :person="shownLeader"
        :disabled="busy"
        @remove="leader ? $emit('link-leader', null) : (chosenLeader = null)"
      />
      <button
        v-if="canPair && !picking"
        type="button"
        class="cursor-pointer rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-[13px] py-1 font-hand text-[19px] font-bold text-green"
        @click="picking = 'child'"
      >
        + přiřadit dítě
      </button>
      <button
        v-if="canLink && !shownLeader && !picking"
        type="button"
        class="cursor-pointer rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-[13px] py-1 font-hand text-[19px] font-bold text-green"
        @click="picking = 'leader'"
      >
        + přiřadit vedoucího
      </button>
    </div>
    <PersonPicker
      v-if="picking"
      :people="picking === 'leader' ? leaderCandidates : openCandidates"
      :leaders="picking === 'leader'"
      :disabled="busy"
      @pick="(p) => ((picking === 'leader' ? pickLeader : pick)(p), (picking = null))"
      @close="picking = null"
    />

    <!-- suggestions -->
    <div v-if="openSuggestions.length" class="mt-3" data-testid="suggestions">
      <p class="m-0 mb-1.5 text-[12.5px] tracking-widest text-[#8a7b5e] uppercase">Návrhy</p>
      <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
        <li
          v-for="{ person, reasons, leader: isPerson } in openSuggestions"
          :key="person.id"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]"
        >
          <span class="min-w-0">
            <b class="mr-1 font-hand text-[19px] font-bold text-ink">{{ person.nickname }}</b>
            {{ personName(person) }}
            <template v-if="person.troop"> · {{ troopTag(person.troop) }}</template>
            <span class="text-[14px] text-brown">— {{ reasons.join(', ') }}</span>
          </span>
          <button
            type="button"
            class="btn-link"
            :aria-label="`Přiřadit ${personName(person)}`"
            :disabled="busy"
            @click="(isPerson ? pickLeader : pick)(person)"
          >
            přiřadit
          </button>
        </li>
      </ul>
    </div>
    <p v-if="role === 'pending'" class="m-0 mt-2 text-[14px] text-muted">
      <template v-if="chosen.length">
        Vybrané děti se uloží až se schválením — e-mail o schválení pak přijde se všemi.
      </template>
      <template v-else-if="chosenLeader">
        Vedoucí ze skautISu se k účtu propojí až se schválením.
      </template>
      <template v-else>
        Vyber děti, které k účtu patří, a schval ho jako rodiče — nebo vyber vedoucího ze skautISu a
        schval ho jako vedoucího.
      </template>
    </p>
    <p v-else-if="isLeader && !leader" class="m-0 mt-2 text-[14px] text-muted">
      Účet není propojený s vedoucím ze skautISu — na stránkách vedoucích pak chybí přezdívka a
      oddíl.
    </p>

    <!-- actions -->
    <div
      v-if="!self"
      class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#ece4d0] pt-2"
    >
      <template v-if="role === 'pending'">
        <button
          v-if="chosen.length"
          type="button"
          class="cursor-pointer rounded-full border-0 bg-green px-4 py-1.5 text-[15px] font-medium text-cream disabled:cursor-wait disabled:opacity-70"
          :disabled="busy"
          @click="$emit('approve', chosen)"
        >
          schválit jako rodiče
        </button>
        <button
          v-if="chosenLeader"
          type="button"
          class="cursor-pointer rounded-full border-0 bg-green px-4 py-1.5 text-[15px] font-medium text-cream disabled:cursor-wait disabled:opacity-70"
          :disabled="busy"
          @click="$emit('approve-leader', chosenLeader)"
        >
          schválit jako vedoucího
        </button>
        <button
          v-else
          type="button"
          class="btn-link"
          :disabled="busy"
          @click="$emit('set-role', 'leader')"
        >
          schválit jako vedoucího
        </button>
        <button
          type="button"
          class="btn-link text-red! hover:text-ink!"
          :disabled="busy"
          @click="$emit('revoke')"
        >
          zamítnout
        </button>
      </template>

      <template v-else-if="isLeader">
        <span class="flex gap-1.5" role="group" aria-label="Role">
          <button
            v-for="r in ['leader', 'admin']"
            :key="r"
            type="button"
            :aria-pressed="role === r"
            :disabled="busy"
            class="cursor-pointer rounded-full border-[1.5px] px-3.5 py-1 text-[14.5px]"
            :class="
              role === r
                ? 'border-green bg-[#e9f1ea] text-[#1f5138]'
                : 'border-line bg-transparent text-muted'
            "
            @click="role !== r && $emit('set-role', r)"
          >
            {{ ROLE_LABELS[r] }}
          </button>
        </span>
        <button
          type="button"
          class="btn-link text-red! hover:text-ink!"
          :disabled="busy"
          @click="$emit('revoke')"
        >
          odebrat přístup
        </button>
      </template>

      <button
        v-else-if="role === 'parent'"
        type="button"
        class="btn-link text-red! hover:text-ink!"
        :disabled="busy"
        @click="$emit('revoke')"
      >
        odebrat přístup
      </button>

      <template v-else-if="role === 'none'">
        <button type="button" class="btn-link" :disabled="busy" @click="$emit('reactivate')">
          znovu aktivovat
        </button>
        <button
          v-if="!confirmingDelete"
          type="button"
          class="btn-link text-red! hover:text-ink!"
          :disabled="busy"
          @click="confirmingDelete = true"
        >
          smazat účet
        </button>
      </template>
    </div>

    <div
      v-if="confirmingDelete && role === 'none'"
      class="mt-3 rounded-[10px] border-[1.5px] border-red bg-red-light/60 px-4 py-3"
      role="alertdialog"
      :aria-label="`Smazat účet ${account.email}`"
    >
      <p class="m-0 mb-2 text-[15px] leading-normal">
        Účet {{ account.email }} se smaže i s přihlášením. Tohle nejde vzít zpět.
      </p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          class="cursor-pointer rounded-full border-0 bg-red px-5 py-2 text-[15px] font-medium text-cream disabled:cursor-wait disabled:opacity-70"
          :disabled="busy"
          @click="$emit('delete')"
        >
          Ano, smazat
        </button>
        <button type="button" class="btn-link" @click="confirmingDelete = false">zrušit</button>
      </div>
    </div>

    <p v-if="error" role="alert" class="m-0 mt-2 text-[15px] text-red">{{ error }}</p>
  </article>
</template>
