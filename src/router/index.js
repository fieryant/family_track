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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
