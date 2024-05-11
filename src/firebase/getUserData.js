import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

const getUserData = async (userUid) => {
    const docSnap = await getDoc(doc(db, "users", userUid));

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        console.log("User not found in database!");
    }
}

export default getUserData;
