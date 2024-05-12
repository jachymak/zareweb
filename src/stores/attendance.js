import {defineStore} from "pinia"
import {ref} from "vue"
import {collection, doc, onSnapshot, query} from "firebase/firestore";
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
    const currentEventId = ref("")
    const currentEventLabel = ref({})

    const doneDates = ref([])
    const eventDates = ref([])


    function setup() {
        getEvents()
        getDoneDates()
    }

    function setCurrentEvent(id, title, who) {
        currentEventId.value = id
        currentEventLabel.value.title = title
        currentEventLabel.value.who = who
    }

    function resetCurrentEvent() {
        currentEventId.value = ""
        currentEventLabel.value = {}
    }

    function getDoneDates() {
        onSnapshot(query(collection(db, "attendance")), (querySnapshot) => {
            doneDates.value = []
            const dates = []
            querySnapshot.forEach((doc) => {
                dates.push(doc.data().date)
            })

            for (const d of dates) {
                datesToArray(d).forEach((val) => {
                    doneDates.value.push(val)
                })
            }
        })
    }

    function getEvents() {
        onSnapshot(query(collection(db, "events")), (querySnapshot) => {
            eventDates.value = []
            querySnapshot.forEach((doc) => {
                const dates = datesToArray(doc.data().date)
                eventDates.value.push({
                    dates: dates,
                    title: doc.data().title,
                    who: doc.data().who
                })
            })
        })
    }

    return { currentEventId, currentEventLabel, doneDates, eventDates, setCurrentEvent, resetCurrentEvent, setup, getEvents, getDoneDates }
})
