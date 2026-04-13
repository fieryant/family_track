<template>
  <div id="item-detail-view" class="space-y-4 w-full">
    <div class="flex items-center gap-3">
      <router-link to="/" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </router-link>
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Item Details</h2>
        <p class="text-sm text-slate-400">Usage insights, size presets, and purchase activity.</p>
      </div>
    </div>

    <div v-if="item" class="space-y-4">
      <div class="rounded-3xl border border-white/10 bg-linear-to-br from-cyan-400/10 via-slate-900 to-fuchsia-400/10 p-6 text-center shadow-lg shadow-black/20">
        <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-5xl ring-1 ring-white/10">{{ categoryIcon }}</div>
        <h2 class="text-3xl font-extrabold tracking-tight text-white">{{ item.name }}</h2>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span class="inline-flex items-center rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">{{ item.default_unit_type }}</span>
          <span class="text-sm text-slate-400">{{ categoryName }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-sm shadow-black/10">
          <span class="block text-2xl font-extrabold text-cyan-300">{{ totalPurchases }}</span>
          <span class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Total Purchases</span>
        </div>
        <div class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-sm shadow-black/10">
          <span class="block text-2xl font-extrabold text-emerald-300">{{ avgMonthlyUsage }}</span>
          <span class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Avg / Month</span>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monthly Usage (Last 6 Months)</h3>
        <div class="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-sm shadow-black/10">
          <div class="flex h-40 items-end gap-3">
            <div
              v-for="(month, idx) in usageData"
              :key="idx"
              class="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div
                class="flex w-full min-h-1 items-start justify-center rounded-t-2xl bg-linear-to-t from-cyan-400 to-fuchsia-500 transition-[height] duration-500"
                :style="{ height: month.heightPercent + '%' }"
              >
                <span class="pt-1 text-[10px] font-bold text-white">{{ month.amount }}</span>
              </div>
              <span class="mt-2 text-xs text-slate-400">{{ month.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available Sizes</h3>
        <div class="flex flex-wrap gap-2">
          <div v-for="preset in presets" :key="preset.id" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
            {{ preset.label }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-16 text-center">
      <h3 class="text-lg font-semibold text-slate-200">Item not found</h3>
      <p class="mt-2 max-w-sm text-sm text-slate-400">This item does not exist or has been removed.</p>
      <router-link to="/" class="mt-6 inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Go Home</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useItemsStore } from '../stores/items'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps({
  id: { type: String, required: true },
})

const itemsStore = useItemsStore()
const categoriesStore = useCategoriesStore()

const item = computed(() => itemsStore.byId[props.id] || null)
const presets = computed(() => itemsStore.presetsForItem(props.id))

const categoryIcon = computed(() => {
  if (!item.value) return '📦'
  return categoriesStore.byId[item.value.category_id ?? '']?.icon || '📦'
})

const categoryName = computed(() => {
  if (!item.value) return 'Unknown'
  return categoriesStore.byId[item.value.category_id ?? '']?.name || 'Unknown'
})

// Stub data for demo (in production, pull from purchase_history)
const totalPurchases = computed(() => Math.floor(Math.random() * 20) + 3)

const usageData = computed(() => {
  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
  const data = months.map(label => ({
    label,
    amount: Math.floor(Math.random() * 3000) + 200,
  }))
  const max = Math.max(...data.map(d => d.amount))
  return data.map(d => ({
    ...d,
    heightPercent: max > 0 ? Math.max((d.amount / max) * 100, 5) : 5,
  }))
})

const avgMonthlyUsage = computed(() => {
  const avg = usageData.value.reduce((sum, d) => sum + d.amount, 0) / usageData.value.length
  if (avg >= 1000) return (avg / 1000).toFixed(1) + ' kg'
  return Math.round(avg) + ' g'
})
</script>
