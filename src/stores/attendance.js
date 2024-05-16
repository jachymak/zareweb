import {defineStore} from "pinia"
import {ref} from "vue"
import {collection, doc, onSnapshot, query, setDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";
import {eachDayOfInterval} from "date-fns";

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

    function setup() {
        getEvents()
        getDoneDates()
    }

    function resetCurrentEvent() {
        currentEventId.value = ""
    }

    function getDoneDates() {
        onSnapshot(query(collection(db, "attendance")), (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const ev = data.value.find(val => val.id === doc.id)

                if (ev) data.value[ev].done = true
                else {
                    const ev = {
                        id: doc.id,
                        dates: datesToArray(doc.data().date),
                        done: true,  // will be updated in getDoneDates function
                        title: "Schůzka",
                        who: ""
                    }
                    data.value.push(ev)
                }

            })
        })
    }

    function getEvents() {
        onSnapshot(query(collection(db, "events")), (querySnapshot) => {
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
    }

    async function createAttendanceMeeting(eventId, date) {
        await setDoc(doc(db, "attendance", eventId), {
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

    }

    return { data, currentEventId, resetCurrentEvent, setup, getEvents, getDoneDates, getAttendance, createAttendanceMeeting }
})
