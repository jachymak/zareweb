import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Imported by every function module, so the app exists before first use.
initializeApp()
export const db = getFirestore()
