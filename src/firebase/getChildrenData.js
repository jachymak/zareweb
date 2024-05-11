import {doc, getDoc} from "firebase/firestore"
import db from "@/firebase/firebase.js"

const getChildrenData = async (userChildrenArray) => {
    const childrenData = []

    for (const child of userChildrenArray) {
        const docSnapChild = await getDoc(doc(db, "members", child))

        if (docSnapChild.exists()) {
            const data = {
                id: child,
                ...docSnapChild.data()
            }
            childrenData.push(data)
        } else {
            console.log("Child not found " + child)
        }
    }

    if (childrenData.length > 0) return childrenData
    else return null
}

export default getChildrenData
