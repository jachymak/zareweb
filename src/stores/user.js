import {defineStore} from "pinia"
import {computed, ref, watch} from "vue"
import {
    deleteUser,
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "firebase/auth";
import getUserData from "@/firebase/getUserData.js";
import getChildrenData from "@/firebase/getChildrenData.js";
import router from "@/router/router.js";
import isUserInDatabase from "@/firebase/isUserInDatabase.js";

export const useUserStore = defineStore('user', () => {
    const loggedIn = ref(false)
    const auth = ref(null)
    const userData = ref({})
    const childrenData = ref([])

    async function authUser() {
        if (!loggedIn.value) {
            loggedIn.value = true
            auth.value = getAuth()

            userData.value = await getUserData(auth.value.currentUser.uid)
            childrenData.value = await getChildrenData(userData.value.children)
        }
    }

    function signUserIn(email, password) {
        signInWithEmailAndPassword(getAuth(), email.trimEnd(), password)
            .then(async () => {
                await authUser()
                router.push('/member')

            })
            .catch((error) => {
                console.log(error.code);
                // switch (error.code) {
                //     case "auth/invalid-email":
                //         errorMsg.value = "Neplatná e-mailová adresa!";
                //         break;
                //     case "auth/user-not-found":
                //         errorMsg.value = "Uživatel nenalezen!";
                //         break;
                //     case "auth/wrong-password":
                //         errorMsg.value = "Špatné heslo!";
                //         break;
                //     default:
                //         errorMsg.value = "Špatné přihlašovací údaje!"
                // }
            })

    }

    // TODO protect from overwriting e&p account with google account

    function signUserInWithGoogle() {
        const provider = new GoogleAuthProvider();
        signInWithPopup(getAuth(), provider)
            .then((user) => {

                isUserInDatabase(user.user.uid)
                    .then(async (ret) => {
                        if (ret) {
                            await authUser()
                            router.push('/member')
                        }
                        else {
                            console.log(user + " not in database!")
                            const auth = getAuth()
                            const usr = auth.currentUser
                            deleteUser(usr).then(() => {
                                console.log("user deleted")
                            }).catch((error) => {
                                console.log("error with deleting user " + error)
                            })
                            router.push('/login')
                        }
                    })

            })
            .catch((error) => {
                console.log(error);
            });
    };

    function signUserOut() {
        signOut(auth.value).then(() => {
            loggedIn.value = false
            auth.value = null
            userData.value = {}
            childrenData.value = []

            router.push("/");
        })
    }

    return { loggedIn, auth, userData, childrenData, signUserIn, signUserInWithGoogle, authUser, signUserOut }
})
