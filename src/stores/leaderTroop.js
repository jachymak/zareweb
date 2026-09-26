import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPerson } from '@/services/skautisPeople'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'zare.leaderTroop'
const TROOPS = ['vlc', 'ss']

function stored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return TROOPS.includes(value) ? value : null
  } catch {
    return null
  }
}

// The signed-in leader's skautIS person and the troop they are looking at
// (switch in the leader header; leader home, attendance). The troop is the one
// last chosen in this browser, else the leader's home troop, else vlc.
export const useLeaderTroopStore = defineStore('leaderTroop', () => {
  const person = ref(null) // skautisPeople doc of users.personId, if linked
  const chosen = ref(stored())
  let loaded = null
  let loadedFor = null

  // Loads the leader's person once per account.
  function init() {
    const personId = useAuthStore().profile?.personId ?? null
    if (loaded && loadedFor === personId) return loaded
    loadedFor = personId
    loaded = (personId ? getPerson(personId) : Promise.resolve(null)).then(
      (p) => (person.value = p),
    )
    return loaded
  }

  const troop = computed({
    get: () => chosen.value ?? (TROOPS.includes(person.value?.troop) ? person.value.troop : 'vlc'),
    set(value) {
      chosen.value = value
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch {
        // storage blocked — the choice is just not remembered
      }
    },
  })

  return { person, troop, init }
})
