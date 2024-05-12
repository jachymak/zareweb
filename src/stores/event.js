import {defineStore} from "pinia"
import {ref} from "vue"
import {doc, onSnapshot} from "firebase/firestore";
import db from "@/firebase/firebase.js";

export const useEventStore = defineStore('event', () => {
    const currentEventId = ref("")
    const currentEventLabel = ref({})

    function setCurrentEvent(id, title, who) {
        currentEventId.value = id
        currentEventLabel.value.title = title
        currentEventLabel.value.who = who
    }

    function resetCurrentEvent() {
        currentEventId.value = ""
        currentEventLabel.value = {}
    }

    // function getCurrentEventData(eventId) {
    //     return onSnapshot(doc(db, "events", eventId), (doc) => {
    //         infoPar.value = doc.data().info.infoPar;
    //
    //         whereName.value = doc.data().info.where.whereName;
    //         whereUrl.value = doc.data().info.where.whereUrl;
    //
    //         meetingPamatnik.value = doc.data().info.meeting.meetingPamatnik;
    //         meetingHlavak.value = doc.data().info.meeting.meetingHlavak;
    //         meetingCustom.value = doc.data().info.meeting.meetingCustom;
    //
    //         returnPamatnik.value = doc.data().info.return.returnPamatnik;
    //         returnHlavak.value = doc.data().info.return.returnHlavak;
    //         returnCustom.value = doc.data().info.return.returnCustom;
    //
    //         money.value = doc.data().info.money;
    //
    //         itemsDefault.value = doc.data().info.items.itemsDefault;
    //         itemsCustom.value = doc.data().info.items.itemsCustomList.join(", ");
    //
    //         food.value = doc.data().info.food;
    //
    //         infoPublished.value = doc.data().infoPublished;
    //     })
    // }

    return { currentEventId, currentEventLabel, setCurrentEvent, resetCurrentEvent }
})
