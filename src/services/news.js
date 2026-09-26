import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { fromQuery } from './utils'

const news = collection(db, 'news')

export async function listNews({ includeWithdrawn = false } = {}) {
  const filters = includeWithdrawn ? [] : [where('withdrawn', '==', false)]
  return fromQuery(await getDocs(query(news, ...filters, orderBy('publishedAt', 'desc'))))
}

// All news incl. withdrawn, newest first, followed live (leaders' news page).
// A just-published item has an estimated `publishedAt` until the server confirms it.
export function subscribeNews(callback, onError) {
  return onSnapshot(
    query(news, orderBy('publishedAt', 'desc')),
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
    onError,
  )
}

const contentFields = ({ title, body, audience, linkLabel, linkUrl, important }) => ({
  title,
  body,
  audience,
  linkLabel: linkLabel || null,
  linkUrl: linkUrl || null,
  important,
})

export async function publishNews(content, authorName) {
  const ref = await addDoc(news, {
    ...contentFields(content),
    authorUid: auth.currentUser.uid,
    authorName,
    publishedAt: serverTimestamp(),
    withdrawn: false,
  })
  return ref.id
}

// Edits the content; author and publication date stay.
export function updateNews(newsId, content) {
  return updateDoc(doc(news, newsId), contentFields(content))
}

export function setNewsWithdrawn(newsId, withdrawn) {
  return updateDoc(doc(news, newsId), { withdrawn })
}
