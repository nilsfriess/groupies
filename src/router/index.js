import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from 'vuefire'
import HomeView from '../views/HomeView.vue'
import OverviewView from '../views/OverviewView.vue'
import SurveyView from '../views/SurveyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: { name: 'overview' },
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/overview',
      name: 'overview',
      component: OverviewView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/survey/:uid/:qid',
      name: 'survey',
      component: SurveyView,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
})

router.beforeEach(async (to, _) => {
  const user = await getCurrentUser()
  if (to.name === 'login') {
    // If user is already logged in, redirect
    if (user) return { name: 'overview' }
  }

  if (to.name === 'overview') {
    // If user tries to access overview but is not logged in, redirect to login
    if (!user) return { name: 'login' }
  }
})

export default router
