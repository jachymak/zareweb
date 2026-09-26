import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PublicHomeView from '@/views/PublicHomeView.vue'

const LEADERS = ['leader', 'admin']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: PublicHomeView },
    {
      path: '/cekaci-listina',
      name: 'waitlist',
      component: () => import('@/views/WaitlistView.vue'),
    },
    {
      path: '/cekaci-listina/obnovit/:token',
      name: 'waitlist-renewal',
      component: () => import('@/views/WaitlistRenewalView.vue'),
      props: true,
    },
    {
      path: '/prihlaseni',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { auth: true },
    },
    // Signed-in areas — placeholders until their pages exist.
    {
      path: '/clenove',
      name: 'parent-home',
      component: () => import('@/views/AreaComingSoonView.vue'),
      props: { area: 'pro členy', title: 'Stránka pro členy' },
      meta: { auth: true, roles: ['parent'] },
    },
    {
      path: '/vedouci',
      name: 'leader-home',
      component: () => import('@/views/AreaComingSoonView.vue'),
      props: { area: 'pro vedoucí', title: 'Stránka pro vedoucí' },
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/administrace',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { auth: true, roles: ['admin'] },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// Where a user may not be on `to`, or null. Signed-out users go to login
// (and come back after it); signed-in ones go to their home, or to login,
// which shows their account status.
export function redirectFor(to, auth) {
  const roles = to.meta.roles
  if (!roles || roles.includes(auth.role)) return null
  if (!auth.user) return { name: 'login', query: { next: to.fullPath } }
  return auth.homeRoute ?? { name: 'login' }
}

router.beforeEach(async (to) => {
  if (!to.meta.auth) return
  const auth = useAuthStore()
  await auth.init()
  return redirectFor(to, auth) ?? undefined
})

export default router
