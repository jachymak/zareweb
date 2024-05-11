import { createRouter, createWebHistory } from "vue-router";
import {getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: () => import("@/views/Home.vue") },
        {
            path: "/login",
            component: () => import("@/views/Login.vue"),
            meta: {
                requiresNoAuth: true
            }
        },
        {
            path: "/register",
            component: () => import("@/views/Register/RegisterGate.vue"),
            meta: {
                signOutCurrentUser: true
            }
        },
        {
            path: "/register/main",
            component: () => import("@/views/Register/RegisterMain.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/register/children",
            component: () => import("@/views/Register/RegisterAddChildren.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/member",
            component: () => import("@/views/Member.vue"),
            meta: {
                requiresVerifiedAuth: true
            }
        },
        {
            path: "/event/:id",
            component: () => import("@/views/Event.vue"),
            meta: {
                requiresVerifiedAuth: true
            }
        },
        {
            path: "/admin/members",
            component: () => import("@/views/Admin/UpdateMembers.vue"),
            meta: {
                // TODO
            }
        },
    ]
});

const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const removeListener = onAuthStateChanged(
            getAuth(),
            (user) => {
                removeListener();
                resolve(user);
            }, reject);
    })
};

const userVerifiedAndChildren = async (user) => {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists()) return [false, false];
    else return [docSnap.data().verifiedMember, docSnap.data().hasChildren];
}

router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (await getCurrentUser()) {
            next();
        } else {
            console.log("You dont have access");
            next("/");
        }
    }

    else if (to.matched.some((record) => record.meta.requiresVerifiedAuth)) {
        const user = await getCurrentUser();
        const verification = await userVerifiedAndChildren(user);
        if (verification[0] && verification[1]) {
            next();
        } else if (verification[0] && !verification[1]) {
            next("/register/children");
        } else {
            console.log("You dont have access, requires verified and has children");
            next("/");
        }
    }

    else if (to.matched.some((record) => record.meta.signOutCurrentUser)) {
        if (await getCurrentUser()) {
            const auth = getAuth();
            await signOut(auth).then(() => {
                console.log("user signed out");
                next();
            })
        } else {
            next();
        }
    }

    else if (to.matched.some((record) => record.meta.requiresNoAuth)) {
        if (await getCurrentUser()) {
            next("/member");
        } else {
            next();
        }
    }

    else {
        next();
    }
});

export default router;
