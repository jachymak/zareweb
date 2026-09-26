import {
  addDoc,
  collection,
  doc,
  getDocs,
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

export async function publishNews(
  { title, body, audience, linkLabel, linkUrl, important },
  authorName,
) {
  const ref = await addDoc(news, {
    title,
    body,
    audience,
    linkLabel: linkLabel || null,
    linkUrl: linkUrl || null,
    important,
    authorUid: auth.currentUser.uid,
    authorName,
    publishedAt: serverTimestamp(),
    withdrawn: false,
  })
  return ref.id
}

export function updateNews(newsId, fields) {
  return updateDoc(doc(news, newsId), fields)
}

export function withdrawNews(newsId) {
  return updateDoc(doc(news, newsId), { withdrawn: true })
}
