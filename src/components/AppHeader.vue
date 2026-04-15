<script setup lang="ts">
import { useShopListStore } from '../stores/shopList'
import { useListsStore } from '../stores/lists'
const shopListStore = useShopListStore()
const listsStore = useListsStore()
</script>

<template>
  <header
    id="app-header"
    class="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
  >
    <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
      <!-- List name / switcher -->
      <router-link
        to="/lists"
        class="group flex items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-white/5"
      >
        <span class="text-2xl">🛒</span>
        <div class="min-w-0">
          <p class="truncate text-sm font-bold leading-tight text-white max-w-35">
            {{ listsStore.currentList?.name ?? 'Family Market' }}
          </p>
          <p class="text-[10px] leading-none text-slate-500 group-hover:text-slate-400">
            Switch list
          </p>
        </div>
        <svg class="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </router-link>

      <button
        v-if="shopListStore.listItems.length > 0"
        id="mode-toggle"
        type="button"
        :class="[
          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.98]',
          shopListStore.shoppingMode
            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.12)]'
            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
        ]"
        @click="shopListStore.toggleShoppingMode"
      >
        <svg
          v-if="!shopListStore.shoppingMode"
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <svg
          v-else
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span>{{ shopListStore.shoppingMode ? 'Shopping' : 'List' }}</span>
      </button>
    </div>
  </header>
</template>
