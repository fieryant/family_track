import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useSessionStore } from './session'
import { useCategoriesStore } from './categories'

export const useShopListStore = defineStore('shopList', () => {
  const listItems = ref([])
  const loading = ref(false)
  const shoppingMode = ref(false)

  // Items grouped by category
  const groupedByCategory = computed(() => {
    const categoriesStore = useCategoriesStore()
    const groups = {}

    listItems.value.forEach(item => {
      const catId = item._categoryId || 'uncategorized'
      if (!groups[catId]) {
        const cat = categoriesStore.byId[catId]
        groups[catId] = {
          category: cat || { id: catId, name: 'Other', icon: '📦', sort_order: 999 },
          items: [],
        }
      }
      groups[catId].items.push(item)
    })

    return Object.values(groups).sort(
      (a, b) => a.category.sort_order - b.category.sort_order
    )
  })

  // Summary counts
  const summary = computed(() => {
    const total = listItems.value.length
    const bought = listItems.value.filter(i => i.status === 'bought').length
    const partial = listItems.value.filter(i => i.status === 'partial').length
    const pending = listItems.value.filter(i => i.status === 'pending').length
    const removed = listItems.value.filter(i => i.status === 'removed').length
    return { total, bought, partial, pending, removed }
  })

  // Fetch list items for the active session
  async function fetch() {
    const sessionStore = useSessionStore()
    if (!sessionStore.activeSession) return

    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('shop_list_items')
          .select(`
            *,
            item:items(name, category_id, default_unit_type)
          `)
          .eq('session_id', sessionStore.activeSession.id)
          .order('added_at')

        if (error) throw error
        listItems.value = data.map(d => ({
          ...d,
          _name: d.item?.name || 'Unknown',
          _categoryId: d.item?.category_id || null,
          _unitType: d.item?.default_unit_type || 'count',
        }))
      }
      // In local mode, listItems is managed entirely in-memory
    } catch (e) {
      console.error('Failed to fetch shop list:', e)
    } finally {
      loading.value = false
    }
  }

  // Add an item to the shop list
  async function addItem({ itemId, itemName, categoryId, unitType, amount, unit }) {
    const sessionStore = useSessionStore()
    if (!sessionStore.activeSession) return

    // Check if already in list
    const exists = listItems.value.find(i => i.item_id === itemId)
    if (exists) return exists

    const newItem = {
      id: 'sli-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      session_id: sessionStore.activeSession.id,
      item_id: itemId,
      requested_amount: amount,
      requested_unit: unit,
      status: 'pending',
      bought_amount: null,
      bought_unit: null,
      note: null,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _name: itemName,
      _categoryId: categoryId,
      _unitType: unitType,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('shop_list_items')
        .insert({
          session_id: newItem.session_id,
          item_id: itemId,
          requested_amount: amount,
          requested_unit: unit,
        })
        .select(`
          *,
          item:items(name, category_id, default_unit_type)
        `)
        .single()

      if (error) throw error
      const mapped = {
        ...data,
        _name: data.item?.name || itemName,
        _categoryId: data.item?.category_id || categoryId,
        _unitType: data.item?.default_unit_type || unitType,
      }
      listItems.value.push(mapped)
      return mapped
    } else {
      listItems.value.push(newItem)
      return newItem
    }
  }

  // Update item status
  async function updateStatus(listItemId, status, boughtAmount = null, boughtUnit = null) {
    const idx = listItems.value.findIndex(i => i.id === listItemId)
    if (idx === -1) return

    listItems.value[idx] = {
      ...listItems.value[idx],
      status,
      bought_amount: boughtAmount,
      bought_unit: boughtUnit,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      const update = { status }
      if (boughtAmount !== null) update.bought_amount = boughtAmount
      if (boughtUnit !== null) update.bought_unit = boughtUnit

      await supabase
        .from('shop_list_items')
        .update(update)
        .eq('id', listItemId)
    }
  }

  // Remove item from list
  async function removeItem(listItemId) {
    listItems.value = listItems.value.filter(i => i.id !== listItemId)

    if (isSupabaseConfigured) {
      await supabase
        .from('shop_list_items')
        .delete()
        .eq('id', listItemId)
    }
  }

  // Toggle bought status (for shopping mode quick-tap)
  async function toggleBought(listItemId) {
    const item = listItems.value.find(i => i.id === listItemId)
    if (!item) return
    const newStatus = item.status === 'bought' ? 'pending' : 'bought'
    const boughtAmount = newStatus === 'bought' ? item.requested_amount : null
    const boughtUnit = newStatus === 'bought' ? item.requested_unit : null
    await updateStatus(listItemId, newStatus, boughtAmount, boughtUnit)
  }

  // Carry pending items into the next session after completion
  async function carryPendingToSession(sessionId) {
    const pendingItems = listItems.value.filter(i => i.status === 'pending')

    if (pendingItems.length === 0) {
      listItems.value = []
      return
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('shop_list_items')
        .insert(
          pendingItems.map(item => ({
            session_id: sessionId,
            item_id: item.item_id,
            requested_amount: item.requested_amount,
            requested_unit: item.requested_unit,
          }))
        )
        .select(`
          *,
          item:items(name, category_id, default_unit_type)
        `)

      if (error) throw error

      listItems.value = data.map(d => ({
        ...d,
        _name: d.item?.name || 'Unknown',
        _categoryId: d.item?.category_id || null,
        _unitType: d.item?.default_unit_type || 'count',
      }))
      return
    }

    listItems.value = pendingItems.map(item => ({
      ...item,
      id: 'sli-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      session_id: sessionId,
      status: 'pending',
      bought_amount: null,
      bought_unit: null,
      updated_at: new Date().toISOString(),
    }))
  }

  // Clear the list (after session complete)
  function clearList() {
    listItems.value = []
  }

  // Toggle shopping mode
  function toggleShoppingMode() {
    shoppingMode.value = !shoppingMode.value
  }

  return {
    listItems,
    loading,
    shoppingMode,
    groupedByCategory,
    summary,
    fetch,
    addItem,
    updateStatus,
    removeItem,
    toggleBought,
    carryPendingToSession,
    clearList,
    toggleShoppingMode,
  }
})
