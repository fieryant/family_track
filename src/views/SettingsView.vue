<template>
  <div class="w-full space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-100">Settings</h1>
      <p class="mt-1 text-sm text-slate-400">Manage your catalog data</p>
    </div>

    <div class="space-y-3">
      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 backdrop-blur-xl transition hover:bg-slate-800/70 active:scale-[0.98]"
      >
        <div :class="['flex h-11 w-11 items-center justify-center rounded-xl text-xl', item.bg]">
          {{ item.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-100">{{ item.label }}</p>
          <p class="text-xs text-slate-400 truncate">{{ item.description }}</p>
        </div>
        <svg class="h-4 w-4 flex-shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const menuItems = [
  {
    to: '/settings/unit-types',
    icon: '⚖️',
    bg: 'bg-amber-400/10',
    label: 'Unit Types',
    description: 'weight, volume, count, length',
  },
  {
    to: '/settings/units',
    icon: '📏',
    bg: 'bg-sky-400/10',
    label: 'Units',
    description: 'g, kg, ml, L, pc…',
  },
  {
    to: '/settings/categories',
    icon: '🗂️',
    bg: 'bg-fuchsia-400/10',
    label: 'Categories',
    description: 'Produce, Dairy, Meat…',
  },
  {
    to: '/settings/items',
    icon: '🛒',
    bg: 'bg-emerald-400/10',
    label: 'Items',
    description: 'Manage your item catalog',
  },
]
</script>
