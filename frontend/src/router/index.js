import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import AppLayout from '../views/AppLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'
import Billing from '../views/Billing.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
      },
      {
        path: 'billing',
        name: 'Billing',
        component: Billing,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Route Guard for Authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('sponso_token');
  const isAuthenticated = !!token;

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected page without auth
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    // Redirect to dashboard if already logged in and trying to access login
    next('/dashboard');
  } else {
    next();
  }
});

// Navigation Error Handler
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('Navigation failed:', failure);
  }
});

export default router
