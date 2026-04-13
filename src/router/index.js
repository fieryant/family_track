import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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

export default router
