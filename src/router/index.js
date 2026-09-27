import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
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
    {
      path: '/clenove',
      name: 'parent-home',
      component: () => import('@/views/ParentHomeView.vue'),
      meta: { auth: true, roles: ['parent'] },
    },
    // Leaders see every poster, unpublished ones as a preview.
    {
      path: '/clenove/akce/:eventId',
      name: 'event-poster',
      component: () => import('@/views/EventPosterView.vue'),
      props: true,
      meta: { auth: true, roles: ['parent', ...LEADERS] },
    },
    {
      path: '/clenove/fotky',
      name: 'albums',
      component: () => import('@/views/AlbumsView.vue'),
      meta: { auth: true, roles: ['parent', ...LEADERS] },
    },
    {
      path: '/clenove/fotky/:albumId',
      name: 'album',
      component: () => import('@/views/AlbumView.vue'),
      props: true,
      meta: { auth: true, roles: ['parent', ...LEADERS] },
    },
    {
      path: '/vedouci',
      name: 'leader-home',
      component: () => import('@/views/LeaderHomeView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/dochazka',
      name: 'leader-attendance',
      component: () => import('@/views/AttendanceView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/akce',
      name: 'leader-events',
      component: () => import('@/views/EventsView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/aktuality',
      name: 'leader-news',
      component: () => import('@/views/NewsView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/klubovna',
      name: 'leader-clubhouse',
      component: () => import('@/views/ClubhouseView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/cekaci-listina',
      name: 'leader-waitlist',
      component: () => import('@/views/WaitlistAdminView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/fotky',
      name: 'leader-albums',
      component: () => import('@/views/LeaderAlbumsView.vue'),
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/fotky/:albumId',
      name: 'leader-album',
      component: () => import('@/views/LeaderAlbumView.vue'),
      props: true,
      meta: { auth: true, roles: LEADERS },
    },
    {
      path: '/vedouci/nahled',
      name: 'leader-preview',
      component: () => import('@/views/LeaderPreviewView.vue'),
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
    // Opening / closing a photo in an album keeps the page where it is.
    if (to.path === from.path && (to.query.photo || from.query.photo)) return false
    if (savedPosition) return savedPosition
    // Pages that load their content later scroll to the hash themselves.
    if (to.hash && document.querySelector(to.hash)) return { el: to.hash, behavior: 'smooth' }
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

// Whether the current page is the first one after the page (re)load, not an
// in-app navigation. Set before the new page's components are created.
let firstPage = true
router.afterEach((to, from) => {
  firstPage = from === START_LOCATION
})
export const isFirstPage = () => firstPage

export default router
