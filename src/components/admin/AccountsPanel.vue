<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { deleteAccount, revokeAccess, setUserRole, subscribeUsers } from '@/services/users'
import { getParentContactsOf, pairParent, subscribeMembers, unpairParent } from '@/services/members'
import AccountCard from './AccountCard.vue'
import AccountFilter from './AccountFilter.vue'
import { FILTERS, suggestChildren } from './accounts'

// „Účty a párování“ — SPEC §4.8. Accounts and members are live, so a new
// registration shows up (and an approval reaches the user) immediately.
const auth = useAuthStore()

const accounts = ref(null)
const members = ref(null)
const parentContacts = ref({})
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

const childrenOf = (uid) => (members.value ?? []).filter((m) => m.parentUids?.includes(uid))

const counts = computed(() =>
  Object.fromEntries(
    FILTERS.map((f) => [
      f.id,
      (accounts.value ?? []).filter((a) => f.roles.includes(a.role ?? 'pending')).length,
    ]),
  ),
)

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

const pair = (account, member) =>
  run(account, () => pairParent(member.id, account.id, { approve: account.role === 'pending' }))

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
</script>

<template>
  <section aria-labelledby="accounts-title">
    <h2 id="accounts-title" class="sr-only">Účty a párování</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Účet si může založit kdokoli; bez schválení nic nevidí. Rodiče schválíš přiřazením dítěte —
      nepřiřazené děti rodič ve své sekci nevidí. Návrhy vycházejí z e-mailů rodičů ve skautISu a z
      poznámky, kterou uživatel napsal.
    </p>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="loading" class="font-hand text-2xl text-muted">načítám účty…</p>

    <template v-else>
      <AccountFilter v-model="filter" :counts="counts" class="mb-4" />
      <div class="flex flex-col gap-2.5">
        <AccountCard
          v-for="account in visible"
          :key="account.id"
          v-bind="cardProps(account)"
          :busy="busyUid === account.id"
          :error="errors[account.id]"
          @pair="(m) => pair(account, m)"
          @unpair="(m) => unpair(account, m)"
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
