import {defineStore} from "pinia"
import {ref} from "vue"
import {collection, doc, onSnapshot, query, where} from "firebase/firestore";
import db from "@/firebase/firebase.js";

export const useMembersStore = defineStore('members', () => {
    const userAccounts = ref([])
    const children = ref([])
    const leaders = ref([])

    async function getMembers() {
        await onSnapshot(query(collection(db, "members")), async (querySnapshot) => {
            querySnapshot.forEach( (doc) => {
                const category = doc.data().category
                if (category === "ranger" || category === "rover") {
                    leaders.value.push({id: doc.id, ...doc.data()});
                } else if (category !== "ostatni") {
                    children.value.push({id: doc.id, accounts: [], ...doc.data()});
                }
            })

            await onSnapshot(query(collection(db, "users")), (querySnapshot) => {
                children.value.forEach((ch) => {ch.accounts = []})
                querySnapshot.forEach((doc) => {
                    const chIds = doc.data().children
                    for (const id of chIds) {
                        console.log(id)
                        for (const ch of children.value) {
                            console.log(ch, ch.id)
                            if (ch.id === id) {
                                ch.accounts.push({id: doc.id, ...doc.data()})
                                break
                            }
                        }
                    }

                })
            })
        })
    }

    async function getUserAccounts() {
        const q = query(collection(db, "users"));
        const unsubscribe = await onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                userAccounts.value.push({id: doc.id, ...doc.data()});
            });
        });
    }

    return { userAccounts, children, leaders, getMembers, getUserAccounts }
})
