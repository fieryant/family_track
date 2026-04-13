import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { isSupabaseConfigured } from '../lib/supabase'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/add',
    name: 'add',
    component: () => import('../views/AddItemView.vue'),
  },
  {
    path: '/item/:id',
    name: 'item-detail',
    component: () => import('../views/ItemDetailView.vue'),
    props: true,
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    path: '/settings/unit-types',
    name: 'settings-unit-types',
    component: () => import('../views/settings/UnitTypesView.vue'),
  },
  {
    path: '/settings/units',
    name: 'settings-units',
    component: () => import('../views/settings/UnitsView.vue'),
  },
  {
    path: '/settings/categories',
    name: 'settings-categories',
    component: () => import('../views/settings/CategoriesView.vue'),
  },
  {
    path: '/settings/items',
    name: 'settings-items',
    component: () => import('../views/settings/ItemsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (!isSupabaseConfigured) return true

  const authStore = useAuthStore()
  await authStore.initialize()

  if (!authStore.isAuthenticated && to.name !== 'login') {
    return { name: 'login' }
  }

  if (authStore.isAuthenticated && to.name === 'login') {
    return { name: 'home' }
  }
})

export default router
