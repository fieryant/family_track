<template>
  <div class="w-full space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/settings" class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/60 text-slate-400 transition hover:text-slate-100">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </router-link>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-slate-100">Items</h1>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
        @click="openAdd"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search items…"
        class="w-full rounded-2xl border border-white/10 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
      />
    </div>

    <!-- Loading -->
    <div v-if="itemsStore.loading" class="flex items-center justify-center py-12 text-slate-400 text-sm">Loading…</div>

    <!-- List -->
    <template v-else>
      <div v-if="filteredItems.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-10 text-center text-slate-400 text-sm">
        {{ searchQuery ? 'No items match your search.' : 'No items yet. Add one above.' }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
          :class="{ 'opacity-50': !item.is_active }"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-slate-100 truncate">{{ localizedName(item, localeStore.currentLocale) }}</p>
            <p class="text-xs text-slate-500">
              {{ categoryName(item.category_id) }} · {{ item.unit_type_id ? unitTypesStore.byId[item.unit_type_id]?.label : '—' }}
              <span v-if="!item.is_active" class="ml-1 rounded bg-slate-700 px-1 py-0.5 text-[10px] text-slate-400">inactive</span>
            </p>
          </div>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-400/10 hover:text-sky-300" @click="openEdit(item)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-400/10 hover:text-red-400" @click="confirmDelete(item)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Add / Edit Modal -->
    <Modal :show="showForm" @close="closeForm">
      <h2 class="mb-5 text-lg font-semibold text-slate-100">{{ editing ? 'Edit Item' : 'Add Item' }}</h2>
      <div class="space-y-4">
        <FormInput v-model="form.name" label="Name (English)" placeholder="e.g. Brown Rice" :autofocus="true" :maxlength="80" />
        <FormInput v-model="form.nameBn" label="নাম (বাংলা)" placeholder="যেমন: বাদামি চাল" :maxlength="80" />
        <FormSelect v-model="form.categoryId" label="Category" :options="categoryOptions" />
        <FormSelect v-model="form.unitTypeId" label="Unit Type" :options="unitTypeOptions" />
        <label class="flex items-center gap-3 cursor-pointer">
          <div
            class="relative h-6 w-11 rounded-full transition"
            :class="form.isActive ? 'bg-emerald-500' : 'bg-slate-700'"
            @click="form.isActive = !form.isActive"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              :class="form.isActive ? 'translate-x-5' : 'translate-x-0'"
            />
          </div>
          <span class="text-sm font-medium text-slate-200">Active</span>
        </label>
      </div>
      <div class="mt-6 flex gap-3">
        <button class="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5" @click="closeForm">Cancel</button>
        <button
          class="flex-1 rounded-2xl bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
          :disabled="saving || !form.name.trim()"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </Modal>

    <!-- Delete Confirm Modal -->
    <Modal :show="showDelete" @close="showDelete = false">
      <h2 class="mb-2 text-lg font-semibold text-slate-100">Delete Item?</h2>
      <p class="mb-6 text-sm text-slate-400">
        "<span class="text-slate-200">{{ deleteTarget ? localizedName(deleteTarget, localeStore.currentLocale) : '' }}</span>" and all its unit presets will be permanently removed.
      </p>
      <div class="flex gap-3">
        <button class="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5" @click="showDelete = false">Cancel</button>
        <button class="flex-1 rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40" :disabled="saving" @click="doDelete">
          {{ saving ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Modal from '../../components/Modal.vue'
import FormInput from '../../components/FormInput.vue'
import FormSelect from '../../components/FormSelect.vue'
import { useItemsStore } from '../../stores/items'
import { useCategoriesStore } from '../../stores/categories'
import { useUnitTypesStore } from '../../stores/unitTypes'
import { useLocaleStore } from '../../stores/locale'
import { localizedName } from '../../lib/i18nName'
import type { Item } from '../../types'

const itemsStore = useItemsStore()
const categoriesStore = useCategoriesStore()
const unitTypesStore = useUnitTypesStore()
const localeStore = useLocaleStore()

const showForm = ref(false)
const showDelete = ref(false)
const saving = ref(false)
const editing = ref<Item | null>(null)
const deleteTarget = ref<Item | null>(null)
const searchQuery = ref('')

const defaultUnitTypeId = () => unitTypesStore.sorted[0]?.id ?? ''
const form = reactive({ name: '', nameBn: '', categoryId: '', unitTypeId: '', isActive: true })

const categoryOptions = computed(() => [
  { value: '', label: '— No category —' },
  ...categoriesStore.sorted.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` })),
])

const unitTypeOptions = computed(() =>
  unitTypesStore.sorted.map(ut => ({ value: ut.id, label: ut.label }))
)

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const all = [...itemsStore.items].sort((a, b) =>
    localizedName(a, localeStore.currentLocale).localeCompare(localizedName(b, localeStore.currentLocale))
  )
  if (!q) return all
  return all.filter(i => {
    const hay = [i.name, ...(i.translations?.map(t => t.value) ?? [])]
    return hay.some(n => n.toLowerCase().includes(q))
  })
})

function categoryName(catId: string | null | undefined) {
  if (!catId) return 'Uncategorized'
  return categoriesStore.byId[catId]?.name ?? 'Uncategorized'
}

function openAdd() {
  editing.value = null
  form.name = ''
  form.nameBn = ''
  form.categoryId = ''
  form.unitTypeId = defaultUnitTypeId()
  form.isActive = true
  showForm.value = true
}

function openEdit(item: Item) {
  editing.value = item
  form.name = item.name
  form.nameBn = item.translations?.find(t => t.locale === 'bn' && t.field === 'name')?.value ?? ''
  form.categoryId = item.category_id ?? ''
  form.unitTypeId = item.unit_type_id ?? defaultUnitTypeId()
  form.isActive = item.is_active
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function save() {
  saving.value = true
  const translations = form.nameBn.trim() ? { bn: form.nameBn.trim() } : {}
  try {
    if (editing.value) {
      await itemsStore.updateItem(editing.value.id, {
        name: form.name,
        categoryId: form.categoryId || null,
        unitTypeId: form.unitTypeId || null,
        isActive: form.isActive,
        translations,
      })
    } else {
      await itemsStore.createItem({
        name: form.name,
        categoryId: form.categoryId || null,
        unitTypeId: form.unitTypeId || null,
        isActive: form.isActive,
        translations,
      })
    }
    closeForm()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

function confirmDelete(item: Item) {
  deleteTarget.value = item
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await itemsStore.removeItem(deleteTarget.value.id)
    showDelete.value = false
    deleteTarget.value = null
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([categoriesStore.fetch(), itemsStore.fetch(), unitTypesStore.fetch()])
})
</script>
