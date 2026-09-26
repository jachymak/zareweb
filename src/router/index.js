import { createRouter, createWebHistory } from 'vue-router'
import PublicHomeView from '@/views/PublicHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: PublicHomeView },
    // Not implemented yet — placeholders so public links don't dead-end.
    {
      path: '/cekaci-listina',
      name: 'waitlist',
      component: () => import('@/views/ComingSoonView.vue'),
      props: { title: 'Čekací listina' },
    },
    {
      path: '/prihlaseni',
      name: 'login',
      component: () => import('@/views/ComingSoonView.vue'),
      props: { title: 'Přihlášení' },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
