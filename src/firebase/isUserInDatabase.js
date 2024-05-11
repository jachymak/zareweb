import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

const isUserInDatabase = async (userUid) => {
    const docSnap = await getDoc(doc(db, "users", userUid));
    return docSnap.exists();
}

export default isUserInDatabase;
