<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePantryStore } from '../stores/pantry'
import { useItemsStore } from '../stores/items'
import { useUnitsStore } from '../stores/units'
import { useCategoriesStore } from '../stores/categories'
import EmptyState from '../components/EmptyState.vue'
import Modal from '../components/Modal.vue'
import FormInput from '../components/FormInput.vue'
import FormSelect from '../components/FormSelect.vue'
import SearchBar from '../components/SearchBar.vue'
import ItemCard from '../components/ItemCard.vue'
import UnitPresetPicker from '../components/UnitPresetPicker.vue'
import type { Item, PantryItem } from '../types'

const pantry = usePantryStore()
const itemsStore = useItemsStore()
const unitsStore = useUnitsStore()
const categoriesStore = useCategoriesStore()

interface PantryRow {
  entry: PantryItem
  name: string
  unitLabel: string
  categoryName: string
  categoryIcon: string
  sortOrder: number
}

const rows = computed<PantryRow[]>(() => {
  return pantry.pantryItems
    .map(entry => {
      const item = itemsStore.byId[entry.item_id]
      const unit = entry.unit_id ? unitsStore.byId[entry.unit_id] : null
      const cat = item?.category_id ? categoriesStore.byId[item.category_id] : null
      return {
        entry,
        name: item?.name ?? 'Unknown item',
        unitLabel: unit?.label ?? '',
        categoryName: cat?.name ?? 'Other',
        categoryIcon: cat?.icon ?? '📦',
        sortOrder: cat?.sort_order ?? 999,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
})

const editing = ref<PantryRow | null>(null)
const editAmount = ref<string>('')
const editUnitId = ref<string>('')

function openEdit(row: PantryRow) {
  editing.value = row
  editAmount.value = String(row.entry.amount)
  editUnitId.value = row.entry.unit_id ?? ''
}

function closeEdit() {
  editing.value = null
}

const editUnitOptions = computed(() => {
  if (!editing.value) return []
  const item = itemsStore.byId[editing.value.entry.item_id]
  if (!item?.unit_type_id) return unitsStore.sorted.map(u => ({ value: u.id, label: u.label }))
  return unitsStore.forType(item.unit_type_id).map(u => ({ value: u.id, label: u.label }))
})

async function saveEdit() {
  if (!editing.value) return
  const amount = parseFloat(editAmount.value)
  if (Number.isNaN(amount) || amount < 0) return
  await pantry.setAmount(editing.value.entry.item_id, amount, editUnitId.value || null)
  closeEdit()
}

async function adjust(row: PantryRow, delta: number) {
  await pantry.adjust(row.entry.item_id, delta, row.entry.unit_id)
}

async function removeRow(row: PantryRow) {
  await pantry.remove(row.entry.item_id)
}

const showAdd = ref(false)
const addSearch = ref('')
const pickerItem = ref<Item | null>(null)

const addCandidates = computed<Item[]>(() => {
  return itemsStore
    .search(addSearch.value)
    .filter(i => i.is_active && !pantry.byItemId[i.id])
    .slice(0, 50)
})

function openAdd() {
  addSearch.value = ''
  showAdd.value = true
}

function pickItem(item: Item) {
  pickerItem.value = item
}

async function handlePickerConfirm({ amount, unit_id }: { amount: number; unit_id: string }) {
  if (!pickerItem.value) return
  await pantry.setAmount(pickerItem.value.id, amount, unit_id || null)
  pickerItem.value = null
  showAdd.value = false
}

onMounted(async () => {
  await Promise.all([
    itemsStore.fetch(),
    unitsStore.fetch(),
    categoriesStore.fetch(),
    pantry.fetch(),
  ])
})
</script>

<template>
  <div class="space-y-4 w-full">
    <div class="flex items-center gap-3">
      <router-link to="/settings"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </router-link>
      <div class="flex-1">
        <h2 class="text-2xl font-bold tracking-tight text-white">Pantry</h2>
        <p class="text-sm text-slate-400">What's currently at home. Auto-updates when you complete a shop.</p>
      </div>
      <button type="button"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xl font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
        aria-label="Add item to pantry"
        @click="openAdd">+</button>
    </div>

    <EmptyState v-if="!pantry.loading && rows.length === 0" title="Pantry is empty"
      message="Items appear here automatically after you complete a shopping session." />

    <div v-else class="space-y-3">
      <div v-for="row in rows" :key="row.entry.id"
        class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
        <button type="button" class="flex-1 min-w-0 text-left" @click="openEdit(row)">
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase tracking-wider text-slate-500">{{ row.categoryIcon }}</span>
            <p class="truncate font-semibold text-white">{{ row.name }}</p>
          </div>
          <p class="text-sm text-cyan-300">{{ row.entry.amount }} {{ row.unitLabel }}</p>
        </button>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-slate-200 transition hover:bg-white/10"
            aria-label="Decrease"
            @click="adjust(row, -1)">−</button>
          <button type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-lg text-cyan-200 transition hover:bg-cyan-400/20"
            aria-label="Increase"
            @click="adjust(row, 1)">+</button>
          <button type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-400/5 text-base text-red-300 transition hover:bg-red-400/15"
            aria-label="Remove"
            @click="removeRow(row)">×</button>
        </div>
      </div>
    </div>

    <Modal :show="showAdd" @close="showAdd = false">
      <div class="space-y-3">
        <h3 class="text-lg font-bold text-white">Add to Pantry</h3>
        <SearchBar v-model="addSearch" placeholder="Search items..." />
        <div class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          <ItemCard v-for="item in addCandidates" :key="item.id" :item="item" :in-list="false" :in-list-amount="''"
            @click="pickItem(item)" />
          <EmptyState v-if="addCandidates.length === 0" title="No matches"
            message="Try a different search, or all items are already in your pantry." />
        </div>
      </div>
    </Modal>

    <UnitPresetPicker :show="!!pickerItem" :item="pickerItem ?? undefined" @close="pickerItem = null"
      @confirm="handlePickerConfirm" />

    <Modal :show="!!editing" @close="closeEdit">
      <div class="space-y-3">
        <h3 v-if="editing" class="text-lg font-bold text-white">Edit {{ editing.name }}</h3>
        <FormInput v-model="editAmount" label="Amount" type="number" />
        <FormSelect v-model="editUnitId" label="Unit" :options="editUnitOptions" />
        <div class="flex gap-3 pt-2">
          <button type="button"
            class="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            @click="closeEdit">Cancel</button>
          <button type="button"
            class="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            @click="saveEdit">Save</button>
        </div>
      </div>
    </Modal>
  </div>
</template>
