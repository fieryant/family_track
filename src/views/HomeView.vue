<template>
  <div id="home-view" class="space-y-4 w-full">
    <div v-if="shopListStore.shoppingMode && shopListStore.listItems.length > 0" class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20">
      <div class="h-2 overflow-hidden rounded-full bg-white/5">
        <div class="h-full rounded-full bg-linear-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-[width] duration-300" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{{ shopListStore.summary.bought + shopListStore.summary.partial }} / {{ shopListStore.summary.total }} items</span>
        <span class="font-bold text-emerald-300">{{ progressPercent }}%</span>
      </div>
    </div>

    <div v-if="shopListStore.listItems.length > 0" class="flex gap-2 overflow-x-auto pb-1">
      <button type="button" class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition" :class="filter === 'all' ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'" @click="filter = 'all'">
        All ({{ shopListStore.summary.total }})
      </button>
      <button type="button" class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition" :class="filter === 'pending' ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'" @click="filter = 'pending'">
        Pending ({{ shopListStore.summary.pending }})
      </button>
      <button type="button" class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition" :class="filter === 'bought' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'" @click="filter = 'bought'">
        Bought ({{ shopListStore.summary.bought }})
      </button>
    </div>

    <div v-if="filteredGroups.length > 0" class="space-y-3">
      <CategoryGroup
        v-for="group in filteredGroups"
        :key="group.category.id"
        :category="group.category"
        :items="group.items"
      >
        <ShopListItem
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          :shopping-mode="shopListStore.shoppingMode"
          @toggle="handleToggle($event)"
          @partial="handlePartial($event)"
          @remove="shopListStore.removeItem($event)"
        />
      </CategoryGroup>
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-16 text-center text-slate-400">
      <svg class="mb-5 h-20 w-20 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <h3 class="text-lg font-semibold text-slate-200">Your list is empty</h3>
      <p class="mt-2 max-w-sm text-sm text-slate-400">Tap the + button below to add items for your next shopping trip</p>
      <router-link id="go-add-btn" to="/add" class="mt-6 inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
        Add Items
      </router-link>
    </div>

    <router-link v-if="!shopListStore.shoppingMode && shopListStore.listItems.length > 0" id="fab-add" to="/add" class="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white shadow-lg shadow-cyan-400/30 transition hover:scale-105 active:scale-95">
      <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </router-link>

    <button
      v-if="shopListStore.shoppingMode && shopListStore.summary.bought + shopListStore.summary.partial > 0"
      id="complete-session-btn"
      class="fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 active:scale-[0.99]"
      @click="showCompleteDialog = true"
    >
      Complete Shopping
    </button>

    <BuyConfirmDialog
      :show="showBuyDialog"
      :item="buyDialogItem ?? undefined"
      :mode="buyDialogMode"
      @close="showBuyDialog = false"
      @confirm="handleBuyConfirm"
    />

    <SessionCompleteDialog
      :show="showCompleteDialog"
      :summary="shopListStore.summary"
      @close="showCompleteDialog = false"
      @confirm="handleCompleteSession"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ShopListItem as ShopListItemData } from '../types'
import { useShopListStore } from '../stores/shopList'
import { useSessionStore } from '../stores/session'
import { useCategoriesStore } from '../stores/categories'
import { useItemsStore } from '../stores/items'
import { useUnitsStore } from '../stores/units'
import CategoryGroup from '../components/CategoryGroup.vue'
import ShopListItem from '../components/ShopListItem.vue'
import BuyConfirmDialog from '../components/BuyConfirmDialog.vue'
import SessionCompleteDialog from '../components/SessionCompleteDialog.vue'

const shopListStore = useShopListStore()
const sessionStore = useSessionStore()
const categoriesStore = useCategoriesStore()
const itemsStore = useItemsStore()
const unitsStore = useUnitsStore()

const filter = ref('all')
const showBuyDialog = ref(false)
const buyDialogMode = ref<'bought' | 'partial'>('bought')
const buyDialogItem = ref<ShopListItemData | null>(null)
const showCompleteDialog = ref(false)

const filteredGroups = computed(() => {
  return shopListStore.groupedByCategory
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (filter.value === 'all') return item.status !== 'removed'
        return item.status === filter.value
      }),
    }))
    .filter(group => group.items.length > 0)
})

const progressPercent = computed(() => {
  const { total, bought, partial, removed } = shopListStore.summary
  const active = total - removed
  if (active === 0) return 0
  return Math.round(((bought + partial) / active) * 100)
})

function handleToggle(itemId: string) {
  const item = shopListStore.listItems.find(i => i.id === itemId)
  if (!item) return
  if (item.status === 'bought') {
    shopListStore.updateStatus(item.id, 'pending', null, null, null)
  } else {
    buyDialogItem.value = item
    buyDialogMode.value = 'bought'
    showBuyDialog.value = true
  }
}

function handlePartial(item: ShopListItemData) {
  buyDialogItem.value = item
  buyDialogMode.value = 'partial'
  showBuyDialog.value = true
}

async function handleBuyConfirm({ amount, unit_id, price }: { amount: number; unit_id: string; price: number | null }) {
  if (!buyDialogItem.value) return
  const status = buyDialogMode.value
  await shopListStore.updateStatus(buyDialogItem.value.id, status, amount, unit_id, price)
  showBuyDialog.value = false
  buyDialogItem.value = null
}

async function handleCompleteSession() {
  const boughtItems = shopListStore.listItems.filter(i => i.status === 'bought' || i.status === 'partial')
  await sessionStore.completeSession(boughtItems)
  if (sessionStore.activeSession?.id) {
    await shopListStore.carryPendingToSession(sessionStore.activeSession.id)
  } else {
    shopListStore.clearList()
  }
  shopListStore.shoppingMode = false
  showCompleteDialog.value = false
}

onMounted(async () => {
  await Promise.all([
    categoriesStore.fetch(),
    itemsStore.fetch(),
    unitsStore.fetch(),
    sessionStore.fetchActive(),
  ])
  await shopListStore.fetch()
})
</script>