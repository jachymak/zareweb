<script setup>
import { computed, ref } from 'vue'
import ChildChip from './ChildChip.vue'
import ChildPicker from './ChildPicker.vue'
import { ROLE_LABELS, childName, formatDate, troopTag } from './accounts'

// One account in „účty a párování“ — SPEC §4.8. Emits the admin's actions;
// the parent component writes them.
const props = defineProps({
  account: { type: Object, required: true },
  children: { type: Array, default: () => [] }, // paired members
  suggestions: { type: Array, default: () => [] }, // [{ member, reasons }]
  candidates: { type: Array, default: () => [] }, // members that can be paired
  self: { type: Boolean, default: false }, // the signed-in admin's own account
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
defineEmits(['pair', 'unpair', 'set-role', 'revoke', 'reactivate', 'delete'])

const role = computed(() => props.account.role ?? 'pending')
const isLeader = computed(() => ['leader', 'admin'].includes(role.value))
const canPair = computed(() => ['pending', 'parent'].includes(role.value))

const picking = ref(false)
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

    <!-- children -->
    <div v-if="canPair || children.length" class="mt-3 flex flex-wrap items-center gap-2">
      <ChildChip
        v-for="m in children"
        :key="m.id"
        :member="m"
        :disabled="busy"
        @remove="$emit('unpair', m)"
      />
      <button
        v-if="canPair && !picking"
        type="button"
        class="cursor-pointer rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-[13px] py-1 font-hand text-[19px] font-bold text-green"
        @click="picking = true"
      >
        + přiřadit dítě
      </button>
    </div>
    <ChildPicker
      v-if="picking"
      :members="candidates"
      :disabled="busy"
      @pick="(m) => ($emit('pair', m), (picking = false))"
      @close="picking = false"
    />

    <!-- suggestions -->
    <div v-if="canPair && suggestions.length" class="mt-3" data-testid="suggestions">
      <p class="m-0 mb-1.5 text-[12.5px] tracking-widest text-[#8a7b5e] uppercase">Návrhy</p>
      <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
        <li
          v-for="{ member, reasons } in suggestions"
          :key="member.id"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]"
        >
          <span class="min-w-0">
            <b class="mr-1 font-hand text-[19px] font-bold text-ink">{{ member.nickname }}</b>
            {{ childName(member) }} · {{ troopTag(member.troop) }}
            <span class="text-[14px] text-brown">— {{ reasons.join(', ') }}</span>
          </span>
          <button
            type="button"
            class="btn-link"
            :aria-label="`Přiřadit ${childName(member)}`"
            :disabled="busy"
            @click="$emit('pair', member)"
          >
            přiřadit
          </button>
        </li>
      </ul>
    </div>
    <p v-if="role === 'pending'" class="m-0 mt-2 text-[14px] text-muted">
      Přiřazením dítěte účet schválíš jako rodiče.
    </p>

    <!-- actions -->
    <div
      v-if="!self"
      class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#ece4d0] pt-2"
    >
      <template v-if="role === 'pending'">
        <button
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
