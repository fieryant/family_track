import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedItems, seedUnitPresets, buildUnitPresetsForItem } from '../lib/seedData'

export const useItemsStore = defineStore('items', () => {
  const items = ref([])
  const unitPresets = ref([])
  const loading = ref(false)

  // Items grouped by category
  const byCategory = computed(() => {
    const map = {}
    items.value.forEach(item => {
      if (!item.is_active) return
      const catId = item.category_id || 'uncategorized'
      if (!map[catId]) map[catId] = []
      map[catId].push(item)
    })
    // sort each group
    for (const key in map) {
      map[key].sort((a, b) => a.sort_order - b.sort_order)
    }
    return map
  })

  const byId = computed(() => {
    const map = {}
    items.value.forEach(i => { map[i.id] = i })
    return map
  })

  // Get unit presets for a specific item
  function presetsForItem(itemId) {
    return unitPresets.value
      .filter(p => p.item_id === itemId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  // Search items
  function search(query) {
    if (!query) return items.value.filter(i => i.is_active)
    const q = query.toLowerCase()
    return items.value.filter(
      i => i.is_active && i.name.toLowerCase().includes(q)
    )
  }

  function nextSortOrder(categoryId) {
    const relevantItems = items.value.filter(item => item.category_id === categoryId)
    const source = relevantItems.length > 0 ? relevantItems : items.value
    return source.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 1
  }

  function findActiveItemByName(name) {
    const normalizedName = name.trim().toLowerCase()
    return items.value.find(item => item.is_active && item.name.trim().toLowerCase() === normalizedName) || null
  }

  async function createItem({ name, categoryId = null, unitType = 'count', isActive = true }) {
    const trimmedName = name?.trim()
    if (!trimmedName) {
      throw new Error('Item name is required')
    }

    const existingItem = findActiveItemByName(trimmedName)
    if (existingItem) {
      return existingItem
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category_id: categoryId,
      name: trimmedName,
      default_unit_type: unitType,
      is_active: isActive,
      sort_order: nextSortOrder(categoryId),
    }

    const presets = buildUnitPresetsForItem(newItem.id, newItem.default_unit_type)

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('items')
        .insert({
          category_id: newItem.category_id,
          name: newItem.name,
          default_unit_type: newItem.default_unit_type,
          is_active: newItem.is_active,
          sort_order: newItem.sort_order,
        })
        .select('*')
        .single()

      if (error) throw error

      const { error: presetError } = await supabase
        .from('unit_presets')
        .insert(presets.map(({ id, ...preset }) => preset))

      if (presetError) {
        console.error('Failed to create unit presets for item:', presetError)
      }

      items.value.push(data)
      unitPresets.value.push(...presets)
      return data
    }

    items.value.push(newItem)
    unitPresets.value.push(...presets)
    return newItem
  }

  async function fetch() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const [itemsRes, presetsRes] = await Promise.all([
          supabase.from('items').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('unit_presets').select('*').order('sort_order'),
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

  return { items, unitPresets, loading, byCategory, byId, presetsForItem, search, fetch, createItem }
})
