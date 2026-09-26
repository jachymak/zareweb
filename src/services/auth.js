import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile, getUser } from './users'

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// Creates the pending profile on the first Google login.
export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
  if (!(await getUser(user.uid))) {
    await createUserProfile(user.uid, { email: user.email, displayName: user.displayName ?? '' })
  }
  return user
}

export async function signInWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

// Parent self-registration (SPEC §2.4): account + pending profile with a pairing request.
export async function registerParent({ name, email, password, childName, troopText }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  await createUserProfile(user.uid, {
    email,
    displayName: name,
    pairingRequest: { childName, troopText },
  })
  return user
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email)
}

export function signOut() {
  return firebaseSignOut(auth)
}
