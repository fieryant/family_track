<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useItemsStore } from '../stores/items'
import { useCategoriesStore } from '../stores/categories'
import { useShopListStore } from '../stores/shopList'
import SearchBar from '../components/SearchBar.vue'
import UnitPresetPicker from '../components/UnitPresetPicker.vue'
import ItemCard from '../components/ItemCard.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EmptyState from '../components/EmptyState.vue'
import CreateItemDialog from '../components/CreateItemDialog.vue'
import Toast from '../components/Toast.vue'
import type { Item } from '../types'

const itemsStore = useItemsStore()
const categoriesStore = useCategoriesStore()
const shopListStore = useShopListStore()

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const showPresetPicker = ref(false)
const selectedItem = ref<Item | null>(null)
const toastMessage = ref('')
const showCreateDialog = ref(false)
const creatingItem = ref(false)
const createDialogRef = ref<InstanceType<typeof CreateItemDialog> | null>(null)
const prefillItemName = ref('')

// Items already in the current list
function isInList(itemId: string) {
  return shopListStore.listItems.some(i => i.item_id === itemId)
}

function inListAmountLabel(itemId: string) {
  const entry = shopListStore.listItems.find(i => i.item_id === itemId)
  if (!entry) return ''
  return `${entry.requested_amount} ${entry._requestedUnitSymbol}`
}

// Frequently bought items (stub: just the first 6 items for now)
const frequentItems = computed(() => {
  return itemsStore.items.filter(i => i.is_active).slice(0, 6)
})

interface CategoryGroup {
  categoryId: string
  name: string
  icon: string
  sort_order: number
  items: Item[]
}

// Filtered items by search + category
const filteredItemsByCategory = computed(() => {
  const searchResults = itemsStore.search(searchQuery.value)
  const byCat: Record<string, CategoryGroup> = {}

  searchResults.forEach(item => {
    if (selectedCategory.value && item.category_id !== selectedCategory.value) return
    const catId = item.category_id || 'uncategorized'
    if (!byCat[catId]) {
      const cat = categoriesStore.byId[catId]
      byCat[catId] = {
        categoryId: catId,
        name: cat?.name || 'Other',
        icon: cat?.icon || '📦',
        sort_order: cat?.sort_order || 999,
        items: [],
      }
    }
    byCat[catId].items.push(item)
  })

  return Object.values(byCat).sort((a, b) => a.sort_order - b.sort_order)
})

function onItemClick(item: Item) {
  if (isInList(item.id)) return // already in list
  selectedItem.value = item
  showPresetPicker.value = true
}

function openCreateDialog(prefillName = '') {
  prefillItemName.value = (prefillName || '').trim()
  showCreateDialog.value = true
}

function closeCreateDialog() {
  showCreateDialog.value = false
  if (createDialogRef.value) {
    createDialogRef.value.reset()
  }
}

async function handleCreateItemSubmit({ name, categoryId, unitTypeId }: { name: string; categoryId: string | null; unitTypeId: string }) {
  creatingItem.value = true

  try {
    const item = await itemsStore.createItem({
      name,
      categoryId,
      unitTypeId,
    })

    closeCreateDialog()
    selectedItem.value = item
    showPresetPicker.value = true
    searchQuery.value = item.name
    selectedCategory.value = item.category_id
  } catch (error) {
    // Error will be displayed in the dialog
    console.error('Failed to create item:', error)
  } finally {
    creatingItem.value = false
  }
}

onMounted(() => {
  categoriesStore.fetch()
  itemsStore.fetch()
  shopListStore.fetch()
})

async function handleAddToList({ amount, unit_id }: { amount: number; unit_id: string }) {
  if (!selectedItem.value) return

  await shopListStore.addItem({
    itemId: selectedItem.value.id,
    itemName: selectedItem.value.name,
    categoryId: selectedItem.value.category_id,
    unitTypeId: selectedItem.value.unit_type_id ?? null,
    amount,
    unitId: unit_id,
  })

  showPresetPicker.value = false

  // Show toast
  toastMessage.value = `${selectedItem.value.name} added!`
  setTimeout(() => { toastMessage.value = '' }, 2000)
  selectedItem.value = null
}
</script>

<template>
  <div id="add-item-view" class="space-y-4 w-full">
    <div class="flex items-center gap-3">
      <router-link to="/"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </router-link>
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Add Items</h2>
        <p class="text-sm text-slate-400">Browse the catalog and add quantities to the active list.</p>
      </div>
    </div>

    <SearchBar v-model="searchQuery" placeholder="Search items..." />

    <div class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p class="text-sm font-medium text-white">Can't find it in the catalog?</p>
        <p class="text-xs text-slate-400">Create a custom item and add it to the list right away.</p>
      </div>
      <button type="button"
        class="shrink-0 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
        @click="openCreateDialog()">
        Add custom item
      </button>
    </div>

    <CategoryFilter v-model="selectedCategory" :categories="categoriesStore.sorted" />

    <section v-if="!searchQuery && !selectedCategory && frequentItems.length > 0" class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frequently Bought</h3>
      <div class="flex flex-col gap-3">
        <ItemCard v-for="item in frequentItems" :key="item.id" :item="item" :in-list="isInList(item.id)"
          :in-list-amount="inListAmountLabel(item.id)" @click="onItemClick(item)" />
      </div>
    </section>

    <section v-for="group in filteredItemsByCategory" :key="group.categoryId" class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ group.icon }} {{ group.name }}</h3>
      <div class="flex flex-col gap-3">
        <ItemCard v-for="item in group.items" :key="item.id" :item="item" :in-list="isInList(item.id)"
          :in-list-amount="inListAmountLabel(item.id)" @click="onItemClick(item)" />
      </div>
    </section>

    <EmptyState v-if="filteredItemsByCategory.length === 0 && searchQuery" title="No items found"
      :message="`Create &quot;${searchQuery}&quot; as a new catalog item.`">
      <template #actions>
        <button type="button"
          class="mt-6 inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          @click="openCreateDialog(searchQuery)">
          Create item
        </button>
      </template>
    </EmptyState>

    <CreateItemDialog ref="createDialogRef" :show="showCreateDialog" :categories="categoriesStore.sorted"
      :loading="creatingItem" error="" :prefill-name="prefillItemName" @close="closeCreateDialog"
      @submit="handleCreateItemSubmit" />

    <!-- Unit preset picker -->
    <UnitPresetPicker :show="showPresetPicker" :item="selectedItem ?? undefined" @close="showPresetPicker = false"
      @confirm="handleAddToList" />

    <!-- Toast notification -->
    <Toast :show="!!toastMessage" :message="toastMessage" />
  </div>
</template>
