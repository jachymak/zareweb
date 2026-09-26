import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './utils'

const templates = collection(db, 'packingTemplates')

export async function listPackingTemplates() {
  return fromQuery(await getDocs(templates))
}

export async function createPackingTemplate({ name, items }) {
  const ref = await addDoc(templates, { name, items })
  return ref.id
}

export function updatePackingTemplate(templateId, fields) {
  return updateDoc(doc(templates, templateId), fields)
}

export function deletePackingTemplate(templateId) {
  return deleteDoc(doc(templates, templateId))
}
