import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/auth'
import { createUserProfile, setUserNote, subscribeUser } from '@/services/users'

// Where each role lands after login (SPEC §2.4). Others stay on the login page,
// which shows the waiting-for-approval or no-access screen.
const HOME_ROUTES = { admin: '/vedouci', leader: '/vedouci', parent: '/clenove' }

// The signed-in Firebase user and their live `users/{uid}` profile.
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null) // null also when the profile doc doesn't exist (yet)
  const profileLoaded = ref(false)
  const busy = ref(false) // a sign-in / registration is in progress
  let ready = null
  let unsubscribeProfile = null

  // Resolves once the first auth state (and that user's profile) is known.
  function init() {
    ready ??= new Promise((resolve) => {
      authService.onAuthChange((firebaseUser) => {
        unsubscribeProfile?.()
        unsubscribeProfile = null
        user.value = firebaseUser
        profile.value = null
        profileLoaded.value = !firebaseUser
        if (!firebaseUser) return resolve()
        unsubscribeProfile = subscribeUser(
          firebaseUser.uid,
          (data) => {
            profile.value = data
            profileLoaded.value = true
            resolve()
          },
          (e) => {
            console.error('Failed to load the user profile', e)
            profileLoaded.value = true
            resolve()
          },
        )
      })
    })
    return ready
  }

  // pending | parent | leader | admin | none; null when signed out.
  // A signed-in user without a profile doc counts as pending.
  const role = computed(() => (user.value ? (profile.value?.role ?? 'pending') : null))
  const homeRoute = computed(() => HOME_ROUTES[role.value] ?? null)

  async function run(action) {
    busy.value = true
    try {
      return await action()
    } finally {
      busy.value = false
    }
  }

  const signInWithEmail = (email, password) =>
    run(() => authService.signInWithEmail(email, password))
  const signInWithGoogle = () => run(() => authService.signInWithGoogle())
  const register = (data) => run(() => authService.register(data))
  const sendPasswordReset = (email) => authService.sendPasswordReset(email)
  const signOut = () => authService.signOut()

  // Saves the note for the admin; creates the profile if it is missing.
  function saveNote(note) {
    const { uid, email, displayName } = user.value
    return profile.value
      ? setUserNote(uid, note)
      : createUserProfile(uid, { email, displayName: displayName ?? '', note })
  }

  return {
    user,
    profile,
    profileLoaded,
    busy,
    role,
    homeRoute,
    init,
    signInWithEmail,
    signInWithGoogle,
    register,
    sendPasswordReset,
    signOut,
    saveNote,
  }
})
