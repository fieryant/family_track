<template>
  <header
    id="app-header"
    class="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
  >
    <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
      <h1 class="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <span class="text-2xl">🛒</span>
        Family Market
      </h1>

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

<script setup lang="ts">
import { useShopListStore } from '../stores/shopList'
const shopListStore = useShopListStore()
</script>
