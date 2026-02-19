import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import App from '../App.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: App,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
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
