import {defineStore} from "pinia"
import {ref} from "vue"
import {collection, doc, onSnapshot, query, where} from "firebase/firestore";
import db from "@/firebase/firebase.js";
import {useSubscriptionsStore} from "@/stores/subsriptions.js";

const subscriptionsStore = useSubscriptionsStore()

export const useMembersStore = defineStore('members', () => {
    const userAccounts = ref([])
    const children = ref([])
    const leaders = ref([])

    async function getMembers() {
        const unsub1 = await onSnapshot(query(collection(db, "members")), async (querySnapshot) => {
            querySnapshot.forEach( (doc) => {
                const category = doc.data().category
                if (category === "ranger" || category === "rover") {
                    leaders.value.push({id: doc.id, ...doc.data()});
                } else if (category !== "ostatni") {
                    children.value.push({id: doc.id, accounts: [], ...doc.data()});
                }
            })

            const unsub2 = await onSnapshot(query(collection(db, "users")), (querySnapshot) => {
                children.value.forEach((ch) => {ch.accounts = []})
                querySnapshot.forEach((doc) => {
                    const chIds = doc.data().children
                    for (const id of chIds) {
                        for (const ch of children.value) {
                            if (ch.id === id) {
                                ch.accounts.push({id: doc.id, ...doc.data()})
                                break
                            }
                        }
                    }

                })
            })
            subscriptionsStore.activeSubscriptions.push(unsub2)
        })
        subscriptionsStore.activeSubscriptions.push(unsub1)
    }

    async function getUserAccounts() {
        const q = query(collection(db, "users"));
        const unsubscribe = await onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                userAccounts.value.push({id: doc.id, ...doc.data()});
            })
        })
        subscriptionsStore.activeSubscriptions.push(unsubscribe)
    }

    return { userAccounts, children, leaders, getMembers, getUserAccounts }
})
