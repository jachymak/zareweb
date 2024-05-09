import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
            path: "/member",
            component: () => import("@/views/Member.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/event/:id",
            component: () => import("@/views/Event.vue"),
            meta: {
                requiresAuth: true
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

router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (await getCurrentUser()) {
            next();
        } else {
            console.log("You dont have access");
            next("/");
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
