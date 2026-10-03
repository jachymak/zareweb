<script setup>
import { computed, onMounted, ref } from 'vue'
import { manualContactErrors } from '@shared/contacts'
import { CONTACT_GROUP_NAMES } from '@/constants/troops'
import { useSaveState } from '@/composables/useSaveState'
import {
  deleteContactPhoto,
  listContacts,
  newContactId,
  saveContacts,
  uploadContactPhoto,
} from '@/services/contacts'
import { listLeaders } from '@/services/skautisPeople'
import PillSwitch from '@/components/parent/PillSwitch.vue'
import ContactRow from './ContactRow.vue'
import SaveBar from './SaveBar.vue'
import { nicknameOf } from '@shared/names'

// „Kontakty“ — SPEC §4.8 Contacts: the leader cards parents see in „Vedoucí“.
// Group by group (the switch), in order; name, phone and e-mail come from
// skautIS, the role title from skautIS can be overwritten, „ostatní“ can also
// hold manual contacts (e.g. people of the středisko). Everything, photos
// included, is saved with one „uložit kontakty“.
defineEmits(['open-tab'])

const MANUAL_FIELDS = ['nickname', 'name', 'phone', 'email']

const saved = ref(null) // contacts as stored, in order
const draft = ref(null) // the edited list, in order
const people = ref({}) // skautisPeople by id
const loadError = ref('')
const group = ref('vlc')

const toDraft = (c) => ({
  photoUrl: null,
  photoPath: null,
  roleTitle: null,
  ...c,
  photoBlob: null,
  ...(c.personId ? {} : Object.fromEntries(MANUAL_FIELDS.map((f) => [f, c[f] ?? '']))),
})

async function load() {
  try {
    const [contacts, leaders] = await Promise.all([
      listContacts(),
      listLeaders({ activeOnly: false }),
    ])
    people.value = Object.fromEntries(leaders.map((p) => [p.id, p]))
    saved.value = contacts
    draft.value = contacts.map(toDraft)
  } catch (e) {
    console.error('Loading contacts failed', e)
    loadError.value = 'Kontakty se nepodařilo načíst. Zkus stránku obnovit.'
  }
}
onMounted(load)

// The documents the draft would be saved as (without new photos).
function toDoc(c, order) {
  const roleTitle = c.roleTitle?.trim() || null
  const fields = { personId: c.personId ?? null, group: c.group, roleTitle, order }
  if (!c.personId) for (const f of MANUAL_FIELDS) fields[f] = c[f].trim() || null
  return { id: c.id, ...fields, photoUrl: c.photoUrl ?? null, photoPath: c.photoPath ?? null }
}
const docs = (list) => JSON.stringify(list.map((c, i) => toDoc(c, i)))
const dirty = computed(
  () =>
    !!draft.value &&
    (draft.value.some((c) => c.photoBlob) || docs(draft.value) !== docs(saved.value.map(toDraft))),
)

// ---- the list of one group ----

const GROUPS = computed(() =>
  Object.entries(CONTACT_GROUP_NAMES).map(([value, name]) => ({
    value,
    label: `${name} (${(draft.value ?? []).filter((c) => c.group === value).length})`,
  })),
)
const inGroup = computed(() => draft.value.filter((c) => c.group === group.value))

// Moves a contact before / after its neighbour in the same group.
function move(contact, step) {
  const list = inGroup.value
  const other = list[list.indexOf(contact) + step]
  if (!other) return
  const all = [...draft.value]
  const [a, b] = [all.indexOf(contact), all.indexOf(other)]
  ;[all[a], all[b]] = [all[b], all[a]]
  draft.value = all
}
const remove = (contact) => (draft.value = draft.value.filter((c) => c !== contact))

// A contact moved to another group goes to its end.
function setGroup(contact, value) {
  contact.group = value
  draft.value = [...draft.value.filter((c) => c !== contact), contact]
}

// ---- adding ----

const byNickname = (a, b) => nicknameOf(a).localeCompare(nicknameOf(b), 'cs')
// Active leaders not yet in the shown group.
const available = computed(() =>
  Object.values(people.value)
    .filter((p) => p.active)
    .filter((p) => !inGroup.value.some((c) => c.personId === p.id))
    .sort(byNickname),
)
const picking = ref(false)
const picked = ref('')

function addPerson() {
  if (!picked.value) return
  draft.value = [
    ...draft.value,
    toDraft({ id: newContactId(), personId: picked.value, group: group.value }),
  ]
  picked.value = ''
  picking.value = false
}

function addManual() {
  draft.value = [...draft.value, toDraft({ id: newContactId(), personId: null, group: 'other' })]
}

// ---- saving ----

const errors = ref({}) // { contactId: { name?, reach? } }
const { saving, saved: savedNow, error, save } = useSaveState()

function validate() {
  errors.value = Object.fromEntries(
    draft.value
      .filter((c) => !c.personId)
      .map((c) => [c.id, manualContactErrors(c)])
      .filter(([, e]) => Object.keys(e).length),
  )
  const [firstBad] = Object.keys(errors.value)
  if (firstBad) group.value = draft.value.find((c) => c.id === firstBad).group
  return !firstBad
}

async function submit() {
  if (!validate()) return
  await save(async () => {
    // New photos first; a failed save leaves at most unused files behind.
    for (const c of draft.value.filter((c) => c.photoBlob)) {
      Object.assign(c, await uploadContactPhoto(c.id, c.photoBlob), { photoBlob: null })
    }
    const upserts = draft.value.map((c, i) => toDoc(c, i))
    const kept = new Set(upserts.map((c) => c.id))
    await saveContacts({
      upserts,
      deletes: saved.value.filter((c) => !kept.has(c.id)).map((c) => c.id),
    })
    const used = new Set(upserts.map((c) => c.photoPath).filter(Boolean))
    const unused = saved.value.map((c) => c.photoPath).filter((p) => p && !used.has(p))
    saved.value = upserts
    draft.value = upserts.map(toDraft)
    await Promise.all(
      unused.map((p) =>
        deleteContactPhoto(p).catch((e) => console.error('Deleting a contact photo failed', e)),
      ),
    )
  })
}
</script>

<template>
  <section aria-labelledby="contacts-title">
    <h2 id="contacts-title" class="sr-only">Kontakty</h2>
    <p class="m-0 mb-4 max-w-[70ch] text-[15.5px] leading-normal text-muted">
      Tyto kontakty se rodičům zobrazují v sekci Vedoucí. Skupina určuje, pod kterým přepínačem je
      najdou. Jméno, telefon a e-mail se berou ze skautISu — tady se nastavuje skupina, role, fotka
      a pořadí. Do „ostatních“ jde přidat i někoho, kdo ve skautISu oddílu není.
    </p>

    <p v-if="loadError" role="alert" class="text-red">{{ loadError }}</p>
    <p v-else-if="!draft" class="font-hand text-2xl text-muted">načítám kontakty…</p>

    <form v-else novalidate @submit.prevent="submit">
      <PillSwitch v-model="group" :options="GROUPS" label="Skupina kontaktů" class="mb-2" />

      <ul class="m-0 list-none p-0" :data-testid="`contacts-${group}`">
        <ContactRow
          v-for="(c, i) in inGroup"
          :key="c.id"
          :contact="c"
          :person="c.personId ? (people[c.personId] ?? null) : null"
          :errors="errors[c.id]"
          :first="i === 0"
          :last="i === inGroup.length - 1"
          @group="(value) => setGroup(c, value)"
          @up="move(c, -1)"
          @down="move(c, 1)"
          @remove="remove(c)"
        />
      </ul>
      <p v-if="!inGroup.length" class="m-0 border-t border-[#e7dfcb] py-4 text-[15.5px] text-muted">
        V téhle skupině zatím nikdo není.
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-2.5 border-t border-[#e7dfcb] pt-4">
        <div v-if="picking" class="flex w-full flex-wrap items-center gap-2.5">
          <label class="sr-only" for="contact-person">Vedoucí ze skautISu</label>
          <select
            id="contact-person"
            v-model="picked"
            class="field-input w-auto min-w-0 flex-[1_1_220px] py-2"
          >
            <option value="" disabled>vyber vedoucího ze skautISu…</option>
            <option v-for="p in available" :key="p.id" :value="p.id">
              {{ p.nickname ? `${p.nickname} (${p.name})` : p.name }}
            </option>
          </select>
          <button
            type="button"
            class="btn-outline px-5 py-2"
            :disabled="!picked"
            @click="addPerson"
          >
            přidat
          </button>
          <button type="button" class="btn-link" @click="picking = false">zrušit</button>
        </div>
        <template v-else>
          <button
            type="button"
            class="cursor-pointer rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-4 py-1.5 font-hand text-[21px] font-bold text-green"
            @click="picking = true"
          >
            + přidat kontakt
          </button>
          <button
            v-if="group === 'other'"
            type="button"
            class="cursor-pointer rounded-full border-[1.5px] border-dashed border-[#9ec0a8] bg-transparent px-4 py-1.5 font-hand text-[21px] font-bold text-green"
            @click="addManual"
          >
            + ruční kontakt
          </button>
        </template>
      </div>

      <SaveBar
        class="mt-5"
        label="uložit kontakty"
        :saving="saving"
        :saved="savedNow"
        :dirty="dirty"
        :error="error"
      />
    </form>
  </section>
</template>
