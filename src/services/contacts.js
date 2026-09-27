import { collection, doc, getDocs, orderBy, query, writeBatch } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { contactPhotoPath } from '@shared/contacts'
import { db, storage } from './firebase'
import { fromQuery } from './utils'

// Leader contacts shown to parents — SPEC §4.8 Contacts. A contact linked to a
// skautIS person takes name, nickname, phone and e-mail from `skautisPeople`;
// a manual one (personId null) has its own. Photos live in Storage.
const contacts = collection(db, 'contacts')

export async function listContacts() {
  return fromQuery(await getDocs(query(contacts, orderBy('order'))))
}

// Id for a contact created in the form, so its photo can be uploaded first.
export const newContactId = () => doc(contacts).id

// Writes the whole list at once: `upserts` are full documents with their id.
export async function saveContacts({ upserts, deletes }) {
  const batch = writeBatch(db)
  for (const { id, ...fields } of upserts) batch.set(doc(contacts, id), fields)
  for (const id of deletes) batch.delete(doc(contacts, id))
  await batch.commit()
}

// The (already resized) JPEG → { photoPath, photoUrl }.
export async function uploadContactPhoto(contactId, blob) {
  const path = contactPhotoPath(contactId, doc(contacts).id)
  const ref = storageRef(storage, path)
  await uploadBytes(ref, blob, { contentType: 'image/jpeg' })
  return { photoPath: path, photoUrl: await getDownloadURL(ref) }
}

// A photo no contact uses any more; a missing file is fine.
export async function deleteContactPhoto(path) {
  try {
    await deleteObject(storageRef(storage, path))
  } catch (e) {
    if (e.code !== 'storage/object-not-found') throw e
  }
}
