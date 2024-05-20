import { createRouter, createWebHistory } from "vue-router";
import {getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";
import db from "@/firebase/firebase.js";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: () => import("@/views/HomeView.vue")
        },
        {
            path: "/login",
            component: () => import("@/views/LoginView.vue"),
            meta: {
                requiresNoAuth: true
            }
        },
        {
            path: "/register",
            children: [
                {
                    path: '',
                    component: () => import("@/views/Register/RegisterGateView.vue"),
                    meta: {
                        signOutCurrentUser: true
                    }
                },
                {
                    path: "main",
                    component: () => import("@/views/Register/RegisterMainView.vue"),
                    meta: {
                        requiresAuth: true
                    }
                },
                {
                    path: "children",
                    component: () => import("@/views/Register/RegisterAddChildrenView.vue"),
                    meta: {
                    }
                },
            ],
        },
        {
            path: "/member",
            children: [
                {
                    path: '',
                    component: () => import("@/views/Member/MemberView.vue"),
                    meta: {
                        requiresVerifiedAuth: true
                    }
                },
                {
                    path: "event/:id",
                    component: () => import("@/views/Member/EventView.vue"),
                    meta: {
                        requiresVerifiedAuth: true
                    }
                },
            ],
        },
        {
            path: "/admin",
            children: [
                {
                    path: "attendance",
                    component: () => import("@/views/Admin/AttendanceView.vue"),
                },
                {
                    path: "events",
                    component: () => import("@/views/Admin/EventsView.vue"),
                },
                {
                    path: "members",
                    component: () => import("@/views/Admin/MembersView.vue"),
                },
                {
                    path: "door",
                    component: () => import("@/views/Admin/DoorOpeningSystemView.vue"),
                },
            ],
            meta: {
                // TODO
            }
        },
        { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("@/views/NotFoundView.vue") }
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
    else return [docSnap.data().verifiedMember, docSnap.data().children.length > 0];
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
        if (user === null) next("/");
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
