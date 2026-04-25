import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedItems, seedUnitPresets } from '../lib/seedData'
import { useUnitsStore } from './units'
import type { Item, UnitPreset } from '../types'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const unitPresets = ref<UnitPreset[]>([])
  const frequentItemIds = ref<string[]>([])
  const loading = ref(false)

  const byCategory = computed(() => {
    const map: Record<string, Item[]> = {}
    items.value.forEach(item => {
      if (!item.is_active) return
      const catId = item.category_id ?? 'uncategorized'
      if (!map[catId]) map[catId] = []
      map[catId].push(item)
    })
    for (const key in map) {
      map[key].sort((a, b) => a.sort_order - b.sort_order)
    }
    return map
  })

  const byId = computed(() => {
    const map: Record<string, Item> = {}
    items.value.forEach(i => { map[i.id] = i })
    return map
  })

  function presetsForItem(itemId: string): UnitPreset[] {
    return unitPresets.value
      .filter(p => p.item_id === itemId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  function search(query: string): Item[] {
    if (!query) return items.value.filter(i => i.is_active)
    const q = query.toLowerCase()
    return items.value.filter(
      i => i.is_active && i.name.toLowerCase().includes(q)
    )
  }

  function nextSortOrder(categoryId: string | null): number {
    const relevantItems = items.value.filter(item => item.category_id === categoryId)
    const source = relevantItems.length > 0 ? relevantItems : items.value
    return source.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 1
  }

  function findActiveItemByName(name: string): Item | null {
    const normalizedName = name.trim().toLowerCase()
    return items.value.find(item => item.is_active && item.name.trim().toLowerCase() === normalizedName) ?? null
  }

  async function createItem({
    name,
    categoryId = null,
    unitTypeId = null,
    isActive = true,
  }: {
    name: string
    categoryId?: string | null
    unitTypeId?: string | null
    isActive?: boolean
  }): Promise<Item> {
    const trimmedName = name?.trim()
    if (!trimmedName) throw new Error('Item name is required')

    const existingItem = findActiveItemByName(trimmedName)
    if (existingItem) return existingItem

    const newItem: Item = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category_id: categoryId,
      name: trimmedName,
      unit_type_id: unitTypeId,
      is_active: isActive,
      sort_order: nextSortOrder(categoryId),
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('items')
        .insert({
          category_id: newItem.category_id,
          name: newItem.name,
          unit_type_id: newItem.unit_type_id,
          is_active: newItem.is_active,
          sort_order: newItem.sort_order,
        })
        .select('*')
        .single()

      if (error) throw error

      items.value.push(data)
      return data
    }

    items.value.push(newItem)
    return newItem
  }

  async function fetch() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const [itemsRes, presetsRes] = await Promise.all([
          supabase!.from('items').select('*').eq('is_active', true).order('sort_order'),
          supabase!.from('unit_presets').select('*').order('sort_order'),
        ])
        if (itemsRes.error) throw itemsRes.error
        if (presetsRes.error) throw presetsRes.error
        items.value = itemsRes.data
        unitPresets.value = presetsRes.data
      } else {
        items.value = seedItems
        unitPresets.value = seedUnitPresets
      }
    } catch (e) {
      console.error('Failed to fetch items:', e)
      items.value = seedItems
      unitPresets.value = seedUnitPresets
    } finally {
      loading.value = false
    }
  }

  async function updateItem(
    id: string,
    { name, categoryId, unitTypeId, isActive }: { name?: string; categoryId?: string | null; unitTypeId?: string | null; isActive?: boolean }
  ): Promise<Item> {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) throw new Error('Item not found')

    const patch = {
      name: name?.trim() ?? items.value[idx].name,
      category_id: categoryId !== undefined ? categoryId : items.value[idx].category_id,
      unit_type_id: unitTypeId !== undefined ? unitTypeId : items.value[idx].unit_type_id,
      is_active: isActive !== undefined ? isActive : items.value[idx].is_active,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('items')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      items.value[idx] = data
      return data
    }

    items.value[idx] = { ...items.value[idx], ...patch }
    return items.value[idx]
  }

  async function removeItem(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('items').delete().eq('id', id)
      if (error) throw error
    }
    items.value = items.value.filter(i => i.id !== id)
    unitPresets.value = unitPresets.value.filter(p => p.item_id !== id)
  }

  async function saveCustomPreset(itemId: string, amount: number, unitId: string): Promise<void> {
    // Skip if an identical preset already exists for this item
    const duplicate = unitPresets.value.find(
      p => p.item_id === itemId && p.unit_id === unitId && p.amount === amount
    )
    if (duplicate) return

    const unitsStore = useUnitsStore()
    const unit = unitsStore.byId[unitId]
    const label = unit ? `${amount} ${unit.label}` : String(amount)
    const sort_order = presetsForItem(itemId).reduce((max, p) => Math.max(max, p.sort_order), 0) + 1

    const newPreset: UnitPreset = {
      id: `preset-custom-${Date.now()}`,
      item_id: itemId,
      label,
      amount,
      unit_id: unitId,
      sort_order,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('unit_presets')
        .insert({ item_id: itemId, label, amount, unit_id: unitId, sort_order })
        .select('*')
        .single()
      if (error) {
        console.error('Failed to save custom preset:', error)
        return
      }
      unitPresets.value.push(data)
    } else {
      unitPresets.value.push(newPreset)
    }
  }

  async function fetchFrequent(limit = 6): Promise<void> {
    if (!isSupabaseConfigured) {
      frequentItemIds.value = []
      return
    }

    const { useListsStore } = await import('./lists')
    const listsStore = useListsStore()
    if (!listsStore.currentListId) {
      frequentItemIds.value = []
      return
    }

    const { data, error } = await supabase!
      .from('purchase_history')
      .select('item_id, shop_sessions!inner(list_id)')
      .eq('shop_sessions.list_id', listsStore.currentListId)
      .order('bought_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Failed to fetch frequent items:', error)
      frequentItemIds.value = []
      return
    }

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      counts.set(row.item_id, (counts.get(row.item_id) ?? 0) + 1)
    }
    frequentItemIds.value = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)
  }

  async function removePreset(presetId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('unit_presets').delete().eq('id', presetId)
      if (error) {
        console.error('Failed to remove preset:', error)
        return
      }
    }
    unitPresets.value = unitPresets.value.filter(p => p.id !== presetId)
  }

  return { items, unitPresets, frequentItemIds, loading, byCategory, byId, presetsForItem, search, fetch, fetchFrequent, createItem, updateItem, removeItem, saveCustomPreset, removePreset }
})
