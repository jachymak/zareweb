<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  approveLeader,
  deleteAccount,
  inviteParent,
  linkUserToPerson,
  revokeAccess,
  setUserRole,
  subscribeInvitations,
  subscribeUsers,
} from '@/services/users'
import {
  approveParent,
  getParentContactsOf,
  pairParent,
  subscribeMembers,
  unpairParent,
} from '@/services/members'
import { subscribeLeaders } from '@/services/skautisPeople'
import AccountCard from './AccountCard.vue'
import AccountFilter from './AccountFilter.vue'
import UnpairedChildren from './UnpairedChildren.vue'
import { FILTERS, suggestChildren, suggestLeaders } from './accounts'

// „Účty a párování“ — SPEC §4.8. Accounts and members are live, so a new
// registration shows up (and an approval reaches the user) immediately.
const auth = useAuthStore()

const accounts = ref(null)
const members = ref(null)
const leaders = ref([])
const parentContacts = ref({})
const invitations = ref([])
const loadError = ref('')

let unsubscribe = []
onMounted(() => {
  const fail = (e) => {
    console.error('Loading accounts failed', e)
    loadError.value = 'Účty se nepodařilo načíst. Zkus stránku obnovit.'
  }
  unsubscribe = [
    subscribeUsers((list) => (accounts.value = list), fail),
    subscribeMembers((list) => (members.value = list), fail),
    subscribeLeaders(
      (list) => (leaders.value = list),
      (e) => console.error('Loading leaders failed', e),
    ),
    subscribeInvitations(
      (list) => (invitations.value = list),
      (e) => console.error('Loading invitations failed', e),
    ),
  ]
})
onUnmounted(() => unsubscribe.forEach((u) => u()))

// Parents' contacts for suggestions; reloaded when the set of members changes.
const memberIds = computed(() =>
  (members.value ?? [])
    .map((m) => m.id)
    .sort()
    .join(','),
)
watch(memberIds, async (ids) => {
  if (!ids) return
  try {
    parentContacts.value = await getParentContactsOf(ids.split(','))
  } catch (e) {
    console.error('Loading parent contacts failed', e)
  }
})

const loading = computed(() => !loadError.value && (!accounts.value || !members.value))

// skautIS leaders already linked to some account (one account per leader).
const linkedLeaders = computed(
  () => new Set((accounts.value ?? []).map((a) => a.personId).filter(Boolean)),
)
const leaderOf = (account) =>
  account.personId
    ? (leaders.value.find((p) => p.id === account.personId) ?? {
        id: account.personId,
        name: 'vedoucí, který už ve skautISu není',
        active: false,
      })
    : null

const childrenOf = (uid) => (members.value ?? []).filter((m) => m.parentUids?.includes(uid))

// Active children without any paired parent account.
const unpaired = computed(() =>
  (members.value ?? []).filter((m) => m.active && !m.parentUids?.length),
)

// For „děti bez účtu“: when each parent e-mail was invited, and which have an account.
const invitedAt = computed(() => Object.fromEntries(invitations.value.map((i) => [i.id, i.sentAt])))
const accountEmails = computed(
  () => new Set((accounts.value ?? []).map((a) => a.email?.toLowerCase())),
)

const counts = computed(() => ({
  ...Object.fromEntries(
    FILTERS.map((f) => [
      f.id,
      (accounts.value ?? []).filter((a) => f.roles.includes(a.role ?? 'pending')).length,
    ]),
  ),
  unpaired: unpaired.value.length,
}))

const filter = ref('pending')

const byNewest = (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
const visible = computed(() => {
  const roles = FILTERS.find((f) => f.id === filter.value).roles
  const list = (accounts.value ?? []).filter((a) => roles.includes(a.role ?? 'pending'))
  return filter.value === 'pending'
    ? list.sort(byNewest)
    : list.sort((a, b) => a.email.localeCompare(b.email))
})

function cardProps(account) {
  const all = members.value ?? []
  return {
    account,
    children: childrenOf(account.id),
    suggestions: suggestChildren(account, all, parentContacts.value),
    candidates: all.filter((m) => !m.parentUids?.includes(account.id)),
    leader: leaderOf(account),
    leaderSuggestions: suggestLeaders(account, leaders.value, linkedLeaders.value),
    leaderCandidates: leaders.value.filter((p) => !linkedLeaders.value.has(p.id)),
    self: account.id === auth.user?.uid,
  }
}

// ---- actions ----

const busyUid = ref(null)
const errors = ref({})

async function run(account, action) {
  busyUid.value = account.id
  errors.value = { ...errors.value, [account.id]: '' }
  try {
    await action()
  } catch (e) {
    console.error('Account action failed', e)
    errors.value = { ...errors.value, [account.id]: 'Nepovedlo se to uložit. Zkus to znovu.' }
  } finally {
    busyUid.value = null
  }
}

const pair = (account, member) => run(account, () => pairParent(member.id, account.id))
const approve = (account, chosen) =>
  run(account, () =>
    approveParent(
      account.id,
      chosen.map((m) => m.id),
    ),
  )

const linkLeader = (account, person) =>
  run(account, () => linkUserToPerson(account.id, person?.id ?? null))
const approveAsLeader = (account, person) =>
  run(account, () => approveLeader(account.id, person.id))

const unpair = (account, member) =>
  run(account, () =>
    unpairParent(member.id, account.id, {
      backToPending: account.role === 'parent' && childrenOf(account.id).length === 1,
    }),
  )

const setRole = (account, role) => run(account, () => setUserRole(account.id, role))
const reactivate = (account) => run(account, () => setUserRole(account.id, 'pending'))
const revoke = (account) =>
  run(account, () =>
    revokeAccess(
      account.id,
      childrenOf(account.id).map((m) => m.id),
    ),
  )
const remove = (account) => run(account, () => deleteAccount(account.id))

const invitingEmail = ref(null)
const inviteErrors = ref({})
async function invite(email) {
  const key = email.toLowerCase()
  invitingEmail.value = key
  inviteErrors.value = { ...inviteErrors.value, [key]: '' }
  try {
    await inviteParent(email)
  } catch (e) {
    console.error('Invitation failed', e)
    inviteErrors.value = { ...inviteErrors.value, [key]: 'Pozvánku se nepodařilo poslat.' }
  } finally {
    invitingEmail.value = null
  }
}
</script>

<template>
  <section aria-labelledby="accounts-title">
    <h2 id="accounts-title" class="sr-only">Účty a párování</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Účet si může založit kdokoli; bez schválení nic nevidí. Rodiče schválíš tak, že mu vybereš
      děti a dáš „schválit jako rodiče“ — nepřiřazené děti rodič ve své sekci nevidí. Vedoucímu
      vyber jeho záznam ze skautISu a dej „schválit jako vedoucího“. Návrhy vycházejí z e-mailů ve
      skautISu a z poznámky, kterou uživatel napsal.
    </p>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="loading" class="font-hand text-2xl text-muted">načítám účty…</p>

    <template v-else>
      <AccountFilter v-model="filter" :counts="counts" class="mb-4" />
      <UnpairedChildren
        v-if="filter === 'unpaired'"
        :children="unpaired"
        :parent-contacts="parentContacts"
        :invited-at="invitedAt"
        :account-emails="accountEmails"
        :inviting-email="invitingEmail"
        :invite-errors="inviteErrors"
        @invite="invite"
      />
      <div v-else class="flex flex-col gap-2.5">
        <AccountCard
          v-for="account in visible"
          :key="account.id"
          v-bind="cardProps(account)"
          :busy="busyUid === account.id"
          :error="errors[account.id]"
          @pair="(m) => pair(account, m)"
          @approve="(chosen) => approve(account, chosen)"
          @unpair="(m) => unpair(account, m)"
          @link-leader="(p) => linkLeader(account, p)"
          @approve-leader="(p) => approveAsLeader(account, p)"
          @set-role="(r) => setRole(account, r)"
          @revoke="revoke(account)"
          @reactivate="reactivate(account)"
          @delete="remove(account)"
        />
        <p v-if="!visible.length" class="m-0 py-4 text-[15.5px] text-muted">
          Tady teď žádné účty nejsou.
        </p>
      </div>
    </template>
  </section>
</template>
