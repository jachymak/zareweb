import {defineStore} from "pinia"
import {ref, watch} from "vue"
import {collection, doc, onSnapshot, query, setDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";
import {eachDayOfInterval, isEqual} from "date-fns";
import {useSubscriptionsStore} from "@/stores/subsriptions.js";

const subscriptionsStore = useSubscriptionsStore()

const datesToArray = (dates) => {
    const array = []
    const d0 = dates[0].toDate()
    const d1 = dates[1].toDate()

    if (!d0) {
        if (!d1) return []
        else array.push(d1)
    }
    else if (!d1) {
        array.push(d0)
    }
    else {
        const allDates = eachDayOfInterval({start: d0, end: d1})

        if (allDates.length > 0) allDates.forEach((d) => {
            array.push(d)
        })
        else array.push(d0)
    }
    return array
}


export const useAttendanceStore = defineStore('attendance', () => {
    const data= ref([])
    const currentEventId = ref("")

    const unsubscribe = ref(null)
    const currentAttendance = ref({})

    function setup() {
        getEvents()
        getDoneDates()
    }

    function resetCurrentEvent() {
        currentEventId.value = ""
    }

    function getDoneDates() {
        const unsubscribe = onSnapshot(query(collection(db, "attendance")), (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const ev = data.value.find(val => val.id === doc.id)

                if (ev) data.value[ev].done = true  // if event is done
                else {  // meeting
                    const ev = {
                        id: doc.id,
                        dates: datesToArray(doc.data().date),
                        done: true,
                        title: "Schůzka",
                        who: doc.id.split('-')[3]
                    }
                    data.value.push(ev)
                }

            })
        })
        subscriptionsStore.activeSubscriptions.push(unsubscribe)
    }

    function getEvents() {
        const unsubscribe = onSnapshot(query(collection(db, "events")), (querySnapshot) => {
            data.value = []
            querySnapshot.forEach((doc) => {
                const ev = {
                    id: doc.id,
                    dates: datesToArray(doc.data().date),
                    done: false,  // will be updated in getDoneDates function
                    title: doc.data().title,
                    who: doc.data().who
                }
                data.value.push(ev)
            })
        })
        subscriptionsStore.activeSubscriptions.push(unsubscribe)
    }

    async function createAttendance() {
        await setDoc(doc(db, "attendance", currentEventId.value), {
            date: [date, date],
            eventCancelled: false,
            children: [],
            leaders: []
        });
        data.value.find((e, i) => {
            if (e.id === eventId) {
                data.value[i].done = true
                return true
            }
        })
    }

    function getAttendance() {
        if (currentEventId.value) {
            if (unsubscribe.value) subscriptionsStore.unsubscribeOne(unsubscribe.value())

            unsubscribe.value = onSnapshot(doc(db, "attendance", currentEventId.value), (doc) => {
                currentAttendance.value = doc.data()
            });
            subscriptionsStore.activeSubscriptions.push(unsubscribe.value)
        }
    }

    watch(currentEventId, async () => {
        if (data.value[currentEventId.value].done) getAttendance()
        else {
            await createAttendance()
            getAttendance()
        }
    })

    function dateIsDone(date) {
        return data.value.some(ev => ev.dates.some(d => isEqual(d, date) && ev.done))
    }

    function dateIsEvent(date) {
        return data.value.some(ev => ev.dates.some(d => isEqual(d, date)))
    }

    function dateIsMeeting(date) {
        return date.getDay() > 0 && date.getDay() < 5
    }

    return {
        data,
        currentEventId,
        unsubscribe,
        currentAttendance,
        resetCurrentEvent,
        setup,
        getEvents,
        getDoneDates,
        getAttendance,
        createAttendance,
        dateIsDone,
        dateIsEvent,
        dateIsMeeting
    }
})
