import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Intro",
    component: () => import("@/views/IntroView.vue"),
  },
  {
    path: "/home",
    component: () => import("@/views/HomeView.vue"),
    meta: { fromIntro: true },
    children: [
      { path: "", redirect: "/home/about" },
      { path: ":page", name: "Home" },
    ],
  },
  {
    path: "/member",
    component: () => import("@/views/MemberView.vue"),
  },
  {
    path: "/admin",
    component: () => import("@/views/AdminView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
